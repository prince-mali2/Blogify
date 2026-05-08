import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Redis client — created once per cold start (Upstash REST is HTTP-based,
// safe to use in serverless with no persistent connections).
// Falls back gracefully if env vars are not set (dev without Redis).
// ---------------------------------------------------------------------------
let redis: Redis | null = null;
try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch {
  redis = null;
}

// ---------------------------------------------------------------------------
// Key helpers
// ---------------------------------------------------------------------------
const sigKey = (streamId: string) => `signals:${streamId}`;
const viewKey = (streamId: string) => `viewers:${streamId}`;
const SIGNAL_TTL = 3600; // 1 hour
const MAX_SIGNALS = 200;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SignalMessage {
  id: string;
  streamId: string;
  fromId: string;
  toId: string;
  type: string;
  payload: unknown;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// GET — poll for new signals since `after` timestamp
// ---------------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  const { streamId } = await params;
  const { searchParams } = new URL(req.url);
  const after = parseInt(searchParams.get('after') || '0');
  const viewerId = searchParams.get('viewerId') || '';

  const serverTime = Date.now();

  if (!redis) {
    // No Redis configured — return empty (dev fallback)
    return NextResponse.json({ signals: [], viewerCount: 0, serverTime });
  }

  try {
    // zrange with byScore replaces zrangebyscore in @upstash/redis
    const raw = await redis.zrange(
      sigKey(streamId),
      after + 1,
      '+inf',
      { byScore: true }
    );

    const all: SignalMessage[] = (raw as unknown[])
      .map((s) => {
        try {
          if (typeof s === 'string') return JSON.parse(s) as SignalMessage;
          return s as SignalMessage;
        } catch { return null; }
      })
      .filter(Boolean) as SignalMessage[];

    // Filter to signals relevant for this viewer/broadcaster.
    // ALWAYS include broadcast signals (toId === 'all') so the broadcaster
    // receives viewer-joined events regardless of its own viewerId.
    const signals = viewerId
      ? all.filter(
          (s) =>
            s.toId === 'all' ||          // broadcast to everyone
            s.toId === viewerId ||       // addressed to me
            s.fromId === viewerId        // sent by me (loop-back for debugging)
        )
      : all;

    // Viewer count
    const viewerCount = (await redis.scard(viewKey(streamId))) ?? 0;

    return NextResponse.json({ signals, viewerCount, serverTime });
  } catch (err) {
    console.error('Signal GET error:', err);
    return NextResponse.json({ signals: [], viewerCount: 0, serverTime });
  }
}

// ---------------------------------------------------------------------------
// POST — add a signal
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  const { streamId } = await params;
  const body = await req.json();
  const { type, fromId, toId, payload } = body;

  if (!redis) {
    // No Redis configured — silently succeed (dev fallback)
    return NextResponse.json({ ok: true });
  }

  try {
    const now = Date.now();
    const signal: SignalMessage = {
      id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      streamId,
      fromId,
      toId: toId || 'all',
      type,
      payload,
      createdAt: now,
    };

    // ---- Viewer tracking ----
    if (type === 'viewer-joined') {
      await redis.sadd(viewKey(streamId), fromId);
      await redis.expire(viewKey(streamId), SIGNAL_TTL);
    }
    if (type === 'viewer-left') {
      await redis.srem(viewKey(streamId), fromId);
      return NextResponse.json({ ok: true });
    }
    if (type === 'broadcaster-ready') {
      // Update Neon DB so any viewer who loads the page sees LIVE status
      prisma.liveStream
        .update({ where: { id: streamId }, data: { status: 'LIVE' } })
        .catch(() => {});
    }
    if (type === 'stream-ended') {
      await redis.del(viewKey(streamId));
      // Update Neon DB back to OFFLINE
      prisma.liveStream
        .update({ where: { id: streamId }, data: { status: 'OFFLINE' } })
        .catch(() => {});
    }

    // ---- Store signal in sorted set (score = timestamp) ----
    await redis.zadd(sigKey(streamId), { score: now, member: JSON.stringify(signal) });

    // Trim to last MAX_SIGNALS entries
    const total = await redis.zcard(sigKey(streamId));
    if (total > MAX_SIGNALS) {
      await redis.zremrangebyrank(sigKey(streamId), 0, total - MAX_SIGNALS - 1);
    }

    // Reset TTL on every write
    await redis.expire(sigKey(streamId), SIGNAL_TTL);

    return NextResponse.json({ ok: true, signal });
  } catch (err) {
    console.error('Signal POST error:', err);
    return NextResponse.json({ ok: false, error: 'Signal store error' }, { status: 500 });
  }
}
