import React, { useState, useEffect } from 'react';
import { AudioRecorder } from './components/AudioRecorder';
import { DreamResult } from './components/DreamResult';
import { DreamState, DreamAnalysis, ImageSize } from './types';
import { analyzeDreamAudio, generateDreamImage, hasApiKey, selectApiKey } from './services/geminiService';

const App: React.FC = () => {
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  const [state, setState] = useState<DreamState>({
    audioBlob: null,
    analysis: null,
    imageUrl: null,
    imageSize: '1K',
    isProcessing: false,
    isRecording: false,
    step: 'idle',
    error: null,
  });

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    const ready = await hasApiKey();
    setApiKeyReady(ready);
  };

  const handleApiKeySelection = async () => {
    try {
      await selectApiKey();
      // Assume success and proceed, checking again is safest but per prompt we assume success to avoid race condition delays
      setApiKeyReady(true);
    } catch (e) {
      console.error(e);
      // If failed, we might want to alert, but usually the dialog handles itself
    }
  };

  const handleRecordingComplete = async (blob: Blob) => {
    setState(prev => ({ 
      ...prev, 
      audioBlob: blob, 
      step: 'analyzing',
      isProcessing: true,
      error: null 
    }));

    try {
      // 1. Analyze & Transcribe
      const analysis = await analyzeDreamAudio(blob);
      
      setState(prev => ({ 
        ...prev, 
        analysis, 
        step: 'generating_image' 
      }));

      // 2. Generate Image
      const imageUrl = await generateDreamImage(analysis.visualPrompt, state.imageSize);

      setState(prev => ({
        ...prev,
        imageUrl,
        isProcessing: false,
        step: 'complete'
      }));

    } catch (error: any) {
      console.error("Dream processing failed:", error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        step: 'idle',
        error: error.message || "Failed to process dream. Please try again."
      }));
    }
  };

  const reset = () => {
    setState({
      audioBlob: null,
      analysis: null,
      imageUrl: null,
      imageSize: state.imageSize, // Keep preference
      isProcessing: false,
      isRecording: false,
      step: 'idle',
      error: null
    });
  };

  const setImageSize = (size: ImageSize) => {
    setState(prev => ({ ...prev, imageSize: size }));
  };

  if (!apiKeyReady) {
    return (
      <div className="min-h-screen dream-gradient flex flex-col items-center justify-center p-4">
         <div className="text-center space-y-8 max-w-md">
            <h1 className="text-5xl font-serif text-white mb-2 tracking-wider">DreamStream</h1>
            <p className="text-indigo-200 text-lg">
              Unlock the hidden meanings of your dreams with AI-powered analysis and surrealist visualization.
            </p>
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-indigo-500/30 backdrop-blur-md">
               <p className="text-slate-300 mb-6">
                 To generate high-quality 4K dream visualizations, this app requires a paid Google Cloud Project API Key (via Veo/Imagen).
               </p>
               <button 
                 onClick={handleApiKeySelection}
                 className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all transform hover:scale-[1.02]"
               >
                 Connect API Key
               </button>
               <div className="mt-4 text-xs text-slate-500">
                 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400">
                   Learn more about billing & API keys
                 </a>
               </div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dream-gradient text-slate-200 overflow-x-hidden">
      <header className="p-6 flex justify-center sticky top-0 z-50 bg-slate-900/20 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={reset}>
           <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
           </svg>
           <h1 className="text-2xl font-serif font-bold text-white tracking-widest">DreamStream</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        
        {state.error && (
          <div className="w-full max-w-lg mb-8 bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl flex items-center gap-3">
             <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <p>{state.error}</p>
          </div>
        )}

        {state.step === 'idle' && (
          <AudioRecorder 
            onRecordingComplete={handleRecordingComplete} 
            imageSize={state.imageSize}
            setImageSize={setImageSize}
          />
        )}

        {(state.step === 'analyzing' || state.step === 'generating_image') && (
          <div className="flex flex-col items-center justify-center space-y-8 animate-pulse">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
              <div className="absolute inset-0 border-t-4 border-indigo-400 rounded-full animate-spin"></div>
              <div className="absolute inset-4 bg-indigo-900/50 rounded-full backdrop-blur-sm flex items-center justify-center">
                 <svg className="w-12 h-12 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-serif text-white mb-2">
                {state.step === 'analyzing' ? 'Interpreting Symbols...' : 'Painting the Dreamscape...'}
              </h2>
              <p className="text-indigo-300">
                {state.step === 'analyzing' 
                  ? 'Transcribing and consulting the archetypes.' 
                  : `Generating ${state.imageSize} surrealist visualization.`}
              </p>
            </div>
          </div>
        )}

        {state.step === 'complete' && state.analysis && state.imageUrl && (
          <DreamResult 
            analysis={state.analysis} 
            imageUrl={state.imageUrl} 
            onReset={reset}
          />
        )}
      </main>
    </div>
  );
};

export default App;
