'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Eye, Users, Heart, MessageCircle, Plus, Edit2, Trash2, AlertCircle, TrendingUp, Sparkles, Radio } from 'lucide-react';

const API_URL = '/api';

interface Analytics {
  totalBlogViews: number;
  totalBlogLikes: number;
  totalFollowers: number;
  totalComments: number;
  engagementRate: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [recentStreams, setRecentStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!authLoading && user?.id) {
      fetchDashboardData();
    }
  }, [user?.id, isAuthenticated, authLoading]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/creator/${user?.id}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setAnalytics(data.analytics);
      setChartData(data.chartData || []);
      setRecentBlogs(data.recentBlogs || []);
      setRecentStreams(data.recentStreams || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Analyzing your data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-black text-white mb-3 tracking-tight">Creator <span className="blogify-gradient-text">Dashboard</span></h1>
        <p className="text-slate-500 text-lg">Harness the power of data to grow your storytelling empire.</p>
      </div>

      {error && (
        <div className="mb-8 p-6 bg-red-500/5 border border-red-500/20 rounded-3xl flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-200/70 font-medium">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        {[
          { label: 'Total Views', value: analytics?.totalBlogViews, icon: Eye, color: '#34d399', suffix: '' },
          { label: 'Total Likes', value: analytics?.totalBlogLikes, icon: Heart, color: '#f43f5e', suffix: '' },
          { label: 'Engagement', value: analytics?.engagementRate, icon: TrendingUp, color: '#fbbf24', suffix: '%' },
          { label: 'Followers', value: analytics?.totalFollowers, icon: Users, color: '#06b6d4', suffix: '' },
          { label: 'Comments', value: analytics?.totalComments, icon: MessageCircle, color: '#a78bfa', suffix: '' },
        ].map(stat => (
          <div key={stat.label} className="blogify-glass p-8 group hover:bg-white/5 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">{stat.label}</span>
              <stat.icon style={{ color: stat.color }} className="w-6 h-6 opacity-80 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-4xl font-black text-white tracking-tight">
              {typeof stat.value === 'number' ? (stat.label === 'Engagement' ? stat.value.toFixed(1) : stat.value.toLocaleString()) : 0}
              <span className="text-lg text-slate-500 ml-1 font-bold">{stat.suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="blogify-glass p-8">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Growth Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="views" name="Views" stroke="#10b981" strokeWidth={4} dot={false} animationDuration={2000} />
              <Line type="monotone" dataKey="likes" name="Likes" stroke="#f43f5e" strokeWidth={4} dot={false} animationDuration={2000} />
              <Line type="monotone" dataKey="comments" name="Comments" stroke="#a78bfa" strokeWidth={3} dot={false} animationDuration={2000} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="blogify-glass p-8">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Engagement Analytics
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
              />
              <Bar dataKey="likes" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Content Management */}
      <Tabs defaultValue="blogs" className="space-y-8">
        <TabsList className="bg-white/5 border border-white/10 rounded-full p-1 h-auto inline-flex gap-1 backdrop-blur-md">
          <TabsTrigger value="blogs" className="rounded-full px-8 py-3 data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 transition-all font-bold text-sm">
            Stories ({recentBlogs.length})
          </TabsTrigger>
          <TabsTrigger value="streams" className="rounded-full px-8 py-3 data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 transition-all font-bold text-sm">
            Live Lab ({recentStreams.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blogs" className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">Your published stories</h3>
            <Link href="/create">
              <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white border-0 shadow-lg shadow-emerald-500/20 rounded-full px-6 h-12 font-bold transition-all hover:scale-105">
                <Plus className="w-5 h-5" />
                Publish New
              </Button>
            </Link>
          </div>

          <div className="grid gap-4">
            {recentBlogs.length === 0 ? (
              <div className="blogify-glass p-16 text-center">
                <p className="text-slate-500 mb-6 text-lg italic">The page is waiting for your first masterpiece...</p>
                <Link href="/create">
                  <Button className="bg-white text-slate-900 hover:bg-slate-200 rounded-full px-10 py-6 h-auto font-black shadow-xl">
                    Begin Your Story
                  </Button>
                </Link>
              </div>
            ) : (
              recentBlogs.map((blog: any) => (
                <div key={blog.id} className="blogify-glass p-6 flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-white/5 transition-all group">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">{blog.title}</h4>
                    <div className="flex flex-wrap gap-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-emerald-500" /> {blog.views.toLocaleString()} VIEWS
                      </span>
                      <span className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" /> {blog._count.likes.toLocaleString()} LIKES
                      </span>
                      <span className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-cyan-500" /> {blog._count.comments.toLocaleString()} FEEDBACKS
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5 rounded-full w-12 h-12">
                      <Edit2 className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-full w-12 h-12">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="streams" className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">Stream archives</h3>
            <Link href="/create-stream">
              <Button className="gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-90 text-white border-0 shadow-lg shadow-red-500/20 rounded-full px-6 h-12 font-bold transition-all hover:scale-105">
                <Radio className="w-5 h-5" />
                Go Live
              </Button>
            </Link>
          </div>

          <div className="grid gap-4">
            {recentStreams.length === 0 ? (
              <div className="blogify-glass p-16 text-center">
                <p className="text-slate-500 mb-6 text-lg italic">Your stage is ready, but the lights are off.</p>
                <Link href="/create-stream">
                  <Button className="bg-red-500 text-white hover:bg-red-600 rounded-full px-10 py-6 h-auto font-black shadow-xl">
                    Start Broadcasting
                  </Button>
                </Link>
              </div>
            ) : (
              recentStreams.map((stream: any) => (
                <div key={stream.id} className="blogify-glass p-6 flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-white/5 transition-all group">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-3 group-hover:text-red-400 transition-colors">{stream.title}</h4>
                    <div className="flex flex-wrap gap-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-2">
                        {stream.status === 'live' ? (
                          <>
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                            <span className="text-red-500">LIVE NOW</span>
                          </>
                        ) : (
                          <span className="text-slate-600">{stream.status.toUpperCase()}</span>
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-500" /> {stream.status === 'live' ? `${stream._count?.viewers || 0} WATCHING` : `${stream._count?.viewers || 0} TOTAL VIEWS`}
                      </span>
                    </div>
                  </div>
                  <Link href={`/stream/${stream.id}`}>
                    <Button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full px-8 h-12 font-bold">
                      Review Archive
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>

    </div>
  );
}
