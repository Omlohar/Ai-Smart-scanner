import { WordDetail } from '../types';

export const QUICK_DICTIONARY: Record<string, WordDetail> = {
  knowledge: {
    word: 'Knowledge',
    phoneticHindi: 'नॉलेज',
    hindiMeaning: 'ज्ञान / जानकारी',
    partOfSpeech: 'Noun (संज्ञा)',
    childExplanation: 'किसी चीज़ के बारे में सीखी गई सच्ची और अच्छी जानकारी।',
    examples: [
      { en: 'Books give us great knowledge.', hi: 'किताबें हमें बहुत ज्ञान देती हैं।' },
      { en: 'Knowledge is power.', hi: 'ज्ञान ही असली शक्ति है।' },
    ],
    synonym: 'Wisdom, Learning',
    antonym: 'Ignorance',
    emoji: '🧠',
  },
  beautiful: {
    word: 'Beautiful',
    phoneticHindi: 'ब्यूटीफुल',
    hindiMeaning: 'सुंदर / प्यारा',
    partOfSpeech: 'Adjective (विशेषण)',
    childExplanation: 'जो देखने में बहुत प्यारा, सुंदर और मनभावन लगे।',
    examples: [
      { en: 'The butterfly is very beautiful.', hi: 'तितली बहुत सुंदर है।' },
      { en: 'She has a beautiful smile.', hi: 'उसकी मुस्कान बहुत प्यारी है।' },
    ],
    synonym: 'Pretty, Lovely',
    antonym: 'Ugly',
    emoji: '🌸',
  },
  difficult: {
    word: 'Difficult',
    phoneticHindi: 'डिफिकल्ट',
    hindiMeaning: 'कठिन / मुश्किल',
    partOfSpeech: 'Adjective (विशेषण)',
    childExplanation: 'जिस काम को करने में थोड़ी ज्यादा मेहनत या ध्यान की जरूरत हो।',
    examples: [
      { en: 'Practice makes difficult things easy.', hi: 'अभ्यास से कठिन चीजें भी आसान हो जाती हैं।' },
    ],
    synonym: 'Hard, Tough',
    antonym: 'Easy (सरल)',
    emoji: '🧩',
  },
  clever: {
    word: 'Clever',
    phoneticHindi: 'क्लेवर',
    hindiMeaning: 'चतुर / होशियार',
    partOfSpeech: 'Adjective (विशेषण)',
    childExplanation: 'जो बहुत जल्दी और समझदारी से सोचकर काम करता है।',
    examples: [
      { en: 'Riya is a clever student.', hi: 'रिया एक होशियार छात्रा है।' },
    ],
    synonym: 'Smart, Intelligent',
    antonym: 'Foolish',
    emoji: '🦊',
  },
  thirsty: {
    word: 'Thirsty',
    phoneticHindi: 'थर्स्टी',
    hindiMeaning: 'प्यासा',
    partOfSpeech: 'Adjective (विशेषण)',
    childExplanation: 'जब गले को पानी पीने की जरूरत महसूस हो।',
    examples: [
      { en: 'The crow was very thirsty.', hi: 'कौआ बहुत प्यासा था।' },
    ],
    emoji: '🥤',
  },
  morning: {
    word: 'Morning',
    phoneticHindi: 'मॉर्निंग',
    hindiMeaning: 'सुबह / प्रातःकाल',
    partOfSpeech: 'Noun (संज्ञा)',
    childExplanation: 'दिन की शुरुआत जब सूरज उगता है।',
    examples: [
      { en: 'Good morning, teacher!', hi: 'नमस्ते अध्यापिका जी (शुभ प्रभात)!' },
    ],
    emoji: '🌅',
  },
  friend: {
    word: 'Friend',
    phoneticHindi: 'फ्रेंड',
    hindiMeaning: 'मित्र / दोस्त / सहेली',
    partOfSpeech: 'Noun (संज्ञा)',
    childExplanation: 'वह खास साथी जिसके साथ आप खेलते हैं, पढ़ते हैं और बातें बांटते हैं।',
    examples: [
      { en: 'A true friend always helps.', hi: 'सच्चा दोस्त हमेशा मदद करता है।' },
    ],
    synonym: 'Buddy, Pal',
    antonym: 'Enemy',
    emoji: '🤝',
  },
  wonderful: {
    word: 'Wonderful',
    phoneticHindi: 'वंडरफुल',
    hindiMeaning: 'अद्भुत / बहुत शानदार',
    partOfSpeech: 'Adjective (विशेषण)',
    childExplanation: 'जो बहुत ही अच्छा और मन को खुश करने वाला हो।',
    examples: [
      { en: 'We had a wonderful day at the park.', hi: 'हमारा पार्क में दिन बहुत शानदार बीता।' },
    ],
    synonym: 'Amazing, Great',
    emoji: '✨',
  },
  delicious: {
    word: 'Delicious',
    phoneticHindi: 'डेलिशियस',
    hindiMeaning: 'स्वादिष्ट / बहुत लज़ीज़',
    partOfSpeech: 'Adjective (विशेषण)',
    childExplanation: 'जो खाने में बहुत ज़्यादा टेस्टी और मज़ेदार हो।',
    examples: [
      { en: 'The chocolate cake is delicious.', hi: 'चॉकलेट केक बहुत स्वादिष्ट है।' },
    ],
    synonym: 'Tasty, Yummy',
    emoji: '🍰',
  },
};

export function getQuickWordInfo(word: string): WordDetail | null {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (QUICK_DICTIONARY[clean]) {
    return QUICK_DICTIONARY[clean];
  }
  return null;
}
