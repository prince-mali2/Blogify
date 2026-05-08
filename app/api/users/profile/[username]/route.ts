import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const blogs = await prisma.blog.findMany({
    where: { authorId: user.id, published: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { comments: true, likes: true } },
    },
  });

  const streams = await prisma.liveStream.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  const totalViews = blogs.reduce((sum, b) => sum + b.viewCount, 0);
  const totalLikes = blogs.reduce((sum, b) => sum + b._count.likes, 0);

  const { password: _, ...safeUser } = user;

  return NextResponse.json({
    user: safeUser,
    blogs,
    streams,
    stats: {
      totalBlogs: blogs.length,
      totalViews,
      totalLikes,
      totalStreams: streams.length,
    },
  });
}
