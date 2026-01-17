export interface DreamAnalysis {
  transcription: string;
  interpretation: string;
  visualPrompt: string;
  emotionalTheme: string;
}

export type ImageSize = '1K' | '2K' | '4K';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface DreamState {
  audioBlob: Blob | null;
  analysis: DreamAnalysis | null;
  imageUrl: string | null;
  imageSize: ImageSize;
  isProcessing: boolean;
  isRecording: boolean;
  step: 'idle' | 'recording' | 'analyzing' | 'generating_image' | 'complete';
  error: string | null;
}
