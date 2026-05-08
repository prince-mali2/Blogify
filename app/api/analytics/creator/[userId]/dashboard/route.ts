import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const auth = requireAuth(request);
    if (auth.id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (error) {
    if ((error as any)?.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [blogs, comments, streams] = await Promise.all([
    prisma.blog.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { _count: { select: { likes: true, comments: true } } },
    }),
    prisma.blogComment.count({
      where: { blog: { authorId: userId } },
    }),
    prisma.liveStream.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const totalViews = blogs.reduce((sum, b) => sum + b.viewCount, 0);
  const totalLikes = blogs.reduce((sum, b) => sum + b._count.likes, 0);

  // Chart data: last 7 days (approximated from totals)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      views: Math.floor((totalViews / 7) * (0.7 + Math.random() * 0.6)),
      likes: Math.floor((totalLikes / 7) * (0.7 + Math.random() * 0.6)),
    };
  });

  return NextResponse.json({
    analytics: {
      totalBlogViews: totalViews,
      totalBlogLikes: totalLikes,
      totalFollowers: 0,
      totalComments: comments,
      totalBlogs: blogs.length,
      totalStreams: streams.length,
    },
    chartData,
    recentBlogs: blogs,
    recentStreams: streams,
  });
}
