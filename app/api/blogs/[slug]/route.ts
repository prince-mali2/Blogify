import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const blog = await prisma.blog.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: {
      author: { select: { id: true, username: true, avatar: true, fullName: true } },
      comments: {
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, username: true, avatar: true } } },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!blog) {
    return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
  }

  // Increment view count (fire-and-forget, don't await)
  prisma.blog.update({ where: { id: blog.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return NextResponse.json(blog);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const blog = await prisma.blog.findFirst({ where: { OR: [{ slug }, { id: slug }] } });
  if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const auth = requireAuth(request);
    if (blog.authorId !== auth.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { id, authorId, createdAt, slug: _slug, ...safeUpdates } = body || {};

    const updated = await prisma.blog.update({
      where: { id: blog.id },
      data: { ...safeUpdates, updatedAt: new Date() },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if ((error as any)?.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to update blog' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const blog = await prisma.blog.findFirst({ where: { OR: [{ slug }, { id: slug }] } });
  if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const auth = requireAuth(request);
    if (blog.authorId !== auth.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.blog.delete({ where: { id: blog.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as any)?.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 });
  }
}
