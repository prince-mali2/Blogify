import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function uniqueSlug(title: string, id: string): string {
  const base = slugify(title);
  return `${base}-${id.substring(0, 8)}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authorId = searchParams.get('authorId');
  const published = searchParams.get('published');
  const search = searchParams.get('q');

  const where: any = {};
  if (authorId) where.authorId = authorId;
  if (published !== null) where.published = published === 'true';
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { keywords: { has: search } },
    ];
  }

  const blogs = await prisma.blog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, username: true, avatar: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  return NextResponse.json({ blogs, total: blogs.length });
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const body = await request.json();
    const { title, content, excerpt, tags, keywords, published, coverImage, metaTitle, metaDescription } = body;

    if (!title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const slug = uniqueSlug(title, id);

    const blog = await prisma.blog.create({
      data: {
        id,
        title,
        slug,
        content: content || '',
        excerpt: excerpt || content?.substring(0, 200) || '',
        authorId: auth.id,
        keywords: keywords || tags || [],
        published: published !== false,
        coverImage: coverImage || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        publishedAt: published !== false ? new Date() : null,
      },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });

    return NextResponse.json(blog, { status: 201 });
  } catch (error) {
    if ((error as any)?.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Blog create error:', error);
    return NextResponse.json({ error: 'Failed to create blog' }, { status: 500 });
  }
}
