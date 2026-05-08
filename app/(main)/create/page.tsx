'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Zap, Save, Eye } from 'lucide-react';

const API_URL = '/api';

export default function CreatePage() {
  const router = useRouter();
  const { isAuthenticated, user, token, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [keywords, setKeywords] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [category, setCategory] = useState('tech');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const generateDraft = async () => {
    if (!title && !category) {
      setError('Please enter a title or select a category first');
      return;
    }
    
    setAiLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/ai/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: title || category,
          title: title,
          category: category || 'general',
          userId: user?.id,
        }),
      });

      const data = await response.json();
      
      // Use data even if response not ok
      // as we always return fallback content
      if (data.content) {
        setTitle(data.title || title);
        setContent(data.content);
        setExcerpt(data.excerpt || '');
        setError('');
      } else {
        setError('Could not generate content. Please write manually.');
      }
    } catch (err) {
      console.error('Generate error:', err);
      setError('Network error. Check your connection and try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const improveContent = async () => {
    if (!content.trim()) {
      setError('Please add some content first');
      return;
    }

    setAiLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/ai/improve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userId: user?.id,
          model: 'gpt-4',
        }),
      });
      const data = await response.json();
      setContent(data.improvedContent);
    } catch (err: any) {
      setError(err.message || 'Failed to improve content');
    } finally {
      setAiLoading(false);
    }
  };

  const generateSEO = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setAiLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/ai/seo-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          userId: user?.id,
          model: 'gpt-4',
        }),
      });
      const data = await response.json();

      // Update title with improved version
      if (data.improvedTitle) {
        setTitle(data.improvedTitle);
      }

      // Set keywords
      if (data.keywords) {
        setKeywords(data.keywords.join(', '));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate SEO suggestions');
    } finally {
      setAiLoading(false);
    }
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const newText = content.substring(0, start) + before + selected + after + content.substring(end);
    setContent(newText);
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/blogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || content.substring(0, 200),
          published: true,
          keywords: keywords ? keywords.split(',').map((k) => k.trim()) : [],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish');
      }
      router.push(`/blog/${data.slug}`);
    } catch (err: any) {
      setError(err.message || 'Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await fetch(`${API_URL}/blogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || content.substring(0, 200),
          published: false,
          keywords: keywords ? keywords.split(',').map((k) => k.trim()) : [],
        }),
      });
      router.push('/drafts');
    } catch (err: any) {
      setError(err.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-5xl font-black text-white mb-3 tracking-tight">Create <span className="blogify-gradient-text">Masterpiece</span></h1>
        <p className="text-slate-500 text-lg">Your words have power. We provide the canvas.</p>
      </div>

      {error && (
        <div className="mb-8 p-6 bg-red-500/5 border border-red-500/20 rounded-3xl flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-200/70 font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="blogify-glass p-8 space-y-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  STORY TITLE
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title that commands attention..."
                  className="bg-white/5 border-white/10 text-white placeholder-slate-600 text-2xl font-bold h-16 rounded-2xl focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    EXCERPT
                  </label>
                  <Input
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Short hooks for social sharing..."
                    className="bg-white/5 border-white/10 text-white placeholder-slate-600 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    KEYWORDS
                  </label>
                  <Input
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="E.g. tech, future, life"
                    className="bg-white/5 border-white/10 text-white placeholder-slate-600 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="bg-white/5 border border-white/10 rounded-full p-1 h-auto mb-6">
                <TabsTrigger value="editor" className="rounded-full px-6 py-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 font-bold text-sm">
                  The Canvas
                </TabsTrigger>
                <TabsTrigger value="preview" className="rounded-full px-6 py-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 font-bold text-sm">
                  Reader View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="mt-0">
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '8px',
                  display: 'flex',
                  gap: '6px',
                  marginBottom: '8px'
                }}>
                  {[
                    { label: 'B', before: '**', after: '**', title: 'Bold' },
                    { label: 'I', before: '_', after: '_', title: 'Italic' },
                    { label: 'H', before: '## ', after: '', title: 'Heading' },
                    { label: '-', before: '- ', after: '', title: 'List' },
                    { label: '</>', before: '\`', after: '\`', title: 'Code' }
                  ].map(btn => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => insertMarkdown(btn.before, btn.after)}
                      title={btn.title}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.7)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tell your story here... Markdown is supported and celebrated."
                  className="w-full h-[500px] px-6 py-6 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-serif text-lg leading-relaxed resize-none transition-all"
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <div className="prose prose-invert max-w-none p-8 bg-white/5 border border-white/10 rounded-2xl min-h-[500px]">
                  <h1 className="text-4xl font-black text-white mb-8">{title || 'Untitled Masterpiece'}</h1>
                  <div className="text-slate-300 whitespace-pre-wrap text-lg leading-relaxed font-serif">
                    {content ? content.split('\n').map((line, i) => {
                      const trimmed = line.trim();
                      const isHeading = trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.includes(' ', trimmed.length - 2); 
                      // More robust check: if it's just bold text on one line
                      const isOnlyBold = /^(\*\*.*?\*\*)$/.test(trimmed);
                      
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <div key={i} className={`${isOnlyBold ? 'mt-10 mb-4' : 'mb-4'}`}>
                          {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={j} className={`text-white font-bold ${isOnlyBold ? 'text-2xl block' : ''}`}>{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                        </div>
                      );
                    }) : 'Your story will appear here as you write...'}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="space-y-6">
          {/* AI Assistance */}
          <div className="blogify-glass p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              Creator AI
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">Let our AI draft your thoughts. Enter a title and select a category.</p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {['tech', 'life', 'travel', 'food'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        category === cat 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {cat.toUpperCase()}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={generateDraft}
                  disabled={aiLoading || !title.trim()}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl h-12"
                >
                  {aiLoading ? 'Manifesting...' : 'Generate First Draft'}
                </Button>
              </div>

              <Button
                onClick={improveContent}
                disabled={aiLoading || !content.trim()}
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl h-12"
              >
                {aiLoading ? 'Polishing...' : 'Refine Narrative'}
              </Button>

              <Button
                onClick={generateSEO}
                disabled={aiLoading || !title.trim() || !content.trim()}
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl h-12"
              >
                {aiLoading ? 'Analyzing...' : 'Optimize for Discovery'}
              </Button>
            </div>
          </div>

          {/* Publishing Panel */}
          <div className="blogify-glass p-8">
            <h3 className="text-xl font-bold text-white mb-6">Finalize</h3>

            <div className="space-y-4">
              <Button
                onClick={handlePublish}
                disabled={loading || !title.trim() || !content.trim()}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white font-bold rounded-xl h-14 shadow-lg shadow-emerald-500/20"
              >
                <Eye className="w-5 h-5 mr-3" />
                Publish to World
              </Button>

              <Button
                onClick={handleSaveDraft}
                disabled={loading || !title.trim() || !content.trim()}
                variant="outline"
                className="w-full border-white/10 text-slate-400 hover:text-white rounded-xl h-12"
              >
                <Save className="w-5 h-5 mr-3" />
                Save for Later
              </Button>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Pro Tips</h3>
            <ul className="text-xs text-slate-500 space-y-3">
              <li className="flex gap-2">
                <span className="text-emerald-500">•</span>
                Use Markdown for beautiful formatting
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500">•</span>
                SEO suggestions can improve reach by 40%
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500">•</span>
                Preview your story to see what readers see
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

  );
}
