import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signAuthToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, username, password, fullName } = await request.json();
    if (!email || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();
    const usernameLower = username.toLowerCase();

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: emailLower }, { username: usernameLower }] },
    });

    if (existing?.email === emailLower) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }
    if (existing?.username === usernameLower) {
      return NextResponse.json({ error: 'This username is already taken' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: emailLower,
        username: usernameLower,
        fullName: fullName || username,
        password: passwordHash,
      },
    });

    const token = signAuthToken({ id: user.id, email: user.email, username: user.username });
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword, token }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
