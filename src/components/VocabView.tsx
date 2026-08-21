import React, { useState } from 'react';
import {
  Volume2,
  Sparkles,
  BookOpen,
  Search,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { VocabWord } from '../types';
import { speakText, playSound } from '../utils/speech';

interface VocabViewProps {
  vocabList: VocabWord[];
  speechRate: number;
  onOpenWordDetail: (word: string) => void;
}

export const VocabView: React.FC<VocabViewProps> = ({
  vocabList,
  speechRate,
  onOpenWordDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  const filteredWords = vocabList.filter(
    (item) =>
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hindiMeaning.includes(searchTerm) ||
      item.phoneticHindi.includes(searchTerm)
  );

  const handleSpeak = (word: string, rateMultiplier: number = 1.0) => {
    playSound('click');
    setPlayingWord(word);
    speakText(word, {
      lang: 'en-US',
      rate: speechRate * rateMultiplier,
      onEnd: () => setPlayingWord(null),
      onError: () => setPlayingWord(null),
    });
  };

  const handleSpeakHindi = (text: string) => {
    playSound('click');
    speakText(text, {
      lang: 'hi-IN',
      rate: speechRate,
    });
  };

  if (vocabList.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-purple-100 dark:border-slate-800 space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-3xl">
          📚
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          कोई कठिन शब्द अभी नहीं मिला
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          जब आप कोई नया पाठ स्कैन करेंगे या अनुवाद करेंगे, तो AI मुख्य शब्द और उनके हिंदी उच्चारण यहाँ दिखाएगा।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search & Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-lg">
            📖
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
              पाठ के मुख्य शब्द (Vocabulary Words)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              उच्चारण (Pronunciation in Hindi) और सरल अर्थ सीखें
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="शब्द या अर्थ खोजें..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Word Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWords.map((item, idx) => (
          <div
            key={idx}
            className="group relative bg-white dark:bg-slate-900 rounded-3xl p-5 border border-purple-100 dark:border-slate-800 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 transition-all flex flex-col justify-between space-y-4"
          >
            {/* Top row: Word + Emoji + Audio */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {item.emoji && <span className="text-2xl">{item.emoji}</span>}
                  <div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                      {item.word}
                    </h4>
                    {/* Hindi Phonetic / Pronunciation */}
                    <div className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 mt-0.5 rounded-md bg-purple-100/70 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
                      <span>उच्चारण:</span>
                      <span className="font-extrabold text-purple-900 dark:text-purple-200">
                        "{item.phoneticHindi}"
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sound buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSpeak(item.word, 1.0)}
                    className={`p-2 rounded-xl border transition-all ${
                      playingWord === item.word
                        ? 'bg-purple-600 text-white border-purple-600 animate-pulse'
                        : 'bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                    }`}
                    title="English में उच्चारण सुनें"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSpeak(item.word, 0.6)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    title="धीमी गति में उच्चारण सुनें (Slow repeat)"
                  >
                    0.6x
                  </button>
                </div>
              </div>

              {/* Hindi Meaning */}
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 my-3">
                <span className="text-[11px] font-bold uppercase tracking-wider block text-amber-700 dark:text-amber-400">
                  हिंदी अर्थ:
                </span>
                <span className="text-base font-extrabold">{item.hindiMeaning}</span>
              </div>

              {/* Simple Example */}
              {item.simpleExample && (
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="font-medium">{item.simpleExample}</p>
                </div>
              )}
            </div>

            {/* Bottom: Deep dive button */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleSpeakHindi(item.hindiMeaning)}
                className="text-xs font-bold text-slate-500 hover:text-purple-600 flex items-center gap-1"
              >
                <Volume2 className="w-3.5 h-3.5" />
                अर्थ सुनें
              </button>

              <button
                onClick={() => onOpenWordDetail(item.word)}
                className="text-xs font-extrabold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                विस्तार से समझें
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
