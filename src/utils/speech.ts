/**
 * Speech synthesis & Audio effects utility
 * Specially tuned for English & Hindi learning for young students
 */

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  onBoundary?: (charIndex: number, charLength?: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

// Initialize & cache voices on load and when voices change
if (typeof window !== 'undefined' && window.speechSynthesis) {
  cachedVoices = window.speechSynthesis.getVoices() || [];
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    };
  }
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  }
  return cachedVoices;
}

/**
 * Returns true if a genuine Hindi voice is installed/available
 */
export function hasHindiVoice(): boolean {
  const voices = getAvailableVoices();
  return voices.some(
    (v) =>
      v.lang.toLowerCase().includes('hi-in') ||
      v.lang.toLowerCase().includes('hi_in') ||
      v.lang.toLowerCase().startsWith('hi') ||
      v.name.toLowerCase().includes('hindi') ||
      v.name.toLowerCase().includes('हिन्दी')
  );
}

/**
 * Find the most natural voice for Hindi or English
 */
export function getBestVoice(langPrefix: 'en' | 'hi'): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (voices.length === 0) return null;

  if (langPrefix === 'hi') {
    // 1. Exact Hindi (India) natural voices
    const exactHi = voices.find(
      (v) =>
        v.lang.toLowerCase() === 'hi-in' ||
        v.lang.toLowerCase() === 'hi_in' ||
        v.name.toLowerCase().includes('google हिन्दी') ||
        v.name.toLowerCase().includes('hindi (india)') ||
        v.name.toLowerCase().includes('swara') ||
        v.name.toLowerCase().includes('hemant') ||
        v.name.toLowerCase().includes('kalpana') ||
        v.name.toLowerCase().includes('lekha')
    );
    if (exactHi) return exactHi;

    // 2. Any voice containing 'hi' or 'hindi'
    const anyHi = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('hi') ||
        v.name.toLowerCase().includes('hindi') ||
        v.name.toLowerCase().includes('हिन्दी')
    );
    if (anyHi) return anyHi;

    // 3. If no Hindi voice exists, DO NOT force an English voice on Hindi text!
    // Return null so the browser's native language tag `hi-IN` handles it cleanly
    return null;
  } else {
    // English: Prefer Indian English (en-IN) for natural familiarity for Indian students
    const enInVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().includes('en-in') ||
        v.name.toLowerCase().includes('india') ||
        v.name.toLowerCase().includes('rishi') ||
        v.name.toLowerCase().includes('heera') ||
        v.name.toLowerCase().includes('neerja')
    );
    if (enInVoice) return enInVoice;

    // Next, natural US/UK English
    const enVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().includes('en-us') ||
        v.lang.toLowerCase().includes('en-gb') ||
        v.lang.toLowerCase().startsWith('en')
    );
    if (enVoice) return enVoice;
  }

  return null;
}

/**
 * Clean & normalize text before sending to speech synthesis while preserving character offsets
 */
function sanitizeSpeechText(text: string): string {
  return text
    .replace(/[*_`~#]/g, ' ')
    .trim();
}

/**
 * Main Speak Function
 */
export function speakText(text: string, options: SpeechOptions = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  stopSpeech();

  const cleanText = sanitizeSpeechText(text);
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  activeUtterance = utterance;

  const detectedLang = detectLanguage(cleanText);
  const requestedLang = options.lang || (detectedLang === 'hi' ? 'hi-IN' : 'en-US');
  
  utterance.lang = requestedLang;
  utterance.rate = options.rate ?? (detectedLang === 'hi' ? 0.85 : 0.8);
  utterance.pitch = options.pitch ?? 1.0;

  const langPrefix = requestedLang.startsWith('hi') ? 'hi' : 'en';
  const voice = getBestVoice(langPrefix);
  
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onstart = () => {
    options.onStart?.();
  };

  utterance.onboundary = (event) => {
    options.onBoundary?.(event.charIndex, event.charLength || 0);
  };

  utterance.onend = () => {
    activeUtterance = null;
    options.onEnd?.();
  };

  utterance.onerror = (e) => {
    activeUtterance = null;
    if (e.error !== 'canceled') {
      options.onError?.(e);
    }
  };

  // Speak with short safety timeout to prevent Chrome TTS hang bug
  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

/**
 * Play English sentence first, then speak its Hindi translation (Bilingual Echo)
 */
export function speakBilingualPair(
  englishText: string,
  hindiText: string,
  options: {
    rate?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onLanguageChange?: (lang: 'en' | 'hi') => void;
    onBoundary?: (charIndex: number, charLength: number, lang: 'en' | 'hi') => void;
  } = {}
) {
  options.onStart?.();
  options.onLanguageChange?.('en');
  speakText(englishText, {
    lang: 'en-US',
    rate: options.rate ?? 0.8,
    onBoundary: (charIndex, charLength) => {
      options.onBoundary?.(charIndex, charLength, 'en');
    },
    onEnd: () => {
      // Pause 350ms between English and Hindi
      setTimeout(() => {
        options.onLanguageChange?.('hi');
        speakText(hindiText, {
          lang: 'hi-IN',
          rate: options.rate ?? 0.85,
          onBoundary: (charIndex, charLength) => {
            options.onBoundary?.(charIndex, charLength, 'hi');
          },
          onEnd: () => {
            options.onEnd?.();
          },
          onError: () => {
            options.onEnd?.();
          },
        });
      }, 350);
    },
    onError: () => {
      options.onEnd?.();
    },
  });
}

export function pauseSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  return window.speechSynthesis.speaking;
}

export function isPaused(): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  return window.speechSynthesis.paused;
}

export function detectLanguage(text: string): 'hi' | 'en' {
  const hiCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  const enCount = (text.match(/[A-Za-z]/g) || []).length;
  if (hiCount === 0 && enCount === 0) return 'en';
  return hiCount > enCount ? 'hi' : 'en';
}

// Gentle pleasant sound effects for kid interactions using Web Audio API
export function playSound(type: 'success' | 'click' | 'cheer' | 'scan') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'success' || type === 'scan') {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.15, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.25);
      });
    } else if (type === 'cheer') {
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.2, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.35);
      });
    }
  } catch (e) {
    // AudioContext blocked or not supported - non-blocking
  }
}
