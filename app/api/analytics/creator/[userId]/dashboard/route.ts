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
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Date range: last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [blogs, followersCount, recentStreams, dailyLikes, dailyComments] = await Promise.all([
    // All user blogs with counts
    prisma.blog.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { likes: true, comments: true } },
      },
    }),

    // Real follower count
    prisma.userFollower.count({ where: { followingId: userId } }),

    // Recent streams
    prisma.liveStream.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        _count: { select: { viewers: true } },
      },
    }),

    // Real per-day likes for this user's blogs (last 30 days)
    prisma.contentLike.findMany({
      where: {
        blog: { authorId: userId },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    }),

    // Real per-day comments on this user's blogs (last 30 days)
    prisma.blogComment.findMany({
      where: {
        blog: { authorId: userId },
        createdAt: { gte: thirtyDaysAgo },
        parentId: null, // only top-level comments
      },
      select: { createdAt: true },
    }),
  ]);

  // Aggregate totals
  const totalViews = blogs.reduce((sum, b) => sum + b.viewCount, 0);
  const totalLikes = blogs.reduce((sum, b) => sum + b._count.likes, 0);
  const totalComments = blogs.reduce((sum, b) => sum + b._count.comments, 0);

  // Build a lookup map: "YYYY-MM-DD" -> { views, likes, comments }
  const dateMap: Record<string, { views: number; likes: number; comments: number }> = {};

  // Initialize all 30 days with zeros
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(thirtyDaysAgo.getDate() + i);
    const key = d.toISOString().split('T')[0];
    dateMap[key] = { views: 0, likes: 0, comments: 0 };
  }

  // Tally likes per day
  for (const like of dailyLikes) {
    const key = like.createdAt.toISOString().split('T')[0];
    if (dateMap[key]) dateMap[key].likes += 1;
  }

  // Tally comments per day
  for (const comment of dailyComments) {
    const key = comment.createdAt.toISOString().split('T')[0];
    if (dateMap[key]) dateMap[key].comments += 1;
  }

  // Spread view counts evenly across published dates (best approximation without per-view tracking)
  // For each blog, add viewCount to the day it was published (or created)
  for (const blog of blogs) {
    const pubDate = blog.publishedAt || blog.createdAt;
    const key = pubDate.toISOString().split('T')[0];
    if (dateMap[key]) {
      dateMap[key].views += blog.viewCount;
    }
  }

  // Convert map to sorted array (last 30 days)
  const chartData = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateStr, counts]) => {
      const d = new Date(dateStr);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        date: label,
        fullDate: dateStr,
        views: counts.views,
        likes: counts.likes,
        comments: counts.comments,
      };
    });

  // Top performing blogs (by views)
  const topBlogs = [...blogs]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5)
    .map((b) => ({
      id: b.id,
      title: b.title,
      slug: b.slug,
      views: b.viewCount,
      _count: {
        likes: b._count.likes,
        comments: b._count.comments,
      },
      published: b.published,
      createdAt: b.createdAt,
      publishedAt: b.publishedAt,
    }));

  // Engagement rate: (likes + comments) / max(views, 1) * 100
  const engagementRate = totalViews > 0
    ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(1)
    : '0.0';

  return NextResponse.json({
    analytics: {
      totalBlogViews: totalViews,
      totalBlogLikes: totalLikes,
      totalFollowers: followersCount,
      totalComments,
      totalBlogs: blogs.length,
      totalStreams: recentStreams.length,
      engagementRate: parseFloat(engagementRate),
    },
    chartData,
    recentBlogs: topBlogs,
    recentStreams,
  });
}
