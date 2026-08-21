import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Sparkles, Copy, Check, Headphones, BookOpen } from 'lucide-react';
import { FontSize, LessonData } from '../types';
import { speakText, speakBilingualPair, stopSpeech, playSound } from '../utils/speech';

interface SentenceAlignViewProps {
  lesson: LessonData;
  fontSize: FontSize;
  speechRate: number;
  onSelectWord: (word: string) => void;
}

export const SentenceAlignView: React.FC<SentenceAlignViewProps> = ({
  lesson,
  fontSize,
  speechRate,
  onSelectWord,
}) => {
  const [playingSentenceId, setPlayingSentenceId] = useState<number | null>(null);
  const [playingMode, setPlayingMode] = useState<'en' | 'hi' | 'phonetic' | 'both' | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showPhonetics, setShowPhonetics] = useState(true);

  // Live word tracking
  const [activeCharIndex, setActiveCharIndex] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState<'en' | 'hi'>('en');
  const fallbackTimerRef = useRef<number | null>(null);
  const hadBoundaryRef = useRef<boolean>(false);

  const sentences = lesson.alignedSentences || [];

  const fontClass = {
    normal: 'text-base leading-relaxed',
    large: 'text-lg leading-relaxed',
    xlarge: 'text-xl leading-loose',
    xxlarge: 'text-2xl leading-loose',
  }[fontSize];

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
      }
      stopSpeech();
    };
  }, []);

  // Auto-scroll active card / word into view when playing
  useEffect(() => {
    if (playingSentenceId === null) return;
    const cardEl = document.getElementById(`sent-align-card-${playingSentenceId}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [playingSentenceId]);

  const clearTicker = () => {
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    hadBoundaryRef.current = false;
    setActiveCharIndex(null);
  };

  const startWordTicker = (text: string, lang: 'en' | 'hi') => {
    clearTicker();
    hadBoundaryRef.current = false;

    const chunks = text.split(/(\s+|[.,!?;:।—"()]+)/);
    let offset = 0;
    const words: { word: string; startOffset: number; endOffset: number }[] = [];
    chunks.forEach((chunk) => {
      const start = offset;
      const end = offset + chunk.length;
      offset = end;
      if (!chunk || !/^[A-Za-z0-9\u0900-\u097F'-]+$/.test(chunk)) return;
      words.push({ word: chunk, startOffset: start, endOffset: end });
    });

    if (words.length === 0) return;

    // Immediately highlight first word
    setActiveCharIndex(words[0].startOffset);

    // Realistic speech timing: Children speech speed is ~1.8 to 2.2 words per second (at rate ~0.8)
    const effectiveRate = Math.max(0.5, Math.min(1.8, speechRate || 0.8));
    let curMs = 0;
    const timings = words.map((w) => {
      const startMs = curMs;
      const len = Math.max(1, w.word.length);
      let durationMs = (320 + len * (lang === 'hi' ? 55 : 45)) / effectiveRate;
      curMs += durationMs;
      return {
        ...w,
        startMs,
        endMs: curMs,
      };
    });

    const startTime = Date.now();

    fallbackTimerRef.current = window.setInterval(() => {
      if (hadBoundaryRef.current) {
        if (fallbackTimerRef.current) {
          clearInterval(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
        return;
      }

      const elapsed = Date.now() - startTime;
      const active =
        timings.find((t) => elapsed >= t.startMs && elapsed < t.endMs) ||
        (elapsed >= timings[timings.length - 1].endMs ? timings[timings.length - 1] : timings[0]);
      if (active) {
        setActiveCharIndex(active.startOffset);
      }
    }, 60);
  };

  const handlePlaySentence = (sentence: string, lang: 'en' | 'hi', id: number, mode: 'en' | 'hi' | 'phonetic') => {
    playSound('click');
    setPlayingSentenceId(id);
    setPlayingMode(mode);
    setActiveLang(lang);

    startWordTicker(sentence, lang);

    speakText(sentence, {
      lang: lang === 'en' ? 'en-US' : 'hi-IN',
      rate: speechRate,
      onBoundary: (charIndex) => {
        hadBoundaryRef.current = true;
        if (fallbackTimerRef.current) {
          clearInterval(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
        setActiveCharIndex(charIndex);
      },
      onEnd: () => {
        clearTicker();
        setPlayingSentenceId(null);
        setPlayingMode(null);
      },
      onError: () => {
        clearTicker();
        setPlayingSentenceId(null);
        setPlayingMode(null);
      },
    });
  };

  const handlePlayBoth = (original: string, translated: string, id: number) => {
    playSound('click');
    setPlayingSentenceId(id);
    setPlayingMode('both');
    setActiveLang('en');

    startWordTicker(original, 'en');

    speakBilingualPair(original, translated, {
      rate: speechRate,
      onLanguageChange: (l) => {
        setActiveLang(l);
        if (l === 'hi') {
          startWordTicker(translated, 'hi');
        }
      },
      onBoundary: (charIndex, _, l) => {
        hadBoundaryRef.current = true;
        if (fallbackTimerRef.current) {
          clearInterval(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
        setActiveCharIndex(charIndex);
        setActiveLang(l);
      },
      onEnd: () => {
        clearTicker();
        setPlayingSentenceId(null);
        setPlayingMode(null);
      },
    });
  };

  const handleCopyPair = async (original: string, phonetic: string | undefined, translated: string, id: number) => {
    try {
      const copyContent = phonetic
        ? `${original}\n🗣️ उच्चारण: ${phonetic}\n👉 अर्थ: ${translated}`
        : `${original}\n👉 अर्थ: ${translated}`;
      await navigator.clipboard.writeText(copyContent);
      setCopiedId(id);
      playSound('success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      // fallback
    }
  };

  // Helper to parse words and check if active
  const renderInteractiveText = (text: string, sentenceId: number, targetMode: 'en' | 'hi' | 'phonetic', isClickable: boolean) => {
    const isThisPlaying =
      playingSentenceId === sentenceId &&
      (playingMode === targetMode ||
        (playingMode === 'both' && (activeLang === targetMode || (activeLang === 'hi' && targetMode === 'hi'))));

    const chunks = text.split(/(\s+)/);
    let offset = 0;

    // Pre-calculate word spans for accurate boundary matching
    const tokenSpans: { chunk: string; start: number; end: number; isWord: boolean }[] = [];
    chunks.forEach((chunk) => {
      const start = offset;
      const end = offset + chunk.length;
      offset = end;
      const isWord = /^[A-Za-z0-9\u0900-\u097F'-]+$/.test(chunk);
      tokenSpans.push({ chunk, start, end, isWord });
    });

    const actualWords = tokenSpans.filter((t) => t.isWord);

    // Resolve active token index based on activeCharIndex
    let activeTokenStart: number | null = null;
    if (isThisPlaying && activeCharIndex !== null && actualWords.length > 0) {
      const exact = actualWords.find((w) => activeCharIndex >= w.start && activeCharIndex < w.end);
      if (exact) {
        activeTokenStart = exact.start;
      } else {
        for (let i = 0; i < actualWords.length; i++) {
          const cur = actualWords[i];
          const next = actualWords[i + 1];
          if (activeCharIndex >= cur.start && (!next || activeCharIndex < next.start)) {
            activeTokenStart = cur.start;
            break;
          }
        }
        if (activeTokenStart === null) {
          activeTokenStart =
            activeCharIndex < actualWords[0].start
              ? actualWords[0].start
              : actualWords[actualWords.length - 1].start;
        }
      }
    }

    return tokenSpans.map((token, cIdx) => {
      if (!token.isWord) return <span key={cIdx}>{token.chunk}</span>;

      const isWordActive = isThisPlaying && activeTokenStart === token.start;

      return (
        <span
          key={cIdx}
          id={`sent-align-word-${sentenceId}-${targetMode}-${token.start}`}
          data-sentence-id={sentenceId}
          data-lang={targetMode}
          data-start={token.start}
          data-end={token.end}
          data-active={isWordActive ? 'true' : 'false'}
          onClick={() => isClickable && onSelectWord(token.chunk)}
          className={`inline-block mx-0.5 px-1 py-0.5 rounded-lg transition-all duration-100 ${
            isClickable ? 'cursor-pointer select-none' : ''
          } ${
            isWordActive
              ? targetMode === 'en'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-300 dark:from-amber-400 dark:to-yellow-400 text-slate-950 font-black shadow-md shadow-amber-400/50 ring-2 ring-amber-500 scale-110 z-20 animate-pulse'
                : 'bg-gradient-to-r from-pink-400 to-rose-300 dark:from-pink-500 dark:to-rose-400 text-slate-950 font-black shadow-md shadow-pink-400/50 ring-2 ring-pink-500 scale-110 z-20 animate-pulse'
              : isClickable
              ? 'hover:bg-purple-200/80 dark:hover:bg-purple-900/80 hover:text-purple-900 dark:hover:text-purple-200'
              : ''
          }`}
          title={isClickable ? 'टैप करके अर्थ देखें' : undefined}
        >
          {isWordActive && <span className="inline-block mr-0.5 text-xs animate-bounce">🔊</span>}
          {token.chunk}
        </span>
      );
    });
  };

  if (sentences.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-purple-100 dark:border-slate-800 space-y-3">
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          इस पाठ के लिए अलग-अलग वाक्य अभी उपलब्ध नहीं हैं।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Intro banner */}
      <div className="p-4 rounded-2xl bg-purple-50 dark:bg-slate-800/60 border border-purple-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-semibold">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>प्रत्येक वाक्य का English उच्चारण और सरल हिंदी अर्थ समझें:</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPhonetics(!showPhonetics)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
              showPhonetics
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-slate-700'
            }`}
          >
            {showPhonetics ? '📖 हिंदी उच्चारण चालू है' : '📖 हिंदी उच्चारण दिखाएं'}
          </button>

          <span className="text-xs bg-purple-200/60 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 px-2.5 py-1 rounded-full font-bold">
            कुल {sentences.length} वाक्य
          </span>
        </div>
      </div>

      {/* Sentence Cards */}
      <div className="space-y-4">
        {sentences.map((item, idx) => (
          <div
            key={item.id || idx}
            id={`sent-align-card-${item.id}`}
            className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all ${
              playingSentenceId === item.id
                ? 'border-purple-500 shadow-md shadow-purple-500/10 ring-2 ring-purple-400/30'
                : 'border-purple-100/80 dark:border-slate-800 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  वाक्य क्रमांक #{idx + 1}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                {/* Play English */}
                <button
                  onClick={() => handlePlaySentence(item.original, 'en', item.id, 'en')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                    playingSentenceId === item.id && playingMode === 'en'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300'
                  }`}
                  title="English में सुनें"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>English</span>
                </button>

                {/* Play Phonetics if present */}
                {item.phoneticHindi && (
                  <button
                    onClick={() => handlePlaySentence(item.phoneticHindi!, 'hi', item.id, 'phonetic')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                      playingSentenceId === item.id && playingMode === 'phonetic'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300'
                    }`}
                    title="हिंदी लिपि उच्चारण सुनें"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>उच्चारण</span>
                  </button>
                )}

                {/* Play Hindi Translation */}
                <button
                  onClick={() => handlePlaySentence(item.translated, 'hi', item.id, 'hi')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                    playingSentenceId === item.id && playingMode === 'hi'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'bg-pink-50 dark:bg-pink-950/50 hover:bg-pink-100 text-pink-700 dark:text-pink-300'
                  }`}
                  title="Hindi अनुवाद सुनें"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>हिंदी अर्थ</span>
                </button>

                {/* Bilingual Echo */}
                <button
                  onClick={() => handlePlayBoth(item.original, item.translated, item.id)}
                  className={`px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                    playingSentenceId === item.id && playingMode === 'both'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300'
                  }`}
                  title="दोनों सुनें (English फिर Hindi)"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>दोनों</span>
                </button>

                {/* Copy */}
                <button
                  onClick={() => handleCopyPair(item.original, item.phoneticHindi, item.translated, item.id)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="वाक्य व अर्थ कॉपी करें"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Sentence Breakdown Box */}
            <div className="space-y-2.5 pt-1">
              {/* 1. English Sentence with clickable words and synchronized highlighting */}
              <div className={`p-3 rounded-2xl bg-purple-50/40 dark:bg-slate-800/40 border border-purple-100/60 dark:border-slate-800 text-slate-800 dark:text-slate-100 ${fontClass}`}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 mb-1 flex items-center gap-1">
                  <span>🇬🇧 English वाक्य:</span>
                </div>
                <p>
                  {renderInteractiveText(item.original, item.id, 'en', true)}
                </p>
              </div>

              {/* 2. Hindi Phonetic Pronunciation (उच्चारण) */}
              {showPhonetics && item.phoneticHindi && (
                <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-0.5 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span>🗣️ हिंदी में उच्चारण (How to Read):</span>
                  </div>
                  <p className="font-semibold text-sm sm:text-base leading-relaxed tracking-wide">
                    {renderInteractiveText(item.phoneticHindi, item.id, 'hi', false)}
                  </p>
                </div>
              )}

              {/* 3. Hindi Translation (हिंदी अर्थ) with synchronized highlighting */}
              <div className={`p-3 rounded-2xl bg-pink-50/50 dark:bg-slate-800/50 border border-pink-100/80 dark:border-slate-800 text-slate-800 dark:text-pink-100 font-medium ${fontClass}`}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-pink-700 dark:text-pink-400 mb-1 flex items-center gap-1">
                  <span>🇮🇳 सरल हिंदी अर्थ (Hindi Meaning):</span>
                </div>
                <p>
                  {renderInteractiveText(item.translated, item.id, 'hi', false)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
