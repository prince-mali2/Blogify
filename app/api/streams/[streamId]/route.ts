import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  const { streamId } = await params;

  const stream = await prisma.liveStream.findUnique({
    where: { id: streamId },
    include: {
      creator: { select: { id: true, username: true, avatar: true } },
      chatMessages: {
        orderBy: { createdAt: 'asc' },
        take: 50,
        include: { user: { select: { id: true, username: true, avatar: true } } },
      },
      _count: { select: { viewers: true } },
    },
  });

  if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 });

  return NextResponse.json(stream);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  const { streamId } = await params;
  const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
  if (!stream) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const auth = requireAuth(request);
    if (stream.creatorId !== auth.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { id, creatorId, createdAt, ...safeUpdates } = body || {};

    // Map legacy status strings to enum values
    if (safeUpdates.status) {
      const statusMap: Record<string, string> = {
        offline: 'OFFLINE',
        live: 'LIVE',
        ended: 'ENDED',
        OFFLINE: 'OFFLINE',
        LIVE: 'LIVE',
        ENDED: 'ENDED',
      };
      safeUpdates.status = statusMap[safeUpdates.status] || 'OFFLINE';
    }

    const updated = await prisma.liveStream.update({
      where: { id: streamId },
      data: safeUpdates,
      include: {
        creator: { select: { id: true, username: true, avatar: true } },
        _count: { select: { viewers: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if ((error as any)?.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to update stream' }, { status: 500 });
  }
}
