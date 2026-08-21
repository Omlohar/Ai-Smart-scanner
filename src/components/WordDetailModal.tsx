import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  Sparkles,
  BookOpen,
  Check,
  Star,
  RefreshCw,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { WordDetail } from '../types';
import { speakText, playSound } from '../utils/speech';
import { getQuickWordInfo } from '../utils/dictionary';

interface WordDetailModalProps {
  word: string | null;
  contextSentence?: string;
  onClose: () => void;
  speechRate: number;
}

export const WordDetailModal: React.FC<WordDetailModalProps> = ({
  word,
  contextSentence,
  onClose,
  speechRate,
}) => {
  const [wordData, setWordData] = useState<WordDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!word) {
      setWordData(null);
      return;
    }

    const cleanWord = word.trim().replace(/^[^\w]+|[^\w]+$/g, '');
    if (!cleanWord) return;

    // Check instant quick dictionary first for instant response
    const quickInfo = getQuickWordInfo(cleanWord);
    if (quickInfo) {
      setWordData(quickInfo);
    }

    // Then fetch full AI enrichment from backend
    fetchWordInfo(cleanWord);
  }, [word]);

  const fetchWordInfo = async (targetWord: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/word-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: targetWord, contextSentence }),
      });

      if (!res.ok) {
        throw new Error('विस्तृत जानकारी लोड नहीं हो सकी');
      }

      const data = await res.json();
      if (data?.data) {
        setWordData(data.data);
      }
    } catch (e: any) {
      // If we don't have quickInfo either, show basic fallback
      if (!wordData) {
        setWordData({
          word: targetWord,
          phoneticHindi: targetWord,
          hindiMeaning: 'अर्थ खोजा जा रहा है...',
          childExplanation: 'इस शब्द का अर्थ और उच्चारण सीखें।',
          examples: [
            {
              en: `Look at the word: ${targetWord}`,
              hi: `इस शब्द को ध्यान से देखें: ${targetWord}`,
            },
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string, lang: 'en' | 'hi' = 'en', slow: boolean = false) => {
    playSound('click');
    speakText(text, {
      lang: lang === 'en' ? 'en-US' : 'hi-IN',
      rate: slow ? 0.6 : speechRate,
    });
  };

  if (!word) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-purple-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">
              {wordData?.emoji || '✨'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black tracking-tight">{word}</h3>
                {wordData?.partOfSpeech && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-purple-100">
                    {wordData.partOfSpeech}
                  </span>
                )}
              </div>
              {wordData?.phoneticHindi && (
                <p className="text-xs font-semibold text-purple-200 mt-0.5">
                  उच्चारण (Speak as): <span className="font-bold text-white">"{wordData.phoneticHindi}"</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            title="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Quick Play Bar */}
        <div className="p-3 bg-purple-50 dark:bg-slate-800/80 border-b border-purple-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSpeak(word, 'en', false)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-xs font-extrabold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span>English उच्चारण</span>
            </button>
            <button
              onClick={() => handleSpeak(word, 'en', true)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold border border-purple-200 dark:border-slate-600"
            >
              0.6x धीमा उच्चारण
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>विस्तार आ रहा है...</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Main Hindi Meaning */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400 block mb-1">
              सरल हिंदी अर्थ (Hindi Meaning):
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-amber-950 dark:text-amber-100">
                {wordData?.hindiMeaning || 'अर्थ लोड हो रहा है...'}
              </span>
              {wordData?.hindiMeaning && (
                <button
                  onClick={() => handleSpeak(wordData.hindiMeaning, 'hi')}
                  className="p-2 rounded-xl bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 hover:bg-amber-300 text-xs"
                  title="हिंदी अर्थ सुनें"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Child-Friendly Explanation */}
          {wordData?.childExplanation && (
            <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-slate-800/40 border border-purple-100 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                आसान समझ (Explanation for Kids):
              </span>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {wordData.childExplanation}
              </p>
            </div>
          )}

          {/* Examples */}
          {wordData?.examples && wordData.examples.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                आसान उदाहरण वाक्य (Examples):
              </span>
              {wordData.examples.map((eg, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {eg.en}
                    </p>
                    <button
                      onClick={() => handleSpeak(eg.en, 'en')}
                      className="text-purple-600 hover:text-purple-800 p-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    👉 {eg.hi}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Synonyms & Antonyms if available */}
          {(wordData?.synonym || wordData?.antonym) && (
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              {wordData.synonym && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                    समानार्थी (Synonyms):
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {wordData.synonym}
                  </span>
                </div>
              )}
              {wordData.antonym && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
                  <span className="font-bold text-rose-800 dark:text-rose-300 block mb-0.5">
                    विलोम (Antonyms):
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {wordData.antonym}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm"
          >
            समझ आ गया (Got it)
          </button>
        </div>
      </div>
    </div>
  );
};
