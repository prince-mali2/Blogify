'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
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
} from 'lucide-react';

// Dynamically import Three.js background (client-only)
const ThreeBackground = dynamic(() => import('@/components/ThreeBackground'), {
  ssr: false,
});

// Animated counter
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

// Feature card with glassmorphism
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

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      {/* Three.js Background */}
      <ThreeBackground />

      {/* Background gradient overlay */}
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
            {isAuthenticated ? (
              <Link href="/dashboard" className="blogify-cta-btn">
                Dashboard <ArrowRight className="w-4 h-4 inline ml-1" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="blogify-nav-link">Sign In</Link>
                <Link href="/register" className="blogify-cta-btn">
                  Get Started <ArrowRight className="w-4 h-4 inline ml-1" />
                </Link>
              </>
            )}
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
          {isAuthenticated ? (
            <Link href="/dashboard" className="blogify-primary-btn">
              <Sparkles className="w-5 h-5" />
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/register" className="blogify-primary-btn">
              <Sparkles className="w-5 h-5" />
              Start for Free
            </Link>
          )}
          <Link href={isAuthenticated ? "/dashboard" : "/login"} className="blogify-ghost-btn">
            <Play className="w-4 h-4" />
            Watch Demo
          </Link>
        </div>

        {/* Scroll indicator */}
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
