import React from 'react';
import { DreamAnalysis } from '../types';
import { ChatInterface } from './ChatInterface';

interface DreamResultProps {
  analysis: DreamAnalysis;
  imageUrl: string;
  onReset: () => void;
}

export const DreamResult: React.FC<DreamResultProps> = ({ analysis, imageUrl, onReset }) => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-[fadeIn_0.8s_ease-out]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif text-white">Dream Analysis</h2>
          <p className="text-indigo-300 italic">{analysis.emotionalTheme}</p>
        </div>
        <button 
          onClick={onReset}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 transition-colors text-sm"
        >
          New Dream
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Visuals & Text */}
        <div className="space-y-6">
          {/* Image Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl overflow-hidden border border-slate-700 shadow-2xl relative group">
            <img 
              src={imageUrl} 
              alt="Dream Visualization" 
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
              <p className="text-sm text-slate-300 font-serif italic">"{analysis.visualPrompt}"</p>
            </div>
          </div>

          {/* Transcription Card */}
          <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Transcript</h3>
            <p className="text-slate-200 leading-relaxed font-light">
              "{analysis.transcription}"
            </p>
          </div>
        </div>

        {/* Right Column: Interpretation & Chat */}
        <div className="space-y-6">
          {/* Interpretation Card */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 rounded-3xl p-8 border border-indigo-500/30 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <svg className="w-32 h-32 text-indigo-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
            </div>
            <h3 className="text-xl font-serif text-white mb-4 relative z-10">Archetypal Interpretation</h3>
            <div className="prose prose-invert prose-slate max-w-none">
              <p className="text-slate-200 whitespace-pre-wrap relative z-10 font-light leading-7">
                {analysis.interpretation}
              </p>
            </div>
          </div>

          {/* Chat Interface */}
          <ChatInterface analysis={analysis} />
        </div>
      </div>
    </div>
  );
};
