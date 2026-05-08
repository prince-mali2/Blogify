import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/users/[userId]/follow — check if current user follows this user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const auth = requireAuth(request);
    const existing = await prisma.userFollower.findUnique({
      where: {
        followerId_followingId: {
          followerId: auth.id,
          followingId: userId,
        },
      },
    });
    const followerCount = await prisma.userFollower.count({
      where: { followingId: userId },
    });
    return NextResponse.json({ isFollowing: !!existing, followerCount });
  } catch {
    // Not authenticated — just return counts without follow state
    const followerCount = await prisma.userFollower.count({
      where: { followingId: userId },
    });
    return NextResponse.json({ isFollowing: false, followerCount });
  }
}

// POST /api/users/[userId]/follow — toggle follow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: targetId } = await params;

  try {
    const auth = requireAuth(request);

    if (auth.id === targetId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if already following
    const existing = await prisma.userFollower.findUnique({
      where: {
        followerId_followingId: {
          followerId: auth.id,
          followingId: targetId,
        },
      },
    });

    if (existing) {
      // Unfollow
      await prisma.userFollower.delete({
        where: {
          followerId_followingId: {
            followerId: auth.id,
            followingId: targetId,
          },
        },
      });
      const followerCount = await prisma.userFollower.count({ where: { followingId: targetId } });
      return NextResponse.json({ isFollowing: false, followerCount });
    } else {
      // Follow
      await prisma.userFollower.create({
        data: { followerId: auth.id, followingId: targetId },
      });
      const followerCount = await prisma.userFollower.count({ where: { followingId: targetId } });
      return NextResponse.json({ isFollowing: true, followerCount });
    }
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ error: 'Unauthorized — please log in' }, { status: 401 });
    }
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Failed to update follow status' }, { status: 500 });
  }
}
