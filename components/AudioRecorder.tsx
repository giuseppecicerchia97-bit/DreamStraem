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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    // Fixed: Use 'any' type for interval because NodeJS namespace is not available in browser environment.
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

    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const startRecording = async () => {
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
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
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

      <div className="relative w-full h-32 mb-8 bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
         <canvas ref={canvasRef} width="500" height="128" className="w-full h-full" />
         {!isRecording && (
           <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
             Waiting for voice...
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