'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Radio, Eye, Plus, Play, Flame, Activity, ChevronRight, Video } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

export default function StreamsPage() {
  const { isAuthenticated } = useAuth();
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = () => {
      fetch('/api/streams')
        .then(r => r.json())
        .then(d => { setStreams(d.streams || []); setLoading(false); })
        .catch(() => setLoading(false));
    };
    fetch_();
    // Refresh every 10s to catch new live streams
    const interval = setInterval(fetch_, 10000);
    return () => clearInterval(interval);
  }, []);

  const liveStreams = streams.filter(s => s.status === 'live' || s.status === 'active').sort((a, b) => (b._count?.viewers || 0) - (a._count?.viewers || 0));
  const otherStreams = streams.filter(s => s.status !== 'live' && s.status !== 'active');
  const featuredStream = liveStreams.length > 0 ? liveStreams[0] : null;
  const standardLiveStreams = liveStreams.slice(1);

  // CSS Pattern for placeholders
  const meshGradients = [
    'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-slate-900',
    'bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-rose-900 via-slate-900 to-slate-900',
    'bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-emerald-900 via-slate-900 to-slate-900',
    'bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-900 via-slate-900 to-slate-900',
  ];

  const getGradient = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return meshGradients[Math.abs(hash) % meshGradients.length];
  };

  const StreamCard = ({ stream, isFeatured = false }: { stream: any, isFeatured?: boolean }) => {
    const isLive = stream.status === 'live' || stream.status === 'active';
    const bgGradient = getGradient(stream.id);

    return (
      <Link href={`/stream/${stream.id}`} className={isFeatured ? 'col-span-full block h-full' : 'block h-full'}>
        <Card className={`h-full flex flex-col bg-slate-800/40 backdrop-blur-md border overflow-hidden group hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
          isLive ? 'border-red-500/30 hover:border-red-400/60 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]' : 'border-slate-700 hover:border-slate-500 shadow-lg hover:shadow-xl'
        }`}>
          <div className={`relative flex-1 ${isFeatured ? 'flex flex-col md:flex-row' : 'flex flex-col'}`}>
            {/* Thumbnail */}
            <div className={`relative overflow-hidden shrink-0 ${bgGradient} ${isFeatured ? 'md:w-2/3 aspect-video md:aspect-[21/9]' : 'aspect-video w-full'}`}>
              <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all duration-500">
                <Video className={`w-16 h-16 ${isLive ? 'text-red-400/50' : 'text-slate-500/50'}`} />
              </div>
              
              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 delay-75">
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
              </div>

              {isLive && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600/90 backdrop-blur text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg border border-red-500/50">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
                </div>
              )}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur text-white text-xs font-medium px-2.5 py-1 rounded-md">
                <Eye className="w-3.5 h-3.5 text-slate-300" /> {stream._count?.viewers || 0}
              </div>
            </div>

            {/* Info */}
            <div className={`p-5 flex flex-col flex-1 ${isFeatured ? 'md:w-1/3' : 'w-full'}`}>
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className={`font-bold text-white line-clamp-2 group-hover:text-red-400 transition-colors ${isFeatured ? 'text-2xl' : 'text-base'}`}>
                    {stream.title}
                  </h3>
                  {isFeatured && <Flame className="w-6 h-6 text-orange-500 shrink-0" />}
                </div>
                {stream.description && (
                  <p className={`text-slate-400 line-clamp-2 ${isFeatured ? 'text-sm mb-6' : 'text-xs mb-4'}`}>
                    {stream.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-auto pt-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full flex items-center justify-center text-white font-bold relative shrink-0 ${isFeatured ? 'w-10 h-10 bg-indigo-600 text-sm' : 'w-8 h-8 bg-indigo-600 text-xs'}`}>
                    {isLive && <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-20" />}
                    {(stream.creator?.username || stream.authorUsername || 'A')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className={`block text-white font-medium truncate ${isFeatured ? 'text-sm' : 'text-xs'}`}>{stream.creator?.username || stream.authorUsername || 'Anonymous'}</span>
                    <span className="block text-slate-500 text-[10px]">Creator</span>
                  </div>
                </div>
                {!isFeatured && (
                  <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded shrink-0 ${isLive ? 'bg-red-500/10 text-red-400' : 'bg-slate-700/50 text-slate-400'}`}>
                    {isLive ? 'Playing' : stream.status === 'ended' ? 'Ended' : 'Scheduled'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-900/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Advanced Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 bg-slate-800/30 p-8 rounded-3xl border border-slate-700/50 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-indigo-500/10 opacity-50" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-semibold tracking-wider text-sm uppercase">Blogify Live</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2">
              Discover Streams
            </h1>
            <p className="text-slate-400 max-w-xl">
              {liveStreams.length > 0
                ? `Join ${liveStreams.length} live broadcast${liveStreams.length > 1 ? 's' : ''} happening right now. Engage, chat, and connect.`
                : 'Watch creators go live in real-time. Join the conversation and build your community.'}
            </p>
          </div>
          <div className="relative z-10 shrink-0">
            {isAuthenticated ? (
              <Link href="/create-stream">
                <Button className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all px-6 py-6 h-auto text-base font-semibold gap-2">
                  <Radio className="w-5 h-5 animate-pulse" /> Go Live Now
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="bg-white hover:bg-slate-200 text-slate-900 rounded-xl font-semibold px-6">
                  Sign In to Broadcast
                </Button>
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-slate-700/50" />
                <div className="p-5 space-y-4">
                  <div className="h-5 bg-slate-700/50 rounded w-3/4" />
                  <div className="h-4 bg-slate-700/50 rounded w-1/2" />
                  <div className="flex items-center gap-3 pt-4">
                    <div className="w-8 h-8 rounded-full bg-slate-700/50" />
                    <div className="h-4 bg-slate-700/50 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : streams.length === 0 ? (
          <div className="text-center py-24 bg-slate-800/20 border border-slate-700/50 rounded-3xl backdrop-blur-sm">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
              <div className="relative w-full h-full rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <Video className="w-10 h-10 text-slate-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No streams found</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">There are no broadcasts available at the moment. Be the pioneer and start your own live stream!</p>
            {isAuthenticated ? (
              <Link href="/create-stream">
                <Button className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2 shadow-lg">
                  <Radio className="w-4 h-4" /> Start Streaming
                </Button>
              </Link>
            ) : (
              <Link href="/register">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">Join the Platform</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Live Stream */}
            {featuredStream && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Featured Live</h2>
                  </div>
                </div>
                <StreamCard stream={featuredStream} isFeatured={true} />
              </section>
            )}

            {/* Other Live Streams */}
            {standardLiveStreams.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-red-500/10 rounded-lg relative">
                    <div className="absolute inset-2 bg-red-500 rounded-full animate-ping opacity-50" />
                    <Radio className="w-5 h-5 text-red-500 relative z-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Live Now</h2>
                  <span className="ml-2 text-sm font-semibold bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                    {standardLiveStreams.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {standardLiveStreams.map(s => <StreamCard key={s.id} stream={s} />)}
                </div>
              </section>
            )}

            {/* Offline/Ended Streams */}
            {otherStreams.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6 mt-12 pt-12 border-t border-slate-800">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <Video className="w-5 h-5 text-slate-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Recent Broadcasts</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {otherStreams.map(s => <StreamCard key={s.id} stream={s} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
