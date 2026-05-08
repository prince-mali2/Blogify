import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const blog = await prisma.blog.findFirst({ where: { OR: [{ slug }, { id: slug }] } });
  if (!blog) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

  const comments = await prisma.blogComment.findMany({
    where: { blogId: blog.id },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, username: true, avatar: true } } },
  });

  return NextResponse.json({ comments, total: comments.length });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const blog = await prisma.blog.findFirst({ where: { OR: [{ slug }, { id: slug }] } });
  if (!blog) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

  try {
    const auth = requireAuth(request);
    const { content } = await request.json();
    if (!content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const comment = await prisma.blogComment.create({
      data: { content, blogId: blog.id, authorId: auth.id },
      include: { author: { select: { id: true, username: true, avatar: true } } },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if ((error as any)?.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
