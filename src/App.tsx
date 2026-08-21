/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  SplitSquareVertical,
  Layers,
  HelpCircle,
  Clock,
  Sparkles,
  Trophy,
  Volume2,
  ChevronRight,
  Heart,
  AlertTriangle,
  RotateCcw,
  X,
} from 'lucide-react';
import { ActiveTab, FontSize, LessonData } from './types';
import { SAMPLE_LESSONS } from './data/sampleLessons';
import { Header } from './components/Header';
import { ScannerInput } from './components/ScannerInput';
import { ReadingView } from './components/ReadingView';
import { SentenceAlignView } from './components/SentenceAlignView';
import { VocabView } from './components/VocabView';
import { QuizView } from './components/QuizView';
import { HistoryView } from './components/HistoryView';
import { WordDetailModal } from './components/WordDetailModal';
import { HelpModal } from './components/HelpModal';
import { playSound } from './utils/speech';

export default function App() {
  // Theme & Preferences State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('smart_ocr_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    return (localStorage.getItem('smart_ocr_font_size') as FontSize) || 'large';
  });

  const [speechRate, setSpeechRate] = useState<number>(() => {
    const saved = localStorage.getItem('smart_ocr_speech_rate');
    return saved ? parseFloat(saved) : 0.8;
  });

  // Main App State with full persistent memory
  const [lessons, setLessons] = useState<LessonData[]>(() => {
    const saved = localStorage.getItem('smart_ocr_saved_lessons');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return SAMPLE_LESSONS;
  });

  const [currentLesson, setCurrentLesson] = useState<LessonData>(() => {
    const savedId = localStorage.getItem('smart_ocr_current_lesson_id');
    const savedLessonsStr = localStorage.getItem('smart_ocr_saved_lessons');
    let loadedLessons = SAMPLE_LESSONS;
    if (savedLessonsStr) {
      try {
        const parsed = JSON.parse(savedLessonsStr);
        if (Array.isArray(parsed) && parsed.length > 0) loadedLessons = parsed;
      } catch (e) {
        // fallback
      }
    }
    if (savedId) {
      const match = loadedLessons.find((l) => l.id === savedId);
      if (match) return match;
    }
    return loadedLessons[0] || SAMPLE_LESSONS[0];
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const saved = localStorage.getItem('smart_ocr_active_tab') as ActiveTab;
    if (saved && ['reader', 'sentences', 'vocab', 'quiz', 'history'].includes(saved)) {
      return saved;
    }
    return 'reader';
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedScan, setLastFailedScan] = useState<{ image: string; mime: string } | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordContextSentence, setWordContextSentence] = useState<string | undefined>(undefined);
  const [helpOpen, setHelpOpen] = useState(false);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('smart_ocr_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('smart_ocr_theme', 'light');
    }
  }, [darkMode]);

  // Persist lessons
  useEffect(() => {
    try {
      localStorage.setItem('smart_ocr_saved_lessons', JSON.stringify(lessons));
    } catch (e) {
      console.warn('Failed to save lessons to localStorage');
    }
  }, [lessons]);

  // Persist current active lesson ID
  useEffect(() => {
    if (currentLesson?.id) {
      localStorage.setItem('smart_ocr_current_lesson_id', currentLesson.id);
    }
  }, [currentLesson?.id]);

  // Persist active tab
  useEffect(() => {
    localStorage.setItem('smart_ocr_active_tab', activeTab);
  }, [activeTab]);

  const handleToggleDarkMode = () => {
    playSound('click');
    setDarkMode((prev) => !prev);
  };

  const handleChangeFontSize = (size: FontSize) => {
    playSound('click');
    setFontSize(size);
    localStorage.setItem('smart_ocr_font_size', size);
  };

  const handleChangeSpeechRate = (rate: number) => {
    playSound('click');
    setSpeechRate(rate);
    localStorage.setItem('smart_ocr_speech_rate', rate.toString());
  };

  /**
   * Helper to format error message cleanly
   */
  const cleanErrorString = (err: any): string => {
    if (!err) return 'कृपया पुनः प्रयास करें।';
    if (typeof err === 'string') {
      try {
        const parsed = JSON.parse(err);
        if (parsed?.error?.message) return parsed.error.message;
        if (parsed?.error) return typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
      } catch {
        return err;
      }
    }
    if (err.message) {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed?.error?.message) return parsed.error.message;
      } catch {
        return err.message;
      }
    }
    return String(err);
  };

  /**
   * OCR Scan Handler: Uploads image to backend Gemini OCR with automated retry support
   */
  const handleScanImage = async (base64Image: string, mimeType: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setLastFailedScan(null);
    setProcessingStatus('फोटो से टेक्स्ट पढ़ा जा रहा है और सरल हिंदी में अनुवाद हो रहा है...');
    
    try {
      const res = await fetch('/api/ocr-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image, mimeType }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const rawMsg = errorData.error || 'स्कैन करने में समस्या आई।';
        throw new Error(cleanErrorString(rawMsg));
      }

      const responseJson = await res.json();
      const result = responseJson.data;

      const newLesson: LessonData = {
        id: 'scan-' + Date.now(),
        title: result.extractedText.slice(0, 30) + '...',
        extractedText: result.extractedText,
        translatedText: result.translatedText,
        summaryInHindi: result.summaryInHindi,
        alignedSentences: result.alignedSentences || [],
        vocabList: result.vocabList || [],
        detectedLanguage: result.detectedLanguage || 'en',
        imageUrl: base64Image,
        timestamp: Date.now(),
        isFavorite: false,
      };

      playSound('scan');
      setCurrentLesson(newLesson);
      setLessons((prev) => [newLesson, ...prev]);
      setActiveTab('reader');
    } catch (err: any) {
      console.error('Scan error:', err);
      const friendlyMsg = cleanErrorString(err);
      setErrorMessage(friendlyMsg);
      setLastFailedScan({ image: base64Image, mime: mimeType });
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  /**
   * Text Translate Handler: Translates custom text input
   */
  const handleTranslateText = async (text: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStatus('टेक्स्ट का अनुवाद और उच्चारण तैयार किया जा रहा है...');
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: 'hi' }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const rawMsg = errorData.error || 'अनुवाद में समस्या आई।';
        throw new Error(cleanErrorString(rawMsg));
      }

      const responseJson = await res.json();
      const result = responseJson.data;

      const newLesson: LessonData = {
        id: 'text-' + Date.now(),
        title: text.slice(0, 30) + '...',
        extractedText: text,
        translatedText: result.translatedText,
        summaryInHindi: result.summaryInHindi,
        alignedSentences: result.alignedSentences || [],
        vocabList: result.vocabList || [],
        timestamp: Date.now(),
        isFavorite: false,
      };

      playSound('success');
      setCurrentLesson(newLesson);
      setLessons((prev) => [newLesson, ...prev]);
      setActiveTab('reader');
    } catch (err: any) {
      console.error('Translate error:', err);
      setErrorMessage(cleanErrorString(err));
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleSelectSample = (lesson: LessonData) => {
    setErrorMessage(null);
    setCurrentLesson(lesson);
    setActiveTab('reader');
  };

  const handleSelectWord = (word: string, contextSentence?: string) => {
    setSelectedWord(word);
    setWordContextSentence(contextSentence);
  };

  const handleToggleFavorite = (id: string) => {
    playSound('click');
    setLessons((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isFavorite: !l.isFavorite } : l))
    );
    if (currentLesson.id === id) {
      setCurrentLesson((l) => ({ ...l, isFavorite: !l.isFavorite }));
    }
  };

  const handleDeleteLesson = (id: string) => {
    playSound('click');
    setLessons((prev) => prev.filter((l) => l.id !== id));
    if (currentLesson.id === id) {
      const remaining = lessons.filter((l) => l.id !== id);
      if (remaining.length > 0) {
        setCurrentLesson(remaining[0]);
      } else {
        setCurrentLesson(SAMPLE_LESSONS[0]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {/* Top App Header */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        fontSize={fontSize}
        onChangeFontSize={handleChangeFontSize}
        speechRate={speechRate}
        onChangeSpeechRate={handleChangeSpeechRate}
        onOpenHelp={() => setHelpOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-24">
        {/* Error notification banner if any occurred */}
        {errorMessage && (
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm">
                  सुझाव व सहायता:
                </h4>
                <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {lastFailedScan && (
                <button
                  type="button"
                  onClick={() => handleScanImage(lastFailedScan.image, lastFailedScan.mime)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>दोबारा स्कैन करें</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="p-1.5 rounded-xl hover:bg-amber-200/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 cursor-pointer"
                title="बंद करें"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input & Scanner Section */}
        <section>
          <ScannerInput
            onScanImage={handleScanImage}
            onTranslateText={handleTranslateText}
            onSelectSample={handleSelectSample}
            isProcessing={isProcessing}
            processingStatus={processingStatus}
          />
        </section>

        {/* Section Navigation Tabs */}
        <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-3xl border border-purple-100 dark:border-slate-800 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setActiveTab('reader');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'reader'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50/50 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>1. मूल पाठ व अनुवाद</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click');
                setActiveTab('sentences');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'sentences'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50/50 dark:hover:bg-slate-800'
              }`}
            >
              <SplitSquareVertical className="w-4 h-4" />
              <span>2. वाक्य दर वाक्य तुलना</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click');
                setActiveTab('vocab');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all relative cursor-pointer ${
                activeTab === 'vocab'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50/50 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>3. कठिन शब्द (Vocab)</span>
              {currentLesson.vocabList?.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black flex items-center justify-center ml-1">
                  {currentLesson.vocabList.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click');
                setActiveTab('quiz');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'quiz'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50/50 dark:hover:bg-slate-800'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>4. अभ्यास क्विज</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click');
                setActiveTab('history');
              }}
              className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50/50 dark:hover:bg-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>सहेजे गए पाठ ({lessons.length})</span>
            </button>
          </div>
        </section>

        {/* Tab Views */}
        <section>
          {activeTab === 'reader' && (
            <ReadingView
              lesson={currentLesson}
              fontSize={fontSize}
              speechRate={speechRate}
              highlightedSentence={wordContextSentence}
              onSelectWord={handleSelectWord}
              onToggleFavorite={handleToggleFavorite}
              onStartQuiz={() => {
                playSound('click');
                setActiveTab('quiz');
              }}
            />
          )}

          {activeTab === 'sentences' && (
            <SentenceAlignView
              lesson={currentLesson}
              fontSize={fontSize}
              speechRate={speechRate}
              onSelectWord={handleSelectWord}
            />
          )}

          {activeTab === 'vocab' && (
            <VocabView
              vocabList={currentLesson.vocabList || []}
              speechRate={speechRate}
              onOpenWordDetail={handleSelectWord}
            />
          )}

          {activeTab === 'quiz' && (
            <QuizView
              lesson={currentLesson}
              speechRate={speechRate}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              lessons={lessons}
              onSelectLesson={(lesson) => {
                setCurrentLesson(lesson);
                setActiveTab('reader');
              }}
              onDeleteLesson={handleDeleteLesson}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </section>
      </main>

      {/* Floating Modals */}
      <WordDetailModal
        word={selectedWord}
        contextSentence={wordContextSentence}
        onClose={() => setSelectedWord(null)}
        speechRate={speechRate}
      />

      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />

      {/* Professional & Encouraging Footer */}
      <footer className="mt-auto py-8 border-t border-purple-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          {/* Main App & Creator Banner */}
          <div className="inline-flex items-center justify-center gap-2 flex-wrap bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 dark:from-slate-800/80 dark:via-purple-950/40 dark:to-slate-800/80 px-4 py-2 rounded-2xl border border-purple-200/80 dark:border-purple-800/60 shadow-xs">
            <span className="font-extrabold bg-gradient-to-r from-purple-700 to-indigo-600 dark:from-purple-400 dark:to-indigo-300 bg-clip-text text-transparent text-sm">
              ✨ Ex Digital Solution
            </span>
            <span className="text-purple-300 dark:text-purple-700">•</span>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-xs sm:text-sm">
              Created with ❤️ by <span className="text-purple-700 dark:text-purple-300 font-extrabold">Er. Pankaj Lohar (इंजीनियर पंकज लोहार)</span>
            </span>
          </div>

          <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
            स्मार्ट स्कैनर वाचक • बच्चों की English सीखने और पढ़ने की प्यारी साथी 💖
          </p>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xl mx-auto">
            AI कैमरा OCR • सरल बाल-सुलभ हिंदी अनुवाद • देवनागरी उच्चारण (Phonetics) • Dolby HD वाचक • शब्दावली व अभ्यास क्विज
          </p>

          <div className="pt-2 text-[10px] text-slate-400 dark:text-slate-600 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-center gap-3">
            <span>© {new Date().getFullYear()} Ex Digital Solution. All Rights Reserved.</span>
            <span>•</span>
            <span>Innovating Education for Children</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
