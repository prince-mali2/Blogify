'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import '@/styles/landing.css';
import {
  Zap,
  Globe,
  Flame,
  TrendingUp,
  Users,
  Shield,
  ArrowRight,
  Star,
  Play,
  BookOpen,
  Sparkles,
  Heart,
  MessageCircle,
  Eye,
  PlusCircle,
} from 'lucide-react';

// Dynamically import Three.js background (client-only)
const ThreeBackground = dynamic(() => import('@/components/ThreeBackground'), {
  ssr: false,
});

// --- Components for Landing Page ---

function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 2000;
          const step = end / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  delay,
}: {
  icon: typeof Zap;
  title: string;
  description: string;
  color: string;
  delay: string;
}) {
  return (
    <div
      className="blogify-card group"
      style={{ animationDelay: delay }}
    >
      <div
        className="blogify-card-icon"
        style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)`, border: `1px solid ${color}33` }}
      >
        <Icon style={{ color }} className="w-7 h-7" />
      </div>
      <h3 className="blogify-card-title">{title}</h3>
      <p className="blogify-card-desc">{description}</p>
      <div className="blogify-card-arrow">
        <ArrowRight style={{ color }} className="w-4 h-4" />
      </div>
    </div>
  );
}

// --- Main Page Component ---

export default function UnifiedPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/blogs?published=true')
        .then(r => r.json())
        .then(d => { setBlogs((d.blogs || []).slice(0, 6)); setContentLoading(false); })
        .catch(() => setContentLoading(false));
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- Authenticated User View (Feed) ---
  if (isAuthenticated) {
    return (
      <div className="min-h-screen blogify-root font-sans">
        <ThreeBackground />
        <div className="blogify-overlay" />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 max-w-7xl mx-auto px-6 py-16">
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
              {contentLoading ? (
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
            {!contentLoading && blogs.length === 0 && (
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
          </main>
        </div>
      </div>
    );
  }

  // --- Unauthenticated User View (Landing) ---
  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Writing',
      description: 'Generate drafts, improve content, optimize SEO, get headline ideas — all powered by GPT-4.',
      color: '#a78bfa',
      delay: '0ms',
    },
    {
      icon: Globe,
      title: 'Live Streaming',
      description: 'Broadcast to your audience with WebRTC, real-time chat, and viewer analytics.',
      color: '#06b6d4',
      delay: '100ms',
    },
    {
      icon: TrendingUp,
      title: 'Creator Analytics',
      description: 'Track views, likes, engagement rate, and follower growth with beautiful charts.',
      color: '#34d399',
      delay: '200ms',
    },
    {
      icon: Users,
      title: 'Vibrant Community',
      description: 'Follow creators, leave nested comments, and discover trending content.',
      color: '#f472b6',
      delay: '300ms',
    },
    {
      icon: Shield,
      title: 'AI Moderation',
      description: 'Automatic content moderation powered by AI keeps the platform safe.',
      color: '#fb923c',
      delay: '400ms',
    },
    {
      icon: BookOpen,
      title: 'Rich Editor',
      description: 'Write with Markdown, embed media, and publish instantly to your audience.',
      color: '#818cf8',
      delay: '500ms',
    },
  ];

  return (
    <div className="blogify-root">
      <ThreeBackground />
      <div className="blogify-overlay" />

      {/* Navbar */}
      <nav className={`blogify-nav ${scrolled ? 'blogify-nav-scrolled' : ''}`}>
        <div className="blogify-nav-inner">
          <Link href="/" className="blogify-logo">
            <div className="blogify-logo-icon">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span>Blogify</span>
          </Link>
          <div className="blogify-nav-links">
            <Link href="/login" className="blogify-nav-link">Sign In</Link>
            <Link href="/register" className="blogify-cta-btn">
              Get Started <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="blogify-hero">
        <div className="blogify-badge">
          <Star className="w-3.5 h-3.5" />
          <span>AI-Powered Content Platform</span>
        </div>

        <h1 className="blogify-hero-title">
          Create. Stream.{' '}
          <span className="blogify-gradient-text">Inspire.</span>
        </h1>

        <p className="blogify-hero-subtitle">
          The next-generation platform for creators. Write better blogs with AI,
          live stream to your community, and grow your audience with powerful analytics.
        </p>

        <div className="blogify-hero-actions">
          <Link href="/register" className="blogify-primary-btn">
            <Sparkles className="w-5 h-5" />
            Start for Free
          </Link>
          <Link href="/login" className="blogify-ghost-btn">
            <Play className="w-4 h-4" />
            Watch Demo
          </Link>
        </div>

        <div className="blogify-scroll-indicator">
          <div className="blogify-scroll-dot" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="blogify-stats-section">
        <div className="blogify-stats-grid">
          {[
            { value: 50000, suffix: '+', label: 'Active Creators' },
            { value: 2, suffix: 'M+', label: 'Articles Published' },
            { value: 98, suffix: '%', label: 'Uptime Guaranteed' },
            { value: 150, suffix: '+', label: 'Countries Reached' },
          ].map((stat) => (
            <div key={stat.label} className="blogify-stat">
              <div className="blogify-stat-value">
                <Counter end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="blogify-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="blogify-features-section">
        <div className="blogify-section-header">
          <p className="blogify-section-eyebrow">Everything You Need</p>
          <h2 className="blogify-section-title">
            Built for the modern{' '}
            <span className="blogify-gradient-text">creator</span>
          </h2>
          <p className="blogify-section-subtitle">
            From AI-assisted writing to live streaming and analytics — Blogify has every tool
            you need to build and grow your audience.
          </p>
        </div>
        <div className="blogify-features-grid">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="blogify-cta-section">
        <div className="blogify-cta-glow" />
        <div className="blogify-cta-content">
          <h2 className="blogify-cta-title">
            Ready to start your story?
          </h2>
          <p className="blogify-cta-subtitle">
            Join thousands of creators already building their audience on Blogify.
            It&apos;s free to get started.
          </p>
          <div className="blogify-cta-actions">
            <Link href="/register" className="blogify-primary-btn blogify-primary-btn-lg">
              <Sparkles className="w-5 h-5" />
              Create Your Account
            </Link>
            <Link href="/login" className="blogify-ghost-btn">
              Sign in instead
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="blogify-footer">
        <div className="blogify-footer-inner">
          <div className="blogify-logo">
            <div className="blogify-logo-icon">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span>Blogify</span>
          </div>
          <p className="blogify-footer-copy">
            © 2024 Blogify. Built with passion for creators everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
}
