import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, displayName, photoURL, username, fullName } = body;

    if (!uid || !email) {
      return NextResponse.json({ error: 'Missing uid or email' }, { status: 400 });
    }

    const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uid)}`;

    // Determine final username
    let finalUsername = username ||
      (displayName ? displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') : null) ||
      email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');

    // Check for username collision and add suffix if needed
    let candidate = finalUsername;
    let counter = 1;
    while (true) {
      const conflict = await prisma.user.findUnique({ where: { username: candidate } });
      if (!conflict) break;
      candidate = `${finalUsername}_${counter++}`;
    }
    finalUsername = candidate;

    const user = await prisma.user.upsert({
      where: { id: uid },
      update: {
        avatar: photoURL || defaultAvatar,
      },
      create: {
        id: uid,
        email: email.toLowerCase(),
        username: finalUsername,
        fullName: fullName || displayName || finalUsername,
        password: '', // Firebase-managed auth; no local password
        avatar: photoURL || defaultAvatar,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Firebase sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
