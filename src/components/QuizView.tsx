import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  RefreshCw,
  HelpCircle,
  Smile,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LessonData, QuizQuestion } from '../types';
import { playSound, speakText } from '../utils/speech';

interface QuizViewProps {
  lesson: LessonData;
  speechRate: number;
}

export const QuizView: React.FC<QuizViewProps> = ({ lesson, speechRate }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    generateQuiz();
  }, [lesson.id]);

  const generateQuiz = async () => {
    setLoading(true);
    setCurrentIdx(0);
    setSelectedOption(null);
    setShowResult(false);
    setScore(0);
    setQuizFinished(false);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: lesson.extractedText,
          vocabList: lesson.vocabList,
        }),
      });

      if (!res.ok) throw new Error('क्विज लोड नहीं हो सका');
      const data = await res.json();
      if (data?.data?.questions && data.data.questions.length > 0) {
        setQuestions(data.data.questions);
      } else {
        createFallbackQuiz();
      }
    } catch (e) {
      createFallbackQuiz();
    } finally {
      setLoading(false);
    }
  };

  const createFallbackQuiz = () => {
    // Generate questions directly from the vocabulary list
    const fallbackList: QuizQuestion[] = (lesson.vocabList || []).slice(0, 4).map((vocab, i) => {
      const wrongOptions = [
        'हँसमुख / प्रसन्न',
        'भागना / दौड़ना',
        'बड़ी इमारत',
        'पेड़ की पत्तियाँ',
        'आसमान में उड़ना',
      ].filter((opt) => opt !== vocab.hindiMeaning);

      const options = [
        vocab.hindiMeaning,
        wrongOptions[0] || 'गलत उत्तर 1',
        wrongOptions[1] || 'गलत उत्तर 2',
        wrongOptions[2] || 'गलत उत्तर 3',
      ].sort(() => Math.random() - 0.5);

      return {
        id: i + 1,
        question: `शब्द "${vocab.word}" (उच्चारण: ${vocab.phoneticHindi}) का सही हिंदी अर्थ क्या है?`,
        options,
        correctIndex: options.indexOf(vocab.hindiMeaning),
        explanation: `शाबाश! "${vocab.word}" का मतलब "${vocab.hindiMeaning}" होता है।`,
      };
    });

    if (fallbackList.length === 0) {
      fallbackList.push({
        id: 1,
        question: 'इस पाठ का मुख्य उद्देश्य क्या था?',
        options: ['अंग्रेजी सीखना और समझना', 'सिर्फ चित्र देखना', 'गाड़ी चलाना', 'बाजार जाना'],
        correctIndex: 0,
        explanation: 'बिल्कुल सही! हम पाठ को समझकर अपनी अंग्रेजी सुधार रहे हैं।',
      });
    }

    setQuestions(fallbackList);
  };

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    setShowResult(true);

    const isCorrect = idx === questions[currentIdx].correctIndex;
    if (isCorrect) {
      playSound('cheer');
      setScore((s) => s + 1);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } else {
      playSound('click');
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      setQuizFinished(true);
      if (score >= questions.length / 2) {
        playSound('cheer');
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const handleSpeakQuestion = (text: string) => {
    playSound('click');
    speakText(text, {
      lang: 'hi-IN',
      rate: speechRate,
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-purple-100 dark:border-slate-800 space-y-4">
        <RefreshCw className="w-10 h-10 mx-auto text-purple-600 animate-spin" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          मज़ेदार क्विज तैयार हो रहा है...
        </h3>
        <p className="text-xs text-slate-500">
          आपके पढ़े हुए पाठ से आसान प्रश्न बनाए जा रहे हैं
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-purple-100 dark:border-slate-800 space-y-3">
        <p className="text-slate-500">क्विज लोड नहीं हो सका। कृपया पुनः प्रयास करें।</p>
        <button
          onClick={generateQuiz}
          className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
        >
          पुनः बनाएँ
        </button>
      </div>
    );
  }

  // Quiz Finished Scorecard Screen
  if (quizFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 text-center border border-purple-100 dark:border-slate-800 shadow-xl shadow-purple-500/5 max-w-xl mx-auto space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-white flex items-center justify-center text-4xl shadow-xl shadow-amber-500/30">
          🏆
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {percentage >= 80 ? 'शाबाश बेटा! अद्भुत प्रदर्शन! 🎉' : 'बहुत अच्छा प्रयास! 🌟'}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            आपने कुल <strong>{questions.length}</strong> में से <strong>{score}</strong> प्रश्न सही किए!
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50 dark:bg-slate-800 border border-purple-100 dark:border-slate-700 max-w-xs mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 block mb-1">
            स्कोर प्रतिशत (Score):
          </span>
          <span className="text-3xl font-black text-purple-900 dark:text-purple-100">
            {percentage}%
          </span>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={generateQuiz}
            className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm shadow-md shadow-purple-600/30 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            दोबारा खेलें (Play Again)
          </button>
        </div>
      </div>
    );
  }

  const curr = questions[currentIdx];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-purple-100 dark:border-slate-800 shadow-lg shadow-purple-500/5 max-w-2xl mx-auto space-y-6">
      {/* Progress & Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold">
            प्रश्न {currentIdx + 1} / {questions.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/40">
            <Trophy className="w-3.5 h-3.5" />
            अंक: {score}
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 leading-snug">
            {curr.question}
          </h3>
          <button
            onClick={() => handleSpeakQuestion(curr.question)}
            className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 shrink-0 hover:bg-purple-100"
            title="प्रश्न पढ़कर सुनाएं"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Options List */}
      <div className="space-y-2.5">
        {curr.options.map((opt, oIdx) => {
          let btnStyle =
            'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 hover:border-purple-300 hover:bg-purple-50/40';

          if (showResult) {
            if (oIdx === curr.correctIndex) {
              btnStyle =
                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-extrabold ring-2 ring-emerald-500/20';
            } else if (oIdx === selectedOption) {
              btnStyle =
                'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold';
            } else {
              btnStyle = 'opacity-40 border-slate-200 dark:border-slate-700';
            }
          }

          return (
            <button
              key={oIdx}
              disabled={showResult}
              onClick={() => handleSelectOption(oIdx)}
              className={`w-full p-4 rounded-2xl border text-left text-sm sm:text-base font-semibold flex items-center justify-between gap-3 transition-all cursor-pointer ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-black flex items-center justify-center shrink-0">
                  {String.fromCharCode(65 + oIdx)}
                </span>
                <span>{opt}</span>
              </div>

              {showResult && oIdx === curr.correctIndex && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              {showResult && oIdx === selectedOption && oIdx !== curr.correctIndex && (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Banner after answering */}
      {showResult && (
        <div
          className={`p-4 rounded-2xl border space-y-1.5 animate-in fade-in duration-200 ${
            selectedOption === curr.correctIndex
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 font-black text-sm">
            {selectedOption === curr.correctIndex ? (
              <>
                <span>🎉 सही उत्तर!</span>
              </>
            ) : (
              <>
                <span>💡 सही उत्तर समझें:</span>
              </>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium leading-relaxed">
            {curr.explanation}
          </p>
        </div>
      )}

      {/* Next Button */}
      {showResult && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleNext}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md shadow-purple-600/30 flex items-center gap-2 active:scale-95 transition-all"
          >
            <span>{currentIdx < questions.length - 1 ? 'अगला प्रश्न →' : 'परिणाम देखें 🏆'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
