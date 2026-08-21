import React from 'react';
import {
  BookOpen,
  Moon,
  Sun,
  Volume2,
  Sparkles,
  Type as TypeIcon,
  HelpCircle,
} from 'lucide-react';
import { FontSize } from '../types';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  fontSize: FontSize;
  onChangeFontSize: (size: FontSize) => void;
  speechRate: number;
  onChangeSpeechRate: (rate: number) => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  fontSize,
  onChangeFontSize,
  speechRate,
  onChangeSpeechRate,
  onOpenHelp,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-purple-100 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold bg-gradient-to-r from-purple-700 via-purple-900 to-indigo-800 dark:from-purple-300 dark:via-pink-200 dark:to-indigo-200 bg-clip-text text-transparent tracking-tight">
                स्मार्ट स्कैनर वाचक
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Easy for Kids
              </span>
              {/* Dolby HD Audio Mobile & Desktop Indicator */}
              <span
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full bg-indigo-900 dark:bg-indigo-950 text-white dark:text-indigo-200 border border-indigo-700 shadow-xs tracking-wider"
                title="Dolby Clear HD Audio Optimized"
              >
                <span>🔊</span>
                <span>DOLBY HD</span>
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs mt-0.5">
              <span className="font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200/70 dark:border-purple-800/60 text-[11px]">
                ⚡ Ex Digital Solution
              </span>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                Created by <strong className="text-purple-700 dark:text-purple-300 font-bold">Er. Pankaj Lohar</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Toolbar (Font size, Speech speed, Theme, Help) */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Font Size Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <span className="px-1.5 text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
              <TypeIcon className="w-3.5 h-3.5" />
            </span>
            <button
              type="button"
              onClick={() => onChangeFontSize('normal')}
              className={`px-2 py-1 rounded-lg transition-all ${
                fontSize === 'normal'
                  ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="सामान्य अक्षर"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => onChangeFontSize('large')}
              className={`px-2 py-1 rounded-lg transition-all ${
                fontSize === 'large'
                  ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="बड़ा फॉन्ट"
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => onChangeFontSize('xlarge')}
              className={`px-2 py-1 rounded-lg transition-all ${
                fontSize === 'xlarge'
                  ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="काफी बड़ा फॉन्ट"
            >
              A++
            </button>
          </div>

          {/* Voice Speed Control */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs gap-2">
            <Volume2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">
              आवाज गति:
            </span>
            <select
              value={speechRate}
              onChange={(e) => onChangeSpeechRate(parseFloat(e.target.value))}
              className="bg-transparent font-bold text-purple-700 dark:text-purple-300 focus:outline-none cursor-pointer"
            >
              <option value="0.6" className="dark:bg-slate-800">0.6x (धीमा)</option>
              <option value="0.8" className="dark:bg-slate-800">0.8x (सीखने के लिए)</option>
              <option value="1.0" className="dark:bg-slate-800">1.0x (सामान्य)</option>
              <option value="1.2" className="dark:bg-slate-800">1.2x (तेज)</option>
            </select>
          </div>

          {/* Help Button */}
          <button
            type="button"
            onClick={onOpenHelp}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
            title="मदद और गाइड (Help)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 text-purple-600 dark:text-amber-400 transition-all border border-slate-200 dark:border-slate-700"
            title={darkMode ? 'लाइट मोड चालू करें' : 'डार्क मोड चालू करें'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
