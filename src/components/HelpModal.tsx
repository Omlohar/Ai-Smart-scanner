import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Volume2, Camera, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { speakText, hasHindiVoice, playSound } from '../utils/speech';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const testEnglishVoice = () => {
    playSound('click');
    setTestResult('English आवाज चल रही है...');
    speakText('Hello! This is English reading voice.', {
      lang: 'en-US',
      rate: 0.85,
      onEnd: () => setTestResult('English आवाज सफलतापूर्वक चल गई! ✅'),
      onError: () => setTestResult('English आवाज में रुकावट आई।'),
    });
  };

  const testHindiVoice = () => {
    playSound('click');
    setTestResult('हिंदी आवाज चल रही है...');
    speakText('नमस्ते! यह सरल हिंदी बोलने वाली आवाज है।', {
      lang: 'hi-IN',
      rate: 0.85,
      onEnd: () => setTestResult('हिंदी आवाज सफलतापूर्वक चल गई! ✅'),
      onError: () => setTestResult('हिंदी आवाज में रुकावट आई।'),
    });
  };

  const hasNativeHindi = hasHindiVoice();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-purple-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl">
              👧
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                स्मार्ट स्कैनर वाचक - मार्गदर्शिका व आवाज जांच
              </h3>
              <p className="text-xs text-purple-200">
                बच्ची के लिए English सीखना और पढ़ना आसान बनाएँ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          {/* Voice Testing Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800/80 dark:to-slate-800/80 border border-purple-200 dark:border-slate-700 space-y-2.5">
            <h4 className="font-extrabold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 text-sm">
              <Volume2 className="w-4 h-4 text-purple-600" />
              आवाज जांचें (Test Speech Voices):
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              बटन दबाकर देखें कि आपके फोन में Hindi और English आवाज सही आ रही है:
            </p>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <button
                type="button"
                onClick={testEnglishVoice}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>🇬🇧 Test English Voice</span>
              </button>
              <button
                type="button"
                onClick={testHindiVoice}
                className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>🇮🇳 Test Hindi Voice</span>
              </button>
            </div>
            {testResult && (
              <p className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-purple-100 dark:border-slate-700">
                {testResult}
              </p>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-slate-800/60 border border-purple-100 dark:border-slate-700 space-y-1.5">
            <h4 className="font-extrabold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 text-sm">
              <Camera className="w-4 h-4 text-purple-600" />
              1. फोटो खींचें या अपलोड करें
            </h4>
            <p className="leading-relaxed">
              किताब के पन्ने, स्कूल की वर्कशीट या होमवर्क की साफ सीधी फोटो लें। AI तुरंत पूरा टेक्स्ट पढ़ लेगा और बच्चों के लिए सरल हिंदी में अनुवाद कर देगा।
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-pink-50 dark:bg-slate-800/60 border border-pink-100 dark:border-slate-700 space-y-1.5">
            <h4 className="font-extrabold text-pink-900 dark:text-pink-300 flex items-center gap-1.5 text-sm">
              <Volume2 className="w-4 h-4 text-pink-600" />
              2. शब्द पर टैप करके उच्चारण व अर्थ समझें
            </h4>
            <p className="leading-relaxed">
              किसी भी English शब्द पर सिर्फ एक बार टैप करें। स्क्रीन पर उसका सही हिंदी उच्चारण (जैसे <em>"Knowledge"</em> = <strong>"नॉलेज"</strong>) और सरल हिंदी अर्थ खुल जाएगा।
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-slate-800/60 border border-amber-100 dark:border-slate-700 space-y-1.5">
            <h4 className="font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-sm">
              <BookOpen className="w-4 h-4 text-amber-600" />
              3. धीमी गति में सुनकर अभ्यास करें
            </h4>
            <p className="leading-relaxed">
              ऊपर टूलबार में <strong>0.8x या 0.6x</strong> गति चुनकर बच्ची धीरे-धीरे और साफ उच्चारण के साथ सुन सकती है।
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-slate-800/60 border border-emerald-100 dark:border-slate-700 space-y-1.5">
            <h4 className="font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              4. अभ्यास क्विज खेलें
            </h4>
            <p className="leading-relaxed">
              पाठ पढ़ने के बाद <strong>"अभ्यास क्विज"</strong> टैब पर जाकर 3-4 मज़ेदार सवाल हल करें और नए शब्द पक्के करें!
            </p>
          </div>

          {/* Developer & Firm Credits Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                ⚡ EX Digital Solution
              </span>
              <span className="text-[11px] text-purple-200">Official Creator</span>
            </div>
            <div className="pt-1">
              <p className="text-sm font-extrabold text-white">
                निर्माता / डेवलपर: <span className="text-amber-300">Er. Pankaj Lohar</span> (इंजीनियर पंकज लोहार)
              </p>
              <p className="text-xs text-purple-200 mt-1 leading-relaxed">
                बच्चों की शिक्षा को डिजिटल तकनीक व आर्टिफिशियल इंटेलिजेंस (AI) द्वारा सरल और रोचक बनाने हेतु समर्पित।
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm"
          >
            समझ गए (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
