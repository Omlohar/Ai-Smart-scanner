import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Volume2,
  Square,
  Pause,
  Play,
  Copy,
  Check,
  Sparkles,
  Heart,
  Headphones,
  Highlighter,
  BookOpen,
} from 'lucide-react';
import { FontSize, LessonData } from '../types';
import {
  speakText,
  speakBilingualPair,
  stopSpeech,
  pauseSpeech,
  resumeSpeech,
  playSound,
} from '../utils/speech';

export interface ReadingViewProps {
  lesson: LessonData;
  fontSize: FontSize;
  speechRate: number;
  /** Optional prop to highlight an externally specified sentence */
  highlightedSentence?: string | null;
  onSelectWord: (word: string, contextSentence?: string) => void;
  onToggleFavorite: (id: string) => void;
  onStartQuiz: () => void;
}

interface WordSpan {
  text: string;
  isWord: boolean;
  startIndex: number;
  endIndex: number;
}

interface SentenceSpan {
  id: number;
  text: string;
  startIndex: number;
  endIndex: number;
  words: WordSpan[];
}

interface ParagraphSpan {
  id: number;
  startIndex: number;
  endIndex: number;
  sentences: SentenceSpan[];
}

export const ReadingView: React.FC<ReadingViewProps> = ({
  lesson,
  fontSize,
  speechRate,
  highlightedSentence,
  onSelectWord,
  onToggleFavorite,
  onStartQuiz,
}) => {
  const [speakingType, setSpeakingType] = useState<
    'none' | 'english' | 'hindi' | 'bilingual' | 'sentence' | 'paragraph'
  >('none');
  const [activeLang, setActiveLang] = useState<'en' | 'hi'>('en');
  const [isPausedState, setIsPausedState] = useState(false);
  
  // Realtime Speech Boundary State (populated from speechSynthesis.onboundary)
  const [activeCharIndex, setActiveCharIndex] = useState<number | null>(null);
  const [activeCharLength, setActiveCharLength] = useState<number>(0);
  const [highlightEnabled, setHighlightEnabled] = useState(true);

  // Active spoken word and sentence labels for child accessibility banner
  const [spokenWordText, setSpokenWordText] = useState<string>('');
  const [spokenSentenceText, setSpokenSentenceText] = useState<string>('');

  const [copiedEng, setCopiedEng] = useState(false);
  const [copiedHin, setCopiedHin] = useState(false);

  // Fallback ticker ref for devices where native browser onboundary is sparse
  const fallbackTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const hadBoundaryEventRef = useRef<boolean>(false);

  // Dynamic font sizing classes for young readers
  const fontClass = {
    normal: 'text-base sm:text-lg leading-relaxed',
    large: 'text-lg sm:text-xl leading-loose',
    xlarge: 'text-xl sm:text-2xl leading-loose tracking-wide',
    xxlarge: 'text-2xl sm:text-3xl leading-loose tracking-wide font-medium',
  }[fontSize];

  /**
   * Structure raw text into structured paragraphs, sentences, and words with character offsets
   */
  const parseStructuredText = (rawText: string): ParagraphSpan[] => {
    if (!rawText) return [];
    const paragraphStrings = rawText.split('\n');
    let globalOffset = 0;
    let sentenceGlobalId = 1;

    return paragraphStrings.map((pStr, pIdx) => {
      const pStart = globalOffset;
      const pEnd = pStart + pStr.length;
      globalOffset = pEnd + 1; // +1 for newline character

      if (!pStr.trim()) {
        return {
          id: pIdx,
          startIndex: pStart,
          endIndex: pEnd,
          sentences: [],
        };
      }

      // Match sentences based on punctuation marks (., !, ?, ।, |) or paragraph boundaries
      const sentenceRegex = /[^.!?।\n]+[.!?।]+|[^.!?।\n]+$/g;
      const sentenceMatches = Array.from(pStr.matchAll(sentenceRegex));
      const sentences: SentenceSpan[] = [];

      if (sentenceMatches.length === 0) {
        const words = parseWordsWithOffsets(pStr, pStart);
        sentences.push({
          id: sentenceGlobalId++,
          text: pStr,
          startIndex: pStart,
          endIndex: pEnd,
          words,
        });
      } else {
        sentenceMatches.forEach((match) => {
          const sText = match[0];
          const sLocalIndex = match.index || 0;
          const sStart = pStart + sLocalIndex;
          const sEnd = sStart + sText.length;
          const words = parseWordsWithOffsets(sText, sStart);

          sentences.push({
            id: sentenceGlobalId++,
            text: sText,
            startIndex: sStart,
            endIndex: sEnd,
            words,
          });
        });
      }

      return {
        id: pIdx,
        startIndex: pStart,
        endIndex: pEnd,
        sentences,
      };
    });
  };

  const parseWordsWithOffsets = (text: string, baseOffset: number): WordSpan[] => {
    const chunks = text.split(/(\s+|[.,!?;:।—"()]+)/);
    let offset = baseOffset;
    const words: WordSpan[] = [];

    chunks.forEach((chunk) => {
      const start = offset;
      const end = start + chunk.length;
      offset = end;

      if (!chunk) return;
      const isWord = /^[A-Za-z0-9\u0900-\u097F'-]+$/.test(chunk);
      words.push({
        text: chunk,
        isWord,
        startIndex: start,
        endIndex: end,
      });
    });

    return words;
  };

  const structuredEnglish = useMemo(
    () => parseStructuredText(lesson.extractedText),
    [lesson.extractedText]
  );
  const structuredHindi = useMemo(
    () => parseStructuredText(lesson.translatedText),
    [lesson.translatedText]
  );

  // Clean up timers & speech on unmount
  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
      }
      stopSpeech();
    };
  }, []);

  /**
   * Updates currently spoken word and sentence labels from activeCharIndex
   */
  useEffect(() => {
    if (activeCharIndex === null || speakingType === 'none') {
      setSpokenWordText('');
      setSpokenSentenceText('');
      return;
    }

    const currentStructure = activeLang === 'en' ? structuredEnglish : structuredHindi;
    for (const paragraph of currentStructure) {
      for (const sentence of paragraph.sentences) {
        if (activeCharIndex >= sentence.startIndex && activeCharIndex < sentence.endIndex) {
          setSpokenSentenceText(sentence.text.trim());
          for (const word of sentence.words) {
            if (word.isWord && activeCharIndex >= word.startIndex && activeCharIndex < word.endIndex) {
              setSpokenWordText(word.text);
              return;
            }
          }
          return;
        }
      }
    }
  }, [activeCharIndex, activeLang, speakingType, structuredEnglish, structuredHindi]);

  /**
   * Helper fallback ticker to guarantee smooth word progression if device onboundary is silent
   */
  const startFallbackTicker = (wordsList: WordSpan[], lang: 'en' | 'hi') => {
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
    }
    hadBoundaryEventRef.current = false;
    startTimeRef.current = Date.now();

    const actualWords = wordsList.filter((w) => w.isWord);
    if (actualWords.length === 0) return;

    const wordsPerSec = (lang === 'hi' ? 2.2 : 2.4) * speechRate;
    const msPerWord = Math.max(200, 1000 / wordsPerSec);

    let wordIdx = 0;
    fallbackTimerRef.current = window.setInterval(() => {
      if (hadBoundaryEventRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;
      const calculatedIndex = Math.min(actualWords.length - 1, Math.floor(elapsed / msPerWord));

      if (calculatedIndex !== wordIdx && calculatedIndex < actualWords.length) {
        wordIdx = calculatedIndex;
        const activeWord = actualWords[wordIdx];
        if (activeWord) {
          setActiveCharIndex(activeWord.startIndex);
          setActiveCharLength(activeWord.text.length);
        }
      }
    }, 70);
  };

  const clearFallbackTicker = () => {
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  /**
   * Handle onBoundary event emitted by SpeechSynthesis
   */
  const handleSpeechBoundary = (charIndex: number, charLength: number, lang?: 'en' | 'hi') => {
    hadBoundaryEventRef.current = true;
    setActiveCharIndex(charIndex);
    setActiveCharLength(charLength || 0);
    if (lang) {
      setActiveLang(lang);
    }
  };

  const handlePlayEnglish = () => {
    playSound('click');
    if (speakingType === 'english' && isPausedState) {
      resumeSpeech();
      setIsPausedState(false);
      return;
    }

    setSpeakingType('english');
    setActiveLang('en');
    setIsPausedState(false);
    setActiveCharIndex(0);

    const allWords = structuredEnglish.flatMap((p) => p.sentences.flatMap((s) => s.words));
    startFallbackTicker(allWords, 'en');

    speakText(lesson.extractedText, {
      lang: 'en-US',
      rate: speechRate,
      onBoundary: (charIndex, charLength) => {
        handleSpeechBoundary(charIndex, charLength, 'en');
      },
      onEnd: () => {
        clearFallbackTicker();
        setSpeakingType('none');
        setIsPausedState(false);
        setActiveCharIndex(null);
      },
      onError: () => {
        clearFallbackTicker();
        setSpeakingType('none');
        setIsPausedState(false);
        setActiveCharIndex(null);
      },
    });
  };

  const handlePlayHindi = () => {
    playSound('click');
    if (speakingType === 'hindi' && isPausedState) {
      resumeSpeech();
      setIsPausedState(false);
      return;
    }

    setSpeakingType('hindi');
    setActiveLang('hi');
    setIsPausedState(false);
    setActiveCharIndex(0);

    const allWords = structuredHindi.flatMap((p) => p.sentences.flatMap((s) => s.words));
    startFallbackTicker(allWords, 'hi');

    speakText(lesson.translatedText, {
      lang: 'hi-IN',
      rate: speechRate,
      onBoundary: (charIndex, charLength) => {
        handleSpeechBoundary(charIndex, charLength, 'hi');
      },
      onEnd: () => {
        clearFallbackTicker();
        setSpeakingType('none');
        setIsPausedState(false);
        setActiveCharIndex(null);
      },
      onError: () => {
        clearFallbackTicker();
        setSpeakingType('none');
        setIsPausedState(false);
        setActiveCharIndex(null);
      },
    });
  };

  const handlePlayBilingual = () => {
    playSound('click');
    setSpeakingType('bilingual');
    setActiveLang('en');
    setIsPausedState(false);
    setActiveCharIndex(0);

    const allWords = structuredEnglish.flatMap((p) => p.sentences.flatMap((s) => s.words));
    startFallbackTicker(allWords, 'en');

    speakBilingualPair(lesson.extractedText, lesson.translatedText, {
      rate: speechRate,
      onStart: () => {
        setActiveLang('en');
      },
      onLanguageChange: (lang) => {
        setActiveLang(lang);
        setActiveCharIndex(0);
        const nextWords =
          lang === 'en'
            ? structuredEnglish.flatMap((p) => p.sentences.flatMap((s) => s.words))
            : structuredHindi.flatMap((p) => p.sentences.flatMap((s) => s.words));
        startFallbackTicker(nextWords, lang);
      },
      onBoundary: (charIndex, charLength, lang) => {
        handleSpeechBoundary(charIndex, charLength, lang);
      },
      onEnd: () => {
        clearFallbackTicker();
        setSpeakingType('none');
        setIsPausedState(false);
        setActiveCharIndex(null);
      },
    });
  };

  const handlePlaySingleSentence = (sentence: SentenceSpan, lang: 'en' | 'hi') => {
    playSound('click');
    setSpeakingType('sentence');
    setActiveLang(lang);
    setIsPausedState(false);
    setActiveCharIndex(sentence.startIndex);

    startFallbackTicker(sentence.words, lang);

    speakText(sentence.text, {
      lang: lang === 'en' ? 'en-US' : 'hi-IN',
      rate: speechRate,
      onBoundary: (localIndex, charLength) => {
        handleSpeechBoundary(sentence.startIndex + localIndex, charLength, lang);
      },
      onEnd: () => {
        clearFallbackTicker();
        setSpeakingType('none');
        setIsPausedState(false);
        setActiveCharIndex(null);
      },
      onError: () => {
        clearFallbackTicker();
        setSpeakingType('none');
        setIsPausedState(false);
        setActiveCharIndex(null);
      },
    });
  };

  const handlePlaySingleParagraph = (paragraph: ParagraphSpan, lang: 'en' | 'hi') => {
    playSound('click');
    const pText = (lang === 'en' ? lesson.extractedText : lesson.translatedText).slice(
      paragraph.startIndex,
      paragraph.endIndex
    );
    const pWords = paragraph.sentences.flatMap((s) => s.words);

    setSpeakingType('paragraph');
    setActiveLang(lang);
    setIsPausedState(false);
    setActiveCharIndex(paragraph.startIndex);

    startFallbackTicker(pWords, lang);

    speakText(pText, {
      lang: lang === 'en' ? 'en-US' : 'hi-IN',
      rate: speechRate,
      onBoundary: (localIndex, charLength) => {
        handleSpeechBoundary(paragraph.startIndex + localIndex, charLength, lang);
      },
      onEnd: () => {
        clearFallbackTicker();
        setSpeakingType('none');
        setIsPausedState(false);
        setActiveCharIndex(null);
      },
      onError: () => {
        clearFallbackTicker();
        setSpeakingType('none');
        setIsPausedState(false);
        setActiveCharIndex(null);
      },
    });
  };

  const handlePause = () => {
    pauseSpeech();
    setIsPausedState(true);
  };

  const handleStop = () => {
    clearFallbackTicker();
    stopSpeech();
    setSpeakingType('none');
    setIsPausedState(false);
    setActiveCharIndex(null);
    setSpokenWordText('');
    setSpokenSentenceText('');
  };

  const copyToClipboard = async (text: string, type: 'eng' | 'hin') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'eng') {
        setCopiedEng(true);
        setTimeout(() => setCopiedEng(false), 2000);
      } else {
        setCopiedHin(true);
        setTimeout(() => setCopiedHin(false), 2000);
      }
      playSound('success');
    } catch (e) {
      // fallback
    }
  };

  /**
   * Determine if a word is currently being spoken
   */
  const isWordActive = (word: WordSpan, lang: 'en' | 'hi'): boolean => {
    if (!highlightEnabled || activeCharIndex === null || speakingType === 'none' || activeLang !== lang) {
      return false;
    }
    if (!word.isWord) return false;
    return activeCharIndex >= word.startIndex && activeCharIndex < word.endIndex;
  };

  /**
   * Determine if a sentence is currently active (via speech boundary OR via highlightedSentence prop)
   */
  const isSentenceActive = (sentence: SentenceSpan, lang: 'en' | 'hi'): boolean => {
    // 1. Check external prop highlightedSentence match
    if (highlightedSentence && sentence.text.trim().toLowerCase().includes(highlightedSentence.trim().toLowerCase())) {
      return true;
    }

    // 2. Check speech boundary
    if (!highlightEnabled || activeCharIndex === null || speakingType === 'none' || activeLang !== lang) {
      return false;
    }
    return activeCharIndex >= sentence.startIndex && activeCharIndex < sentence.endIndex;
  };

  /**
   * Interactive English Structured View with Real-time Sentence & Word Highlighting
   */
  const renderInteractiveEnglish = () => {
    return (
      <div className="space-y-4">
        {structuredEnglish.map((paragraph, pIdx) => (
          <div
            key={pIdx}
            className="group relative rounded-2xl p-2.5 sm:p-3 transition-colors hover:bg-purple-50/50 dark:hover:bg-slate-800/50"
          >
            <div className="space-y-2.5">
              {paragraph.sentences.map((sentence) => {
                const sentenceActive = isSentenceActive(sentence, 'en');

                return (
                  <span
                    key={sentence.id}
                    className={`inline rounded-2xl transition-all duration-150 relative ${
                      sentenceActive
                        ? 'bg-amber-100/90 dark:bg-amber-950/60 text-slate-900 dark:text-amber-100 ring-2 ring-amber-400 shadow-sm px-2 py-1 font-semibold'
                        : ''
                    }`}
                  >
                    {sentence.words.map((chunk, wIdx) => {
                      if (!chunk.isWord) {
                        return <span key={wIdx}>{chunk.text}</span>;
                      }

                      const wordActive = isWordActive(chunk, 'en');

                      return (
                        <span
                          key={wIdx}
                          onClick={() => {
                            playSound('click');
                            onSelectWord(chunk.text, sentence.text);
                          }}
                          className={`inline-block mx-0.5 px-1 py-0.5 rounded-lg cursor-pointer transition-all duration-100 select-none ${
                            wordActive
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-300 dark:from-amber-400 dark:to-yellow-400 text-slate-950 font-black shadow-md shadow-amber-400/50 ring-2 ring-amber-500 scale-110 z-20 animate-pulse'
                              : 'hover:bg-purple-200/80 dark:hover:bg-purple-900/80 hover:text-purple-900 dark:hover:text-purple-200 active:scale-95 text-slate-800 dark:text-slate-100'
                          }`}
                          title="टैप करके उच्चारण और हिंदी अर्थ देखें"
                        >
                          {wordActive && (
                            <span className="inline-block mr-0.5 text-xs animate-bounce">
                              🔊
                            </span>
                          )}
                          {chunk.text}
                        </span>
                      );
                    })}
                    {' '}
                  </span>
                );
              })}
            </div>

            {/* Paragraph Actions */}
            <div className="mt-2.5 pt-1 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handlePlaySingleParagraph(paragraph, 'en')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/60 px-2.5 py-1 rounded-xl hover:bg-purple-200 transition-all active:scale-95 cursor-pointer"
                title="इस पैराग्राफ को सुनें"
              >
                <Volume2 className="w-3 h-3" />
                <span>पैराग्राफ सुनें</span>
              </button>

              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                👉 शब्द पर टैप करके अर्थ जानें
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Interactive Hindi Structured View with Real-time Sentence & Word Highlighting
   */
  const renderInteractiveHindi = () => {
    return (
      <div className="space-y-4">
        {structuredHindi.map((paragraph, pIdx) => (
          <div
            key={pIdx}
            className="group relative rounded-2xl p-2.5 sm:p-3 transition-colors hover:bg-pink-50/50 dark:hover:bg-slate-800/50"
          >
            <div className="space-y-2.5">
              {paragraph.sentences.map((sentence) => {
                const sentenceActive = isSentenceActive(sentence, 'hi');

                return (
                  <span
                    key={sentence.id}
                    className={`inline rounded-2xl transition-all duration-150 ${
                      sentenceActive
                        ? 'bg-rose-100/90 dark:bg-pink-950/70 text-slate-900 dark:text-pink-100 ring-2 ring-pink-400 shadow-sm px-2 py-1 font-semibold'
                        : ''
                    }`}
                  >
                    {sentence.words.map((chunk, wIdx) => {
                      if (!chunk.isWord) {
                        return <span key={wIdx}>{chunk.text}</span>;
                      }

                      const wordActive = isWordActive(chunk, 'hi');

                      return (
                        <span
                          key={wIdx}
                          className={`inline-block mx-0.5 px-1 py-0.5 rounded-lg transition-all duration-100 ${
                            wordActive
                              ? 'bg-gradient-to-r from-pink-400 to-rose-300 dark:from-pink-500 dark:to-rose-400 text-slate-950 font-black shadow-md shadow-pink-400/50 ring-2 ring-pink-500 scale-110 z-20 animate-pulse'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {wordActive && (
                            <span className="inline-block mr-0.5 text-xs animate-bounce">
                              🇮🇳
                            </span>
                          )}
                          {chunk.text}
                        </span>
                      );
                    })}
                    {' '}
                  </span>
                );
              })}
            </div>

            {/* Paragraph Actions */}
            <div className="mt-2.5 pt-1 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handlePlaySingleParagraph(paragraph, 'hi')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-700 dark:text-pink-300 bg-pink-100/80 dark:bg-pink-950/60 px-2.5 py-1 rounded-xl hover:bg-pink-200 transition-all active:scale-95 cursor-pointer"
                title="इस हिंदी पैराग्राफ को सुनें"
              >
                <Volume2 className="w-3 h-3" />
                <span>हिंदी पैराग्राफ सुनें</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Story Summary for Kids */}
      {lesson.summaryInHindi && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-pink-500/10 dark:from-amber-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border border-amber-200/60 dark:border-amber-900/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 text-lg">
              💡
            </div>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                पाठ का सरल सार (Story Summary):
              </h3>
              <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                {lesson.summaryInHindi}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => onToggleFavorite(lesson.id)}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                lesson.isFavorite
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-800 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-rose-500'
              }`}
              title={lesson.isFavorite ? 'पसंदीदा से हटाएं' : 'पसंदीदा में जोड़ें'}
            >
              <Heart className={`w-4 h-4 ${lesson.isFavorite ? 'fill-rose-500' : ''}`} />
            </button>
            <button
              onClick={onStartQuiz}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              अभ्यास क्विज खेलें
            </button>
          </div>
        </div>
      )}

      {/* Floating Audio Player Toolbar with Real-time Speech Boundary Controls */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 sm:p-4 rounded-3xl border border-purple-100 dark:border-slate-800 shadow-lg shadow-purple-600/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-2">
          {/* Read English Button */}
          <button
            onClick={handlePlayEnglish}
            className={`px-3.5 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
              speakingType === 'english' && !isPausedState
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400 animate-pulse'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20 hover:from-purple-700 hover:to-indigo-700'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>🇬🇧 English में सुनें</span>
          </button>

          {/* Read Hindi Button */}
          <button
            onClick={handlePlayHindi}
            className={`px-3.5 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
              speakingType === 'hindi' && !isPausedState
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 ring-2 ring-pink-400 animate-pulse'
                : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/20 hover:from-pink-700 hover:to-rose-700'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>🇮🇳 सरल Hindi अनुवाद सुनें</span>
          </button>

          {/* Bilingual Echo Button */}
          <button
            onClick={handlePlayBilingual}
            className={`px-3 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              speakingType === 'bilingual'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 animate-pulse'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
            title="पहले English वाक्य फिर उसका Hindi अर्थ"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>✨ दोनों साथ में</span>
          </button>

          {/* Pause / Resume button */}
          {speakingType !== 'none' && (
            <button
              onClick={
                isPausedState
                  ? activeLang === 'en'
                    ? handlePlayEnglish
                    : handlePlayHindi
                  : handlePause
              }
              className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold hover:bg-amber-200 transition-all cursor-pointer"
              title={isPausedState ? 'फिर से शुरू करें' : 'रोकें (Pause)'}
            >
              {isPausedState ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          )}

          {/* Stop button */}
          {speakingType !== 'none' && (
            <button
              onClick={handleStop}
              className="p-2.5 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold hover:bg-red-200 transition-all cursor-pointer"
              title="पूरी तरह बंद करें (Stop)"
            >
              <Square className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Highlight Toggle & Realtime Spoken Word Indicator */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Dolby Audio Mobile Badge */}
          <span
            className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1.5 rounded-2xl bg-indigo-950 text-indigo-100 border border-indigo-700 shadow-xs tracking-wide"
            title="डॉल्बी एचडी क्रिस्टल क्लियर ऑडियो"
          >
            <span>🔊</span>
            <span>DOLBY HD ऑडियो</span>
          </span>

          <button
            onClick={() => {
              playSound('click');
              setHighlightEnabled(!highlightEnabled);
            }}
            className={`px-3 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all border cursor-pointer ${
              highlightEnabled
                ? 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/60 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
            }`}
            title="बोलते समय शब्द और वाक्य को हाइलाइट करने की सुविधा"
          >
            <Highlighter
              className={`w-3.5 h-3.5 ${highlightEnabled ? 'text-amber-600' : ''}`}
            />
            <span>{highlightEnabled ? '💡 हाइलाइटिंग चालू' : 'हाइलाइट बंद'}</span>
          </button>

          {speakingType !== 'none' && (
            <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>
                {spokenWordText ? (
                  <>
                    बोल रहे हैं: <strong className="underline decoration-amber-400">{spokenWordText}</strong>
                  </>
                ) : (
                  'पढ़ाई चल रही है...'
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Dual-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Original English Text with Real-time Sentence & Word Highlighting */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-purple-100 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-extrabold">
                  EN
                </span>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                  मूल पाठ (English Text - कराओके हाइलाइट)
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => copyToClipboard(lesson.extractedText, 'eng')}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  title="कॉपी करें"
                >
                  {copiedEng ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedEng ? 'कॉपी हुआ' : 'कॉपी'}</span>
                </button>
              </div>
            </div>

            {/* Interactive English Body with Word/Sentence Highlighter */}
            <div
              className={`p-4 rounded-2xl bg-purple-50/20 dark:bg-slate-800/30 border border-purple-100/50 dark:border-slate-800/80 ${fontClass}`}
            >
              {renderInteractiveEnglish()}
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>
              कुल {lesson.extractedText.split(/\s+/).filter(Boolean).length} शब्द
            </span>
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              👉 शब्द पर टैप करके अर्थ देखें
            </span>
          </div>
        </div>

        {/* Right Card: Kid-friendly Hindi Translation with Highlighting */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-purple-100 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 flex items-center justify-center text-xs font-extrabold">
                  HI
                </span>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                  सरल हिंदी अनुवाद (Hindi Translation)
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => copyToClipboard(lesson.translatedText, 'hin')}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-pink-50 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  title="अनुवाद कॉपी करें"
                >
                  {copiedHin ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedHin ? 'कॉपी हुआ' : 'कॉपी'}</span>
                </button>
              </div>
            </div>

            {/* Hindi Translated Body */}
            <div
              className={`p-4 rounded-2xl bg-pink-50/20 dark:bg-slate-800/30 border border-pink-100/50 dark:border-slate-800/80 ${fontClass}`}
            >
              {renderInteractiveHindi()}
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="text-pink-600 dark:text-pink-400 font-medium">
              ✨ बच्चों के लिए आसान और सरल हिंदी
            </span>
            <button
              onClick={handlePlayHindi}
              className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              हिंदी में सुनें
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
