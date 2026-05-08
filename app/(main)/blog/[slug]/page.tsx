'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, MessageCircle, Share2, AlertCircle, Eye } from 'lucide-react';

const API_URL = '/api';

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { isAuthenticated, user, token } = useAuth();

  const [blog, setBlog] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await fetch(`${API_URL}/blogs/${slug}`);
        if (!response.ok) throw new Error('Blog not found');
        const data = await response.json();
        setBlog(data);
        setLikeCount(data.likes || 0);
        setComments(data.comments || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load blog');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchBlog();
  }, [slug]);

  const handleLike = async () => {
    if (!isAuthenticated) { setError('Please login to like'); return; }
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    try {
      await fetch(`${API_URL}/blogs/${blog?.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
    } catch {}
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { setError('Please login to comment'); return; }
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/blogs/${blog?.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await response.json();
      setComments([{ ...data, author: { id: user!.id, username: user!.username } }, ...comments]);
      setNewComment('');
    } catch (err: any) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-200 mb-4">{error || 'Article not found'}</p>
          <Link href="/"><Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Back to Home</Button></Link>
        </Card>
      </div>
    );
  }

  const publishDate = blog.publishedAt || blog.createdAt;

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <article className="blogify-glass p-8 md:p-12 mb-12">
        <div className="mb-10">
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-6">
              {blog.tags.map((tag: string) => (
                <span key={tag} className="px-4 py-1.5 bg-white/5 text-emerald-400 rounded-full text-xs font-bold border border-white/10 uppercase tracking-widest">{tag}</span>
              ))}
            </div>
          )}
          <h1 className="text-5xl font-black text-white mb-8 leading-tight tracking-tight">{blog.title}</h1>
          
          <div className="flex items-center justify-between pb-8 border-b border-white/5">
            <Link
              href={`/profile/${blog.author?.username || blog.authorUsername || ''}`}
              className="flex items-center gap-4 group/author"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-emerald-500/20 group-hover/author:scale-105 group-hover/author:shadow-emerald-500/40 transition-all">
                {(blog.author?.username || blog.authorUsername || 'A')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white text-lg font-bold group-hover/author:text-emerald-400 transition-colors">{blog.author?.username || blog.authorUsername || 'Anonymous'}</p>
                <p className="text-slate-500 text-sm font-medium">Curator &amp; Storyteller</p>
              </div>
            </Link>
            <div className="text-right">
              <time className="text-slate-400 text-sm font-bold block mb-1">
                {new Date(publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
              <span className="text-slate-600 text-xs font-black flex items-center gap-2 justify-end uppercase tracking-widest">
                <Eye className="w-4 h-4 text-emerald-500/50" /> {blog.views?.toLocaleString() || 0} READS
              </span>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="text-slate-200 leading-relaxed whitespace-pre-wrap text-xl font-serif">
            {blog.content}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 py-8 border-y border-white/5">
          <button 
            onClick={handleLike} 
            className={`flex items-center gap-3 px-8 py-3 rounded-full font-bold transition-all hover:scale-105 ${liked ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'}`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            {likeCount.toLocaleString()}
          </button>
          
          <div className="flex items-center gap-3 px-8 py-3 rounded-full bg-white/5 text-slate-400 border border-white/10 font-bold">
            <MessageCircle className="w-5 h-5 text-cyan-500" />
            {comments.length.toLocaleString()}
          </div>
          
          <button 
            onClick={handleShare} 
            className="flex items-center gap-3 px-8 py-3 rounded-full bg-white/5 text-slate-400 hover:text-white border border-white/10 transition-all font-bold hover:bg-white/10"
          >
            <Share2 className="w-5 h-5" />
            {copied ? 'Link Copied!' : 'Share Story'}
          </button>
        </div>
      </article>

      <section className="space-y-8">
        <h2 className="text-3xl font-black text-white tracking-tight">Conversations <span className="text-slate-600">({comments.length})</span></h2>
        
        {error && (
          <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-3xl flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-200/70 font-medium">{error}</p>
          </div>
        )}

        {isAuthenticated ? (
          <div className="blogify-glass p-8">
            <form onSubmit={handleSubmitComment} className="space-y-6">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Share your perspective</label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Join the discussion..."
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none text-lg leading-relaxed h-32 transition-all"
              />
              <Button 
                type="submit" 
                disabled={submittingComment || !newComment.trim()} 
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-full px-10 h-14 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
              >
                {submittingComment ? 'Sending...' : 'Post Perspective'}
              </Button>
            </form>
          </div>
        ) : (
          <div className="blogify-glass p-12 text-center">
            <p className="text-slate-400 mb-8 text-lg font-medium">Add your voice to the story.</p>
            <Link href="/login">
              <Button className="bg-white text-slate-900 hover:bg-slate-100 font-black rounded-full px-12 h-14 shadow-xl">
                Sign In to Comment
              </Button>
            </Link>
          </div>
        )}

        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-500 font-medium italic">The stage is empty. Be the first to speak!</p>
            </div>
          ) : (
            comments.map((comment: any) => (
              <div key={comment.id} className="blogify-glass p-8 hover:bg-white/5 transition-all">
                <div className="flex gap-6">
                  <Link
                    href={`/profile/${comment.author?.username || comment.authorUsername || ''}`}
                    className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-black shrink-0 shadow-inner hover:ring-2 hover:ring-emerald-400/50 hover:scale-105 transition-all"
                  >
                    {(comment.author?.username || comment.authorUsername || 'A')[0].toUpperCase()}
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <Link
                        href={`/profile/${comment.author?.username || comment.authorUsername || ''}`}
                        className="font-bold text-white text-lg hover:text-emerald-400 transition-colors"
                      >
                        {comment.author?.username || comment.authorUsername || 'Anonymous'}
                      </Link>
                      <time className="text-xs font-bold text-slate-600 uppercase tracking-widest">{new Date(comment.createdAt).toLocaleDateString()}</time>
                    </div>
                    <p className="text-slate-300 text-lg leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>

  );
}
