import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

// Body parser with larger limit for base64 image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Helper to delay execution with exponential backoff and jitter
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Robust helper to safely execute Gemini content generation with multi-model fallback
 * and automatic retries for transient 503 (High Demand) / 429 errors.
 */
async function generateContentWithFallback(
  ai: GoogleGenAI,
  requestConfig: {
    contents: any;
    config?: any;
  }
) {
  // Candidate models to try in sequence with automatic failover
  const candidateModels = [
    'gemini-flash-latest',
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
  ];

  let lastError: any = null;

  for (let modelIdx = 0; modelIdx < candidateModels.length; modelIdx++) {
    const model = candidateModels[modelIdx];
    const maxRetriesForModel = 1; // 1 immediate retry before switching model quickly

    for (let attempt = 0; attempt <= maxRetriesForModel; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: requestConfig.contents,
          config: requestConfig.config,
        });
        return { response, modelUsed: model };
      } catch (err: any) {
        lastError = err;
        const errMessage = err?.message || String(err);
        const isTransient =
          err?.status === 503 ||
          err?.code === 503 ||
          errMessage.includes('503') ||
          errMessage.includes('high demand') ||
          errMessage.includes('UNAVAILABLE') ||
          err?.status === 429 ||
          errMessage.includes('429') ||
          errMessage.includes('RESOURCE_EXHAUSTED');

        if (isTransient && attempt < maxRetriesForModel) {
          const waitTime = 500 + Math.random() * 300;
          await delay(waitTime);
          continue; // retry same model once
        }

        // Switch to next candidate model
        break;
      }
    }

    if (modelIdx < candidateModels.length - 1) {
      await delay(250);
    }
  }

  throw lastError;
}

/**
 * Safely parse JSON from LLM output, stripping markdown fences if present
 */
function safeParseJson(rawText: string | undefined): any {
  if (!rawText) return {};
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(cleaned);
}

/**
 * Clean error message extractor for user-friendly responses
 */
function extractErrorMessage(err: any): string {
  if (!err) return 'अनपेक्षित त्रुटि हुई। कृपया पुनः प्रयास करें।';
  if (typeof err === 'string') return err;
  if (err.message) {
    if (typeof err.message === 'string') {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed?.error?.message) return parsed.error.message;
      } catch {
        // Not a JSON string
      }
      return err.message;
    }
  }
  if (err.error?.message) return err.error.message;
  return 'सर्वर से कनेक्ट करने में समस्या आई। कृपया इंटरनेट या फोटो जांचकर पुनः प्रयास करें।';
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

/**
 * OCR & Kid-Friendly Learning Analysis Endpoint
 * Takes base64 image data and returns:
 * - Extracted text (clean & corrected)
 * - Kid-friendly Hindi translation
 * - Aligned sentences (English <-> Hindi)
 * - Difficult vocabulary with Hindi phonetics & simple meanings
 * - Simple story/passage summary for kids
 */
app.post('/api/ocr-scan', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'कृपया एक फोटो (Image) भेजें।' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    const ai = getAI();

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API Key उपलब्ध नहीं है। कृपया Settings में API Key जोड़ें या तैयार पाठ का उपयोग करें।',
      });
    }

    const prompt = `You are a warm, supportive teacher helping a young school girl in India who struggles with reading and translating English text to Hindi.
Carefully examine the provided image (which could be a school textbook page, handwritten notes, storybook, or worksheet).

Perform the following tasks:
1. Extract ALL text accurately. Correct obvious scanning distortion or slight spelling OCR mistakes. Preserve paragraphs.
2. Detect whether the primary language is English or Hindi.
3. Provide a clear, natural, and child-friendly Hindi translation (सरल और मधुर हिंदी जो एक बच्ची आसानी से समझ सके).
4. Provide a 2-3 sentence simple summary of the text in Hindi ("कहानी/पाठ का सार").
5. Break down the text into aligned sentence pairs. For each sentence, provide:
   - id: sequential number
   - original: The original English sentence
   - phoneticHindi: How to pronounce this English sentence written in Hindi / Devanagari script so an Indian child can read it aloud accurately (e.g. "The clever crow was thirsty" -> "द क्लेवर क्रो वॉज थर्स्टी")
   - translated: The simple, kid-friendly Hindi translation (e.g. "चतुर कौआ प्यासा था")
6. Identify 5 to 10 important or difficult vocabulary words from the text. For each word, provide:
   - word: The English word
   - phoneticHindi: How to pronounce it written in Hindi script (e.g. "Knowledge" -> "नॉलेज", "Beautiful" -> "ब्यूटीफुल", "Difficult" -> "डिफिकल्ट")
   - hindiMeaning: Simple Hindi meaning (e.g. "ज्ञान / जानकारी", "सुंदर", "कठिन / मुश्किल")
   - simpleExample: A very easy sentence with its Hindi translation
   - emoji: A matching emoji icon

Return STRICTLY JSON according to the schema.`;

    const { response, modelUsed } = await generateContentWithFallback(ai, {
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedText: {
              type: Type.STRING,
              description: 'The clean, corrected full text extracted from the image.',
            },
            detectedLanguage: {
              type: Type.STRING,
              description: '"en" for English or "hi" for Hindi.',
            },
            translatedText: {
              type: Type.STRING,
              description: 'The full child-friendly translation in Hindi (or English if source is Hindi).',
            },
            summaryInHindi: {
              type: Type.STRING,
              description: 'Simple 2-3 sentence overview of the passage in simple Hindi.',
            },
            alignedSentences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  original: { type: Type.STRING },
                  phoneticHindi: { type: Type.STRING, description: 'How to read this English sentence written in Hindi / Devanagari script.' },
                  translated: { type: Type.STRING },
                },
                required: ['id', 'original', 'phoneticHindi', 'translated'],
              },
            },
            vocabList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  phoneticHindi: { type: Type.STRING },
                  hindiMeaning: { type: Type.STRING },
                  simpleExample: { type: Type.STRING },
                  emoji: { type: Type.STRING },
                },
                required: ['word', 'phoneticHindi', 'hindiMeaning', 'simpleExample'],
              },
            },
          },
          required: ['extractedText', 'detectedLanguage', 'translatedText', 'summaryInHindi', 'alignedSentences', 'vocabList'],
        },
      },
    });

    const parsedData = safeParseJson(response.text);
    res.json({ success: true, data: parsedData, modelUsed });
  } catch (error: any) {
    console.error('OCR scan error:', error);
    const message = extractErrorMessage(error);
    res.status(500).json({
      error: `फोटो स्कैन करने में अस्थायी रुकावट आई: ${message}. कृपया दोबारा प्रयास करें।`,
    });
  }
});

/**
 * Text Translation & Learning Breakdown Endpoint
 */
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLang = 'hi', style = 'kid_friendly' } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'कृपया अनुवाद के लिए टेक्स्ट दें।' });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API Key उपलब्ध नहीं है।',
      });
    }

    const prompt = `You are a caring teacher helping a young school girl in India.
Translate the following text into ${targetLang === 'hi' ? 'simple, natural Hindi (सरल हिंदी)' : 'simple, clear English'}.
Make sure the language is very easy for a child to understand.

Also:
1. Provide a 2-sentence summary in Hindi.
2. Break it into sentence-by-sentence alignment (original English vs phonetic pronunciation in Hindi script vs Hindi translation).
3. List 4-8 key vocabulary words with phonetic pronunciation in Hindi, simple meaning, and an easy example sentence.

Source text:
"""
${text}
"""`;

    const { response } = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedText: { type: Type.STRING },
            summaryInHindi: { type: Type.STRING },
            alignedSentences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  original: { type: Type.STRING },
                  phoneticHindi: { type: Type.STRING, description: 'How to read the sentence written in Hindi script.' },
                  translated: { type: Type.STRING },
                },
                required: ['id', 'original', 'phoneticHindi', 'translated'],
              },
            },
            vocabList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  phoneticHindi: { type: Type.STRING },
                  hindiMeaning: { type: Type.STRING },
                  simpleExample: { type: Type.STRING },
                  emoji: { type: Type.STRING },
                },
                required: ['word', 'phoneticHindi', 'hindiMeaning', 'simpleExample'],
              },
            },
          },
          required: ['translatedText', 'summaryInHindi', 'alignedSentences', 'vocabList'],
        },
      },
    });

    const parsedData = safeParseJson(response.text);
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Translation error:', error);
    const message = extractErrorMessage(error);
    res.status(500).json({ error: `अनुवाद में समस्या आई: ${message}` });
  }
});

/**
 * Word Deep-Dive Lookup Endpoint
 * Provides pronunciation in Hindi, meanings, synonyms, child-friendly explanation
 */
app.post('/api/word-info', async (req, res) => {
  try {
    const { word, contextSentence } = req.body;
    if (!word || !word.trim()) {
      return res.status(400).json({ error: 'शब्द आवश्यक है।' });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API उपलब्ध नहीं है।' });
    }

    const prompt = `Help a young Indian school girl understand the English word: "${word}".
${contextSentence ? `It appeared in this sentence: "${contextSentence}"` : ''}

Provide:
1. Exact pronunciation written in Devanagari Hindi script (उच्चारण, e.g. "नॉलेज", "डिटरमिनेशन").
2. Simple Hindi meaning (सरल हिंदी अर्थ).
3. Super simple explanation for a child (आसान भाषा में समझाएं).
4. Part of speech in Hindi and English (संज्ञा, क्रिया, विशेषण आदि).
5. 2 simple example sentences with Hindi translations.
6. Easy synonym (समानार्थी) and antonym (विलोम शब्द) if applicable.
7. A suitable emoji.`;

    const { response } = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            phoneticHindi: { type: Type.STRING },
            hindiMeaning: { type: Type.STRING },
            partOfSpeech: { type: Type.STRING },
            childExplanation: { type: Type.STRING },
            examples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  en: { type: Type.STRING },
                  hi: { type: Type.STRING },
                },
                required: ['en', 'hi'],
              },
            },
            synonym: { type: Type.STRING },
            antonym: { type: Type.STRING },
            emoji: { type: Type.STRING },
          },
          required: ['word', 'phoneticHindi', 'hindiMeaning', 'childExplanation', 'examples'],
        },
      },
    });

    const parsed = safeParseJson(response.text);
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Word info error:', error);
    const message = extractErrorMessage(error);
    res.status(500).json({ error: `शब्द का विवरण नहीं मिल सका: ${message}` });
  }
});

/**
 * Fun Quiz Generator for Practice
 */
app.post('/api/quiz', async (req, res) => {
  try {
    const { text, vocabList } = req.body;
    if (!text && (!vocabList || vocabList.length === 0)) {
      return res.status(400).json({ error: 'क्विज बनाने के लिए टेक्स्ट या शब्द आवश्यक हैं।' });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API उपलब्ध नहीं है।' });
    }

    const prompt = `Create a fun, encouraging 3-question multiple choice quiz for a young school girl to test her understanding of this English passage and its vocabulary:

Text:
"""
${(text || '').slice(0, 1500)}
"""

Vocabulary:
${JSON.stringify(vocabList || [])}

Create 3 questions:
- Question 1 & 2: Word meaning / translation (e.g., What is the Hindi meaning of "thirsty"? Or what does the character do?)
- Question 3: Simple comprehension in easy Hindi.

Each question must have 4 options, the correct option index (0 to 3), and an encouraging explanation in Hindi.`;

    const { response } = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['id', 'question', 'options', 'correctIndex', 'explanation'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const parsed = safeParseJson(response.text);
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    const message = extractErrorMessage(error);
    res.status(500).json({ error: `क्विज बनाने में समस्या आई: ${message}` });
  }
});

// Vite middleware for development & static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart OCR Reader server running on port ${PORT}`);
  });
}

startServer();
