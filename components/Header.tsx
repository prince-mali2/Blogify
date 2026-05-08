'use client';

import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Radio, Flame, Plus, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 font-bold text-2xl group transition-all">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Flame className="text-white w-6 h-6" />
          </div>
          <span className="text-white tracking-tight hidden sm:block">
            Blog<span className="text-cyan-400">ify</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1 backdrop-blur-md">
          <Link href="/" className="px-5 py-2 text-slate-400 hover:text-white rounded-full text-sm font-medium transition-all hover:bg-white/5">Home</Link>
          <Link href="/blog" className="px-5 py-2 text-slate-400 hover:text-white rounded-full text-sm font-medium transition-all hover:bg-white/5">Explore</Link>
          <Link href="/streams" className="px-5 py-2 text-slate-400 hover:text-white rounded-full text-sm font-medium transition-all hover:bg-white/5 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Live
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link href="/create-stream" className="hidden md:block">
                <Button size="sm" className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-full px-5 h-10 text-xs font-bold gap-2 transition-all">
                  <Radio className="w-4 h-4" /> GO LIVE
                </Button>
              </Link>
              
              <Link href="/create" className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur opacity-30 group-hover:opacity-70 transition duration-500 animate-pulse"></div>
                <Button size="sm" className="relative bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 shadow-lg rounded-full px-5 h-10 text-xs font-bold gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                  <Plus className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> WRITE
                </Button>
              </Link>

              <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

              <div className="flex items-center gap-2">
                <Link href="/dashboard" className="hidden sm:block">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5 rounded-full w-10 h-10">
                    <LayoutDashboard className="w-5 h-5" />
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Open profile menu"
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:border-cyan-500/50 transition-all overflow-hidden ring-2 ring-transparent hover:ring-cyan-500/20 focus:outline-none focus:ring-cyan-500/30 focus:ring-4"
                    >
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          style={{
                            width: '34px', height: '34px',
                            borderRadius: '50%', objectFit: 'cover',
                            border: '2px solid rgba(16,185,129,0.5)'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: '600', color: '#fff'
                        }}>
                          {user?.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    side="bottom"
                    sideOffset={10}
                    className="w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl rounded-2xl p-2"
                  >
                    <DropdownMenuLabel className="px-2 py-2">
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm font-bold">{user?.username}</span>
                        <span className="text-xs text-slate-400 font-medium">{user?.email}</span>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-white/10 my-1" />

                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link href={`/profile/${user?.username}`} className="flex items-center">
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link href="/dashboard" className="flex items-center">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-white/10 my-1" />

                    <DropdownMenuItem
                      variant="destructive"
                      className="rounded-xl"
                      onSelect={(e) => {
                        e.preventDefault();
                        logout();
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-slate-400 hover:text-white text-sm font-medium px-4">Login</Link>
              <Link href="/register">
                <Button className="bg-white text-slate-900 hover:bg-slate-200 rounded-full px-6 h-10 text-sm font-bold border-0 transition-all">
                  Join Free
                </Button>
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: 'flex', flexDirection: 'column', gap: '5px',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px'
            }}
            className="lg:hidden"
          >
            <span style={{width:'22px',height:'2px',background:'#fff',borderRadius:'2px',
              transition:'all 0.3s',
              transform: mobileOpen ? 'rotate(45deg) translate(5px,5px)' : 'none'}} />
            <span style={{width:'22px',height:'2px',background:'#fff',borderRadius:'2px',
              opacity: mobileOpen ? 0 : 1, transition:'all 0.3s'}} />
            <span style={{width:'22px',height:'2px',background:'#fff',borderRadius:'2px',
              transition:'all 0.3s',
              transform: mobileOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none'}} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div style={{
          position:'absolute', top:'100%', left:0, right:0,
          background:'rgba(10,10,15,0.97)',
          borderBottom:'1px solid rgba(255,255,255,0.08)',
          backdropFilter:'blur(20px)',
          padding:'16px',
          display:'flex', flexDirection:'column', gap:'4px'
        }}
        className="lg:hidden"
        >
          <Link href="/" style={{padding: '12px 16px', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight: 500}}>Home</Link>
          <Link href="/blog" style={{padding: '12px 16px', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight: 500}}>Explore</Link>
          <Link href="/streams" style={{padding: '12px 16px', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight: 500}}>Live</Link>
          {isAuthenticated && (
            <>
              <Link href="/dashboard" style={{padding: '12px 16px', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight: 500}}>Dashboard</Link>
              <Link href="/create" style={{padding: '12px 16px', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight: 500}}>Write</Link>
              <Link href="/create-stream" style={{padding: '12px 16px', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight: 500}}>Go Live</Link>
              <button 
                onClick={() => { logout(); router.push('/login'); }} 
                style={{padding: '12px 16px', borderRadius: '10px', color: '#ef4444', fontSize: '15px', fontWeight: 500, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer'}}
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
