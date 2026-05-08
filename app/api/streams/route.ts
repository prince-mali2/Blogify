import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const streams = await prisma.liveStream.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { id: true, username: true, avatar: true } },
      _count: { select: { viewers: true, chatMessages: true } },
    },
  });

  return NextResponse.json({ streams, total: streams.length });
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const body = await request.json();
    const { title, description } = body;

    const stream = await prisma.liveStream.create({
      data: {
        title: title || 'Untitled Stream',
        description: description || '',
        creatorId: auth.id,
        status: 'OFFLINE',
      },
      include: {
        creator: { select: { id: true, username: true, avatar: true } },
      },
    });

    return NextResponse.json({ stream }, { status: 201 });
  } catch (error) {
    if ((error as any)?.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('Stream create error:', error);
    return NextResponse.json({ error: 'Failed to create stream' }, { status: 500 });
  }
}
