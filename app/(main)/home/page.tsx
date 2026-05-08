'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Globe, 
  Flame, 
  Eye, 
  Heart, 
  MessageCircle, 
  ArrowRight, 
  Sparkles,
  TrendingUp,
  PlusCircle,
  Play
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    fetch('/api/blogs?published=true')
      .then(r => r.json())
      .then(d => { setBlogs((d.blogs || []).slice(0, 6)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Welcome Section */}
        <div className="relative mb-20">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full" />
          
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-purple-400 text-sm font-medium mb-6 backdrop-blur-md">
              <Sparkles className="w-4 h-4" /> Ready to create something amazing?
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1]">
              Welcome back, <br />
              <span className="blogify-gradient-text">{user?.username || 'Creator'}</span> 👋
            </h1>
            
            <p className="text-xl text-slate-400 mb-10 leading-relaxed">
              Your creative dashboard is live. Manage your stories, launch new streams, and track your global influence in real-time.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/create">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-lg px-8 py-7 rounded-2xl shadow-xl shadow-purple-500/20 group border-0 transition-all hover:scale-105">
                  <PlusCircle className="w-6 h-6 mr-2 group-hover:rotate-90 transition-transform" />
                  New Story
                </Button>
              </Link>
              <Link href="/create-stream">
                <Button size="lg" variant="outline" className="bg-white/5 border-white/10 hover:bg-red-500/10 hover:border-red-500/30 text-white text-lg px-8 py-7 rounded-2xl backdrop-blur-md transition-all">
                  <Play className="w-5 h-5 mr-2 text-red-500" />
                  Launch Stream
                </Button>
              </Link>
              <Link href="/dashboard" className="hidden sm:block">
                <Button size="lg" variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 text-lg px-8 py-7 rounded-2xl">
                  Analytics <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats / Trending Header */}
        <div className="flex flex-col md:flex-row items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Latest from the community</h2>
            <p className="text-slate-500">Discover trending stories and fresh perspectives from top creators.</p>
          </div>
          <Link href="/blog" className="group text-sm font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-2 bg-cyan-400/5 px-6 py-3 rounded-full border border-cyan-400/10 transition-all">
            See everything <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[400px] bg-white/5 rounded-[32px] border border-white/10 animate-pulse" />
            ))
          ) : (
            blogs.map((blog, idx) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`} className="group">
                <div 
                  className="blogify-card h-full flex flex-col p-8 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] rounded-[32px] transition-all"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-2 mb-6">
                    {(blog.tags || ['General']).slice(0, 2).map((t: string) => (
                      <span key={t} className="px-3 py-1 bg-white/5 border border-white/10 text-white/50 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none">
                        {t}
                      </span>
                    ))}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4 line-clamp-2 leading-tight group-hover:text-cyan-400 transition-colors">
                    {blog.title}
                  </h3>
                  
                  {blog.excerpt && (
                    <p className="text-slate-500 text-sm line-clamp-3 mb-8 leading-relaxed italic">
                      &quot;{blog.excerpt}&quot;
                    </p>
                  )}
                  
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-cyan-400 uppercase">
                        {(blog.author?.username || 'U')[0]}
                      </div>
                      <span className="text-xs font-semibold text-slate-400">
                        {blog.author?.username || 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                        <Eye className="w-3.5 h-3.5" />
                        {blog.views || 0}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                        <Heart className="w-3.5 h-3.5 group-hover:text-red-500 transition-colors" />
                        {blog.likes || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Empty State */}
        {!loading && blogs.length === 0 && (
          <div className="py-20 text-center bg-white/5 border border-white/10 rounded-[40px] backdrop-blur-xl">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
               <TrendingUp className="w-10 h-10 text-slate-700" />
             </div>
             <h3 className="text-2xl font-bold text-slate-300 mb-2">No articles in your feed yet</h3>
             <p className="text-slate-500 mb-8">Follow some creators or start writing your first story to see it here.</p>
             <Link href="/create">
               <Button className="bg-white text-slate-900 hover:bg-slate-200 rounded-full px-8 py-6 h-auto font-bold">
                 Write First Article
               </Button>
             </Link>
          </div>
        )}
      </div>
    );
  }

  // Guest view (already handled by landing but keeping as fallback)
  return (
    <div className="max-w-6xl mx-auto px-6 py-20 text-center">
      <h1 className="text-7xl font-black text-white mb-6">Redirecting to showcase...</h1>
      <p className="text-xl text-slate-400">If you're seeing this, something went wrong. Let's get you to the landing page.</p>
      <Link href="/">
        <Button size="lg" className="mt-8 bg-white text-slate-900 rounded-full px-10 py-7 text-xl font-bold">
          Go Home
        </Button>
      </Link>
    </div>
  );
}
