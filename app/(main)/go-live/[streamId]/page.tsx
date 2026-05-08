'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Radio, MicOff, Mic, VideoOff, Video, Users, Square, Copy, CheckCheck } from 'lucide-react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
};

export default function GoLivePage() {
  const params = useParams();
  const router = useRouter();
  const streamId = params?.streamId as string;
  const { user, isAuthenticated } = useAuth();

  const [stream, setStream] = useState<any>(null);
  const [status, setStatus] = useState<'setup' | 'live' | 'ended'>('setup');
  const [cameraError, setCameraError] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [copied, setCopied] = useState(false);
  const [info, setInfo] = useState('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimestampRef = useRef(Date.now() - 60000);
  const myId = useRef(`broadcaster-${user?.id || 'anon'}`);
  const isLiveRef = useRef(false);
  const pendingViewers = useRef<Set<string>>(new Set());

  // Fetch stream info
  useEffect(() => {
    fetch(`/api/streams/${streamId}`)
      .then(r => r.json())
      .then(d => setStream(d))
      .catch(() => setStream(null));
  }, [streamId]);

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
      }
    } catch (err: any) {
      setCameraError(err.message || 'Could not access camera. Please allow camera permissions.');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [startCamera]);

  // Start polling IMMEDIATELY on mount — so we catch viewer-joined signals
  // even before the broadcaster clicks Go Live.
  useEffect(() => {
    if (!streamId) return;
    lastTimestampRef.current = Date.now() - 60000; // look back 60s on mount
    pollRef.current = setInterval(pollSignals, 1500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId]);

  // Create peer connection for a viewer and send offer
  const createPeerForViewer = useCallback(async (viewerId: string) => {
    // Don't create if already connected
    const existing = peersRef.current.get(viewerId);
    if (existing && existing.connectionState !== 'failed' && existing.connectionState !== 'closed') return;
    // Remove stale connection
    if (existing) { existing.close(); peersRef.current.delete(viewerId); }

    // If not live yet, queue the viewer for when we go live
    if (!isLiveRef.current || !localStreamRef.current) {
      pendingViewers.current.add(viewerId);
      return;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(viewerId, pc);

    // Add all local tracks to the peer connection
    localStreamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // Send ICE candidates to this viewer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        fetch(`/api/streams/${streamId}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ice-candidate',
            fromId: myId.current,
            toId: viewerId,
            payload: event.candidate,
          }),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Peer [${viewerId}] state: ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        peersRef.current.delete(viewerId);
      }
    };

    // Create and send offer (send-only from broadcaster)
    const offer = await pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
    await pc.setLocalDescription(offer);

    await fetch(`/api/streams/${streamId}/signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'offer',
        fromId: myId.current,
        toId: viewerId,
        payload: { sdp: offer.sdp, type: offer.type },
      }),
    });
  }, [streamId]);

  // Poll for viewer signals
  const pollSignals = useCallback(async () => {
    try {
      const res = await fetch(`/api/streams/${streamId}/signal?after=${lastTimestampRef.current}&viewerId=${myId.current}`);
      const data = await res.json();
      lastTimestampRef.current = data.serverTime || Date.now();
      setViewerCount(data.viewerCount || 0);

      for (const sig of data.signals || []) {
        if (sig.fromId === myId.current) continue;

        if (sig.type === 'viewer-joined') {
          setInfo(`👀 New viewer joined!`);
          await createPeerForViewer(sig.fromId);
        }

        if (sig.type === 'answer' && sig.toId === myId.current) {
          const pc = peersRef.current.get(sig.fromId);
          if (pc && pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
          }
        }

        if (sig.type === 'ice-candidate' && sig.toId === myId.current) {
          const pc = peersRef.current.get(sig.fromId);
          if (pc) {
            try { await pc.addIceCandidate(new RTCIceCandidate(sig.payload)); } catch {}
          }
        }
      }
    } catch {}
  }, [streamId, createPeerForViewer]);

  // Go live
  const goLive = async () => {
    if (!localStreamRef.current) {
      await startCamera();
      if (!localStreamRef.current) return;
    }

    isLiveRef.current = true;
    setStatus('live');

    // Notify broadcaster is ready
    await fetch(`/api/streams/${streamId}/signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'broadcaster-ready',
        fromId: myId.current,
        toId: 'all',
        payload: { title: stream?.title },
      }),
    });

    // Connect to any viewers who joined BEFORE the broadcaster went live
    const pending = Array.from(pendingViewers.current);
    pendingViewers.current.clear();
    for (const vid of pending) {
      await createPeerForViewer(vid);
    }
  };

  // End stream
  const endStream = async () => {
    isLiveRef.current = false;
    // Close all peer connections
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    if (pollRef.current) clearInterval(pollRef.current);

    // Stop local tracks
    localStreamRef.current?.getTracks().forEach(t => t.stop());

    // Notify viewers
    await fetch(`/api/streams/${streamId}/signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'stream-ended', fromId: myId.current, toId: 'all', payload: {} }),
    });

    setStatus('ended');
    router.push(`/stream/${streamId}`);
  };

  const toggleMic = () => {
    const audioTracks = localStreamRef.current?.getAudioTracks();
    audioTracks?.forEach(t => { t.enabled = !t.enabled; });
    setMicOn(prev => !prev);
  };

  const toggleCam = () => {
    const videoTracks = localStreamRef.current?.getVideoTracks();
    videoTracks?.forEach(t => { t.enabled = !t.enabled; });
    setCamOn(prev => !prev);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/stream/${streamId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      peersRef.current.forEach(pc => pc.close());
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-8 text-center">
          <p className="text-slate-300 mb-4">Sign in to go live</p>
          <Link href="/login"><Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Sign In</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              {status === 'live' && <span className="flex items-center gap-2 text-red-400"><div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /> LIVE</span>}
              {status === 'setup' && '🎬 Studio'}
              {stream?.title && <span className="text-slate-400 text-lg font-normal">— {stream.title}</span>}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {status === 'live' ? `${viewerCount} viewer${viewerCount !== 1 ? 's' : ''} watching` : 'Set up your stream before going live'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {status === 'live' && (
              <Button onClick={copyLink} variant="outline" className="border-slate-600 text-slate-300 gap-2">
                {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Share Link'}
              </Button>
            )}
            {status === 'live' ? (
              <Button onClick={endStream} className="bg-red-700 hover:bg-red-800 text-white gap-2">
                <Square className="w-4 h-4" /> End Stream
              </Button>
            ) : (
              <Button onClick={goLive} disabled={!!cameraError} className="bg-red-600 hover:bg-red-700 text-white gap-2 px-6">
                <Radio className="w-4 h-4" /> Go Live
              </Button>
            )}
          </div>
        </div>

        {info && (
          <div className="mb-4 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm">
            {info}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera preview */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-black border-slate-700 overflow-hidden">
              <div className="relative aspect-video">
                {cameraError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                    <p className="text-red-300">{cameraError}</p>
                    <Button onClick={startCamera} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                )}
                {status === 'live' && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
                  </div>
                )}
                {status === 'live' && (
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1.5 rounded-lg">
                    <Users className="w-3.5 h-3.5 inline mr-1" />{viewerCount} watching
                  </div>
                )}
              </div>
            </Card>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  micOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title={micOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleCam}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  camOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title={camOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              {status === 'setup' && (
                <Button onClick={goLive} disabled={!!cameraError} className="px-8 bg-red-600 hover:bg-red-700 text-white">
                  <Radio className="w-4 h-4 mr-2" /> Go Live
                </Button>
              )}
            </div>
          </div>

          {/* Info panel */}
          <div className="space-y-4">
            <Card className="bg-slate-800 border-slate-700 p-5">
              <h3 className="font-semibold text-white mb-3">Stream Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Title</span>
                  <span className="text-white font-medium truncate max-w-[150px]">{stream?.title || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className={status === 'live' ? 'text-red-400 font-semibold' : 'text-slate-400'}>
                    {status === 'live' ? '🔴 LIVE' : status === 'setup' ? 'Setup' : 'Ended'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Viewers</span>
                  <span className="text-white">{viewerCount}</span>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-800 border-slate-700 p-5">
              <h3 className="font-semibold text-white mb-3">Viewer Link</h3>
              <p className="text-slate-400 text-xs mb-3">Share this link so people can watch your stream:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-slate-700 rounded px-2 py-1.5 text-emerald-400 truncate">
                  /stream/{streamId}
                </code>
                <button onClick={copyLink} className="text-slate-400 hover:text-white transition-colors">
                  {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </Card>

            <Card className="bg-slate-800 border-slate-700 p-5">
              <h3 className="font-semibold text-white mb-3 text-sm">Tips</h3>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li>• Good lighting makes a big difference</li>
                <li>• Check your microphone before going live</li>
                <li>• Share the viewer link with your audience</li>
                <li>• Viewers join automatically when you go live</li>
                <li>• WebRTC streams directly to each viewer</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
