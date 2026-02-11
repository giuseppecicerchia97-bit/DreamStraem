import { GoogleGenAI, Type } from "@google/genai";
import { DreamAnalysis, ImageSize } from "../types";

// Helper to check for API Key
export const hasApiKey = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return !!process.env.API_KEY;
};

export const selectApiKey = async (): Promise<void> => {
  if (window.aistudio && window.aistudio.openSelectKey) {
    await window.aistudio.openSelectKey();
  }
};

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data url prefix (e.g. "data:audio/webm;base64,")
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const analyzeDreamAudio = async (audioBlob: Blob): Promise<DreamAnalysis> => {
  const ai = getAI();
  const base64Audio = await blobToBase64(audioBlob);

  const prompt = `
    You are an expert Jungian psychologist and dream interpreter.
    1. Transcribe the provided audio dream recording accurately.
    2. Identify the core emotional theme.
    3. Provide a structured psychological interpretation using Jungian archetypes.
    4. Create a vivid, surrealist visual description (prompt) based on the core emotional theme and symbols.

    Return the result in JSON format.
  `;

  // --- MODIFICA CRUCIALE ---
  // Usiamo 'gemini-2.0-flash'. Questo risolve l'errore 404.
  // È il modello più recente, veloce e gratuito nel tier base.
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash', 
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: audioBlob.type || 'audio/webm',
            data: base64Audio
          }
        },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: { type: Type.STRING, description: "The verbatim transcription of the dream." },
          interpretation: { type: Type.STRING, description: "Psychological interpretation of the dream." },
          visualPrompt: { type: Type.STRING, description: "A detailed prompt for generating a surrealist image of the dream." },
          emotionalTheme: { type: Type.STRING, description: "The core emotional theme." }
        },
        required: ["transcription", "interpretation", "visualPrompt", "emotionalTheme"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(text) as DreamAnalysis;
};

export const generateDreamImage = async (prompt: string, size: ImageSize): Promise<string> => {
  // --- MODALITÀ SICURA (NO PAGAMENTI) ---
  // Restituiamo un'immagine da internet invece di generarla a pagamento.
  // Questo evita l'errore "Billing required".
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simuliamo il caricamento
  return "https://images.unsplash.com/photo-1483096954271-6785055b863d?q=80&w=2070&auto=format&fit=crop"; 
};

export class DreamChatSession {
  private chat;

  constructor(systemInstruction: string) {
    const ai = getAI();
    this.chat = ai.chats.create({
      model: 'gemini-2.0-flash', // Aggiornato anche qui a 2.0 per coerenza
      config: {
        systemInstruction
      }
    });
  }

  async sendMessage(message: string): Promise<string> {
    const response = await this.chat.sendMessage({ message });
    return response.text || "I couldn't generate a response.";
  }
}