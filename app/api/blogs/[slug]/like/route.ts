import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  // Support both slug and id (fixes the UI bug that posts /api/blogs/${id}/like)
  const blog = await prisma.blog.findFirst({ where: { OR: [{ slug }, { id: slug }] } });
  if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const auth = requireAuth(request);
    const userId = auth.id;

    const existing = await prisma.contentLike.findUnique({
      where: { blogId_userId: { blogId: blog.id, userId } },
    });

    if (existing) {
      await prisma.contentLike.delete({
        where: { blogId_userId: { blogId: blog.id, userId } },
      });
    } else {
      await prisma.contentLike.create({
        data: { blogId: blog.id, userId },
      });
    }

    const likeCount = await prisma.contentLike.count({ where: { blogId: blog.id } });
    return NextResponse.json({ likes: likeCount, liked: !existing });
  } catch (error) {
    if ((error as any)?.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to like blog' }, { status: 500 });
  }
}
