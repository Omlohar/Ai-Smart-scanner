/**
 * Universal Speech Synthesis & Audio Effects Utility
 * Supports:
 * - Native Web Speech API (Chrome / Safari / Edge)
 * - Android WebView / AppsGeyser / PWA Online TTS Fallback
 * - Auto audio unlocking for mobile devices
 * - Bilingual playback (English -> Hindi)
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
let activeAudioFallback: HTMLAudioElement | null = null;
let fallbackQueue: string[] = [];
let fallbackLang = 'en';
let fallbackOptions: SpeechOptions = {};
let isFallbackPlaying = false;
let cachedVoices: SpeechSynthesisVoice[] = [];
let audioUnlocked = false;

// Attempt to unlock audio context & speech synthesis on first user touch/click
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;

    // 1. Resume AudioContext if suspended
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
      }
    } catch {}

    // 2. Warm up SpeechSynthesis
    try {
      if (window.speechSynthesis) {
        cachedVoices = window.speechSynthesis.getVoices() || [];
        // Silent utterance to unlock mobile WebView engine
        const silentUtterance = new SpeechSynthesisUtterance(' ');
        silentUtterance.volume = 0;
        window.speechSynthesis.speak(silentUtterance);
      }
    } catch {}

    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };

  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });

  if (window.speechSynthesis) {
    cachedVoices = window.speechSynthesis.getVoices() || [];
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        cachedVoices = window.speechSynthesis.getVoices() || [];
      };
    }
  }
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  }
  return cachedVoices;
}

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

export function getBestVoice(langPrefix: 'en' | 'hi'): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (voices.length === 0) return null;

  if (langPrefix === 'hi') {
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

    const anyHi = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('hi') ||
        v.name.toLowerCase().includes('hindi') ||
        v.name.toLowerCase().includes('हिन्दी')
    );
    if (anyHi) return anyHi;
    return null;
  } else {
    const enInVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().includes('en-in') ||
        v.name.toLowerCase().includes('india') ||
        v.name.toLowerCase().includes('rishi') ||
        v.name.toLowerCase().includes('heera') ||
        v.name.toLowerCase().includes('neerja')
    );
    if (enInVoice) return enInVoice;

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

function sanitizeSpeechText(text: string): string {
  // Replace markdown/special characters with spaces of equal length without trimming
  // This ensures character indices (event.charIndex) strictly match the original text offsets
  return text.replace(/[*_`~#]/g, ' ');
}

/**
 * Split long text into small chunks for TTS audio endpoints (max ~150 chars per chunk)
 */
function splitTextIntoChunks(text: string, maxLen = 140): string[] {
  const sentences = text.match(/[^.!?।\n]+[.!?।\n]*/g) || [text];
  const chunks: string[] = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxLen) {
      chunks.push(trimmed);
    } else {
      // Split by words if sentence is unusually long
      const words = trimmed.split(' ');
      let currentChunk = '';
      for (const word of words) {
        if ((currentChunk + ' ' + word).trim().length <= maxLen) {
          currentChunk = (currentChunk + ' ' + word).trim();
        } else {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = word;
        }
      }
      if (currentChunk) chunks.push(currentChunk);
    }
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Play text using High-Definition Online Audio Stream (Failsafe for WebView / AppsGeyser)
 */
function speakViaAudioFallback(text: string, lang: string, options: SpeechOptions) {
  stopSpeech();

  const cleanText = sanitizeSpeechText(text);
  if (!cleanText) {
    options.onEnd?.();
    return;
  }

  const langCode = lang.startsWith('hi') ? 'hi' : 'en';
  fallbackQueue = splitTextIntoChunks(cleanText);
  fallbackLang = langCode;
  fallbackOptions = options;
  isFallbackPlaying = true;

  options.onStart?.();
  playNextFallbackChunk();
}

function playNextFallbackChunk() {
  if (!isFallbackPlaying || fallbackQueue.length === 0) {
    isFallbackPlaying = false;
    activeAudioFallback = null;
    fallbackOptions.onEnd?.();
    return;
  }

  const chunk = fallbackQueue.shift()!;
  const encodedText = encodeURIComponent(chunk);
  const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${fallbackLang}&q=${encodedText}`;

  const audio = new Audio(audioUrl);
  activeAudioFallback = audio;

  if (fallbackOptions.rate && fallbackOptions.rate > 0.5 && fallbackOptions.rate <= 2) {
    audio.playbackRate = fallbackOptions.rate;
  }

  audio.onended = () => {
    if (isFallbackPlaying) {
      // Small pause between chunks
      setTimeout(() => {
        playNextFallbackChunk();
      }, 150);
    }
  };

  audio.onerror = (e) => {
    console.warn('Audio fallback chunk error:', e);
    // Continue to next chunk or finish
    if (fallbackQueue.length > 0) {
      playNextFallbackChunk();
    } else {
      isFallbackPlaying = false;
      activeAudioFallback = null;
      fallbackOptions.onEnd?.();
    }
  };

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn('Audio playback failed to start:', err);
      // If blocked, finish gracefully
      isFallbackPlaying = false;
      activeAudioFallback = null;
      fallbackOptions.onError?.(err);
      fallbackOptions.onEnd?.();
    });
  }
}

/**
 * Main Speak Function with Hybrid Native + Online Audio Failsafe
 */
export function speakText(text: string, options: SpeechOptions = {}) {
  stopSpeech();

  const cleanText = sanitizeSpeechText(text);
  if (!cleanText) return;

  const detectedLang = detectLanguage(cleanText);
  const requestedLang = options.lang || (detectedLang === 'hi' ? 'hi-IN' : 'en-US');
  const langPrefix = requestedLang.startsWith('hi') ? 'hi' : 'en';

  // Check if native speechSynthesis is available and working
  const canUseNative =
    typeof window !== 'undefined' &&
    !!window.speechSynthesis &&
    !navigator.userAgent.toLowerCase().includes('wv'); // Some webviews claim to have speechSynthesis but it's silent

  if (!canUseNative) {
    speakViaAudioFallback(cleanText, requestedLang, options);
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    activeUtterance = utterance;

    utterance.lang = requestedLang;
    utterance.rate = options.rate ?? (detectedLang === 'hi' ? 0.85 : 0.8);
    utterance.pitch = options.pitch ?? 1.0;

    const voice = getBestVoice(langPrefix);
    if (voice) {
      utterance.voice = voice;
    }

    let hasStarted = false;

    utterance.onstart = () => {
      hasStarted = true;
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
        // Fallback to audio stream if native synthesis throws an error
        speakViaAudioFallback(cleanText, requestedLang, options);
      }
    };

    window.speechSynthesis.speak(utterance);

    // Watchdog timer: If native TTS fails to start within 400ms (common in Android WebView), trigger fallback!
    setTimeout(() => {
      if (activeUtterance === utterance && !hasStarted && !window.speechSynthesis.speaking) {
        console.info('Native TTS silent/stuck, switching to HD Audio fallback...');
        stopSpeech();
        speakViaAudioFallback(cleanText, requestedLang, options);
      }
    }, 450);
  } catch (err) {
    console.warn('Native speech error, fallback to audio stream:', err);
    speakViaAudioFallback(cleanText, requestedLang, options);
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
  if (isFallbackPlaying && activeAudioFallback) {
    activeAudioFallback.pause();
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech() {
  if (isFallbackPlaying && activeAudioFallback) {
    activeAudioFallback.play().catch(() => {});
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
}

export function stopSpeech() {
  isFallbackPlaying = false;
  fallbackQueue = [];

  if (activeAudioFallback) {
    try {
      activeAudioFallback.pause();
      activeAudioFallback.currentTime = 0;
    } catch {}
    activeAudioFallback = null;
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    activeUtterance = null;
  }
}

export function isSpeaking(): boolean {
  if (isFallbackPlaying) return true;
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  return window.speechSynthesis.speaking;
}

export function isPaused(): boolean {
  if (isFallbackPlaying && activeAudioFallback) return activeAudioFallback.paused;
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
    // AudioContext blocked or not supported
  }
}
