'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye, Heart, MessageCircle, Radio, FileText,
  Users, Calendar, AlertCircle, UserCheck, Loader2
} from 'lucide-react';

export default function ProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const { user: currentUser, token } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/users/profile/${username}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setProfile(data.user);
        setBlogs(data.blogs || []);
        setStreams(data.streams || []);
        setStats(data.stats || {});
        setIsFollowing(data.isFollowing ?? false);
        setFollowerCount(data.stats?.followers ?? data.user?.followerCount ?? 0);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [username, token]);

  const isOwnProfile = currentUser?.username?.toLowerCase() === username?.toLowerCase();

  const handleFollow = useCallback(async () => {
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
    setFollowLoading(true);
    // Optimistic update
    setIsFollowing(prev => !prev);
    setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);
    try {
      const res = await fetch(`/api/users/${profile.id}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.isFollowing);
        setFollowerCount(data.followerCount);
      } else {
        // Revert on error
        setIsFollowing(prev => !prev);
        setFollowerCount(prev => isFollowing ? prev + 1 : prev - 1);
      }
    } catch {
      // Revert on network error
      setIsFollowing(prev => !prev);
      setFollowerCount(prev => isFollowing ? prev + 1 : prev - 1);
    } finally {
      setFollowLoading(false);
    }
  }, [currentUser, profile?.id, token, isFollowing]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-10 text-center max-w-md w-full">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">User Not Found</h2>
          <p className="text-slate-400 mb-6">
            No user with the username <span className="text-emerald-400 font-mono">@{username}</span> exists.
          </p>
          <Link href="/">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Back to Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long',
  });

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Profile Banner */}
      <div className="h-36 bg-gradient-to-r from-emerald-900/40 via-teal-900/40 to-slate-900 border-b border-slate-800" />

      <div className="max-w-4xl mx-auto px-4">
        {/* Avatar + Info row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 mb-6">
          {/* Avatar */}
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.username}
              style={{
                width: '96px', height: '96px',
                borderRadius: '50%', objectFit: 'cover',
                border: '3px solid rgba(16,185,129,0.5)',
                boxShadow: '0 0 20px rgba(16,185,129,0.2)'
              }}
            />
          ) : (
            <div style={{
              width: '96px', height: '96px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #14b8a6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', fontWeight: '700', color: '#fff',
              border: '3px solid rgba(16,185,129,0.3)'
            }}>
              {profile?.username?.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name + actions */}
          <div className="flex-1 pb-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {profile.fullName || profile.username}
                </h1>
                <p className="text-slate-400 text-sm">@{profile.username}</p>
              </div>
              {isOwnProfile ? (
                <Link href="/dashboard">
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    Edit Profile
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`gap-2 transition-all ${
                    isFollowing
                      ? 'bg-slate-700 hover:bg-red-600/80 border border-slate-600 text-slate-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing ? (
                    <UserCheck className="w-4 h-4" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bio + meta */}
        <div className="mb-6">
          {profile.bio && (
            <p className="text-slate-300 mb-3 max-w-xl">{profile.bio}</p>
          )}
          <div className="flex items-center gap-4 text-slate-500 text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Joined {joinDate}
            </span>
            {streams.some(s => s.status === 'live') && (
              <span className="flex items-center gap-1.5 text-red-400">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live now
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { icon: FileText, label: 'Articles', value: stats?.totalBlogs ?? 0, color: 'text-emerald-400' },
            { icon: Eye, label: 'Total Views', value: stats?.totalViews ?? 0, color: 'text-teal-400' },
            { icon: Heart, label: 'Total Likes', value: stats?.totalLikes ?? 0, color: 'text-red-400' },
            { icon: Users, label: 'Followers', value: followerCount, color: 'text-purple-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="bg-slate-800 border-slate-700 p-4 text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
              <p className="text-xl font-bold text-white">{value.toLocaleString()}</p>
              <p className="text-slate-500 text-xs">{label}</p>
            </Card>
          ))}
        </div>

        {/* Tabs: Articles + Streams */}
        <Tabs defaultValue="articles" className="pb-12">
          <TabsList className="bg-slate-800 border border-slate-700 mb-6">
            <TabsTrigger value="articles" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400">
              <FileText className="w-4 h-4 mr-1.5" /> Articles ({blogs.length})
            </TabsTrigger>
            <TabsTrigger value="streams" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-slate-400">
              <Radio className="w-4 h-4 mr-1.5" /> Streams ({streams.length})
            </TabsTrigger>
          </TabsList>

          {/* Articles tab */}
          <TabsContent value="articles">
            {blogs.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400">
                  {isOwnProfile ? "You haven't published any articles yet." : `${profile.username} hasn't published any articles yet.`}
                </p>
                {isOwnProfile && (
                  <Link href="/create" className="mt-4 inline-block">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white mt-4">Write Your First Article</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {blogs.map((blog: any) => (
                  <Link key={blog.id} href={`/blog/${blog.slug}`}>
                    <Card className="bg-slate-800 border-slate-700 p-5 hover:border-emerald-500/50 transition-all group cursor-pointer">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(blog.tags || []).slice(0, 3).map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded text-xs border border-emerald-500/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="font-bold text-white text-lg mb-1 group-hover:text-emerald-400 transition-colors">
                        {blog.title}
                      </h3>
                      {blog.excerpt && (
                        <p className="text-slate-400 text-sm mb-3 line-clamp-2">{blog.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {blog.views || 0}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {blog.likes || 0}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {blog._count?.comments || 0}</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Streams tab */}
          <TabsContent value="streams">
            {streams.length === 0 ? (
              <div className="text-center py-16">
                <Radio className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400">
                  {isOwnProfile ? "You haven't streamed yet." : `${profile.username} hasn't streamed yet.`}
                </p>
                {isOwnProfile && (
                  <Link href="/create-stream" className="mt-4 inline-block">
                    <Button className="bg-red-600 hover:bg-red-700 text-white mt-4">
                      <Radio className="w-4 h-4 mr-2" /> Go Live
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {streams.map((stream: any) => {
                  const isLive = stream.status === 'live' || stream.status === 'active';
                  return (
                    <Link key={stream.id} href={`/stream/${stream.id}`}>
                      <Card className={`bg-slate-800 overflow-hidden group cursor-pointer transition-all hover:border-slate-500 ${isLive ? 'border-red-500/50' : 'border-slate-700'}`}>
                        <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center relative">
                          <Radio className={`w-8 h-8 ${isLive ? 'text-red-400' : 'text-slate-600'}`} />
                          {isLive && (
                            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 mb-1">
                            {stream.title}
                          </h3>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{new Date(stream.createdAt).toLocaleDateString()}</span>
                            <span className={isLive ? 'text-red-400 font-medium' : ''}>
                              {isLive ? '🔴 Live now' : stream.status}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
