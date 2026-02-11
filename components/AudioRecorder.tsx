import React, { useState, useRef, useEffect } from 'react';
import { DreamState, ImageSize } from '../types';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  imageSize: ImageSize;
  setImageSize: (size: ImageSize) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, imageSize, setImageSize }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionError, setPermissionError] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startVisualizer = (stream: MediaStream) => {
    if (!canvasRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      const draw = () => {
        if (!analyserRef.current) return;
        
        animationFrameRef.current = requestAnimationFrame(draw);
        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.fillStyle = 'rgb(15, 23, 42)'; // Background color
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 2;
          
          // Gradient fill
          const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
          gradient.addColorStop(0, '#818cf8');
          gradient.addColorStop(1, '#4f46e5');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

          x += barWidth + 1;
        }
      };

      draw();
    } catch (e) {
      console.error("Visualizer setup error:", e);
    }
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
      audioContextRef.current = null;
    }
    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const startRecording = async () => {
    setPermissionError(false);
    
    // Check for Secure Context which is required for getUserMedia
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
       alert("Microphone access requires a secure context (HTTPS).");
       return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Microphone access is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob);
        stopVisualizer();
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      startVisualizer(stream);
      setIsRecording(true);
    } catch (err: any) {
      // Clean up if we partially started
      stopVisualizer();
      
      console.warn("Microphone access denied or failed:", err);
      
      const errorMsg = err.message?.toLowerCase() || "";
      const errorName = err.name;
      
      if (
        errorName === 'NotAllowedError' || 
        errorName === 'PermissionDeniedError' || 
        errorMsg.includes('permission') || 
        errorMsg.includes('denied') ||
        errorMsg.includes('blocked')
      ) {
        setPermissionError(true);
      } else {
        alert(`Could not access microphone: ${err.name} - ${err.message}. Please check system settings.`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto p-8 rounded-3xl bg-slate-800/50 backdrop-blur-md border border-slate-700 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif text-white mb-2">Capture the Dream</h2>
        <p className="text-slate-400">Record your dream immediately upon waking.</p>
      </div>

      <div className="relative w-full h-32 mb-8 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 group">
         <canvas ref={canvasRef} width="500" height="128" className="w-full h-full" />
         {!isRecording && !permissionError && (
           <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
             Waiting for voice...
           </div>
         )}
         {permissionError && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 p-4 text-center z-10">
             <div className="text-red-400 font-bold mb-2 flex items-center gap-2">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               Microphone Blocked
             </div>
             <p className="text-xs text-slate-400 mb-4 max-w-[250px]">
               Please allow microphone access in your browser's address bar settings, then try again.
             </p>
             <button 
               onClick={startRecording}
               className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-xs text-white rounded-lg transition-colors border border-slate-600"
             >
               Retry Access
             </button>
           </div>
         )}
      </div>

      <div className="text-4xl font-mono text-indigo-400 mb-8 font-bold tracking-wider">
        {formatTime(recordingTime)}
      </div>

      <div className="flex gap-4 items-center mb-6 w-full justify-center">
         <label className="text-slate-300 text-sm font-medium">Image Resolution:</label>
         <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
           {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
             <button
               key={size}
               onClick={() => setImageSize(size)}
               className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                 imageSize === size 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-400 hover:text-slate-200'
               }`}
               disabled={isRecording}
             >
               {size}
             </button>
           ))}
         </div>
      </div>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30 animate-pulse' 
            : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30'
        }`}
      >
        {isRecording ? (
           <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
             <rect x="6" y="6" width="12" height="12" rx="2" />
           </svg>
        ) : (
           <svg className="w-10 h-10 text-white translate-x-1" fill="currentColor" viewBox="0 0 24 24">
             <path d="M8 5v14l11-7z" />
           </svg>
        )}
      </button>
      <p className="mt-4 text-sm text-slate-400 font-medium">
        {isRecording ? "Tap to Stop" : "Tap to Record"}
      </p>
    </div>
  );
};