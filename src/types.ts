export interface AlignedSentence {
  id: number;
  original: string;
  phoneticHindi?: string;
  translated: string;
}

export interface VocabWord {
  word: string;
  phoneticHindi: string;
  hindiMeaning: string;
  simpleExample: string;
  emoji?: string;
}

export interface WordDetail {
  word: string;
  phoneticHindi: string;
  hindiMeaning: string;
  partOfSpeech?: string;
  childExplanation: string;
  examples: Array<{ en: string; hi: string }>;
  synonym?: string;
  antonym?: string;
  emoji?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonData {
  id: string;
  title: string;
  extractedText: string;
  translatedText: string;
  summaryInHindi: string;
  alignedSentences: AlignedSentence[];
  vocabList: VocabWord[];
  detectedLanguage?: string;
  imageUrl?: string;
  timestamp: number;
  isFavorite?: boolean;
  notes?: string;
}

export type ActiveTab = 'reader' | 'sentences' | 'vocab' | 'quiz' | 'history';

export type FontSize = 'normal' | 'large' | 'xlarge' | 'xxlarge';
