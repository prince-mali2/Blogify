import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const [blogs, streams, followerCount, followingCount] = await Promise.all([
    prisma.blog.findMany({
      where: { authorId: user.id, published: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { comments: true, likes: true } } },
    }),
    prisma.liveStream.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.userFollower.count({ where: { followingId: user.id } }),
    prisma.userFollower.count({ where: { followerId: user.id } }),
  ]);

  // Check if the requesting user follows this profile
  let isFollowing = false;
  try {
    const auth = requireAuth(request);
    if (auth.id !== user.id) {
      const rel = await prisma.userFollower.findUnique({
        where: { followerId_followingId: { followerId: auth.id, followingId: user.id } },
      });
      isFollowing = !!rel;
    }
  } catch {
    // Not authenticated — isFollowing stays false
  }

  const totalViews = blogs.reduce((sum, b) => sum + b.viewCount, 0);
  const totalLikes = blogs.reduce((sum, b) => sum + b._count.likes, 0);

  const { password: _, ...safeUser } = user;

  return NextResponse.json({
    user: { ...safeUser, followerCount, followingCount },
    blogs,
    streams,
    isFollowing,
    stats: {
      totalBlogs: blogs.length,
      totalViews,
      totalLikes,
      totalStreams: streams.length,
      followers: followerCount,
      following: followingCount,
    },
  });
}
