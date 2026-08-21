import React from 'react';
import {
  Clock,
  Heart,
  Trash2,
  BookOpen,
  ArrowRight,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { LessonData } from '../types';
import { playSound } from '../utils/speech';

interface HistoryViewProps {
  lessons: LessonData[];
  onSelectLesson: (lesson: LessonData) => void;
  onDeleteLesson: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  lessons,
  onSelectLesson,
  onDeleteLesson,
  onToggleFavorite,
}) => {
  if (lessons.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-purple-100 dark:border-slate-800 space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-3xl">
          📖
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          कोई सहेजा गया पाठ नहीं है
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          जब आप नई फोटो स्कैन करेंगे या तैयार पाठ पढ़ेंगे, वे यहाँ अपने आप सहेज लिए जाएंगे।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-600" />
          सहेजे गए पाठ व इतिहास (Saved Lessons):
        </h3>
        <span className="text-xs font-semibold text-slate-500">
          कुल {lessons.length} पाठ
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lessons.map((item) => (
          <div
            key={item.id}
            className="group relative bg-white dark:bg-slate-900 rounded-3xl p-5 border border-purple-100 dark:border-slate-800 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base line-clamp-1 group-hover:text-purple-600 transition-colors">
                  {item.title || 'स्कैन किया गया पाठ'}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item.id);
                  }}
                  className={`p-1.5 rounded-xl border transition-all ${
                    item.isFavorite
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'text-slate-400 hover:text-rose-500 border-slate-200 dark:border-slate-700'
                  }`}
                  title={item.isFavorite ? 'पसंदीदा से हटाएं' : 'पसंदीदा में जोड़ें'}
                >
                  <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-rose-500' : ''}`} />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {item.summaryInHindi || item.translatedText}
              </p>

              <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>{new Date(item.timestamp).toLocaleDateString('hi-IN')}</span>
                <span>•</span>
                <span>{item.vocabList?.length || 0} मुख्य शब्द</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  playSound('click');
                  onSelectLesson(item);
                }}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <span>पाठ खोलें</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLesson(item.id);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="हटाएं"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
