import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  const { streamId } = await params;
  try {
    const auth = requireAuth(request);
    const { content } = await request.json();
    if (!content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const message = await prisma.streamChat.create({
      data: { streamId, userId: auth.id, message: content },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if ((error as any)?.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
