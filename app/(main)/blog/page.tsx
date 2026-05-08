'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Eye, Heart, MessageCircle, Search, Plus } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

export default function BlogListPage() {
  const { isAuthenticated } = useAuth();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBlogs(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchBlogs = async (q = '') => {
    setLoading(true);
    try {
      const url = q ? `/api/blogs?q=${encodeURIComponent(q)}&published=true` : '/api/blogs?published=true';
      const res = await fetch(url);
      const data = await res.json();
      setBlogs(data.blogs || []);
    } catch {}
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBlogs(search);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Blog</h1>
            <p className="text-slate-400">Explore stories from our creators</p>
          </div>
          {isAuthenticated && (
            <Link href="/create">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <Plus className="w-4 h-4" /> Write Article
              </Button>
            </Link>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="bg-slate-800 border-slate-700 text-white placeholder-slate-400 pl-10"
            />
          </div>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">Search</Button>
        </form>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 mb-4">No articles found</p>
            {isAuthenticated && <Link href="/create"><Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Write the First One</Button></Link>}
          </div>
        ) : (
          <div className="space-y-6">
            {blogs.map((blog: any) => (
              <Card key={blog.id} className="bg-slate-800 border-slate-700 p-6 hover:bg-slate-750 transition-colors group">
                <div className="flex flex-wrap gap-2 mb-3">
                  {(blog.tags || []).slice(0, 3).map((tag: string) => (
                    <span key={tag} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs border border-emerald-500/30">{tag}</span>
                  ))}
                </div>
                <Link href={`/blog/${blog.slug}`}>
                  <h2 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{blog.title}</h2>
                </Link>
                {blog.excerpt && <p className="text-slate-400 text-sm mb-4 line-clamp-2">{blog.excerpt}</p>}
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${blog.author?.username || ''}`}
                      className="flex items-center gap-2 hover:text-emerald-400 transition-colors group/author"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold group-hover/author:ring-2 group-hover/author:ring-emerald-400/50 transition-all">
                        {(blog.author?.username || 'A')[0].toUpperCase()}
                      </div>
                      <span className="text-slate-400 group-hover/author:text-emerald-400">{blog.author?.username || 'Anonymous'}</span>
                    </Link>
                    <span>·</span>
                    <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{blog.views || 0}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{blog.likes || 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{blog._count?.comments || 0}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
