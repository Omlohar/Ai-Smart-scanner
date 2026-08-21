import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  FileText,
  Sparkles,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { LessonData } from '../types';
import { SAMPLE_LESSONS } from '../data/sampleLessons';
import { playSound } from '../utils/speech';
import { compressImage } from '../utils/imageCompressor';

interface ScannerInputProps {
  onScanImage: (base64Image: string, mimeType: string) => Promise<void>;
  onTranslateText: (text: string) => Promise<void>;
  onSelectSample: (lesson: LessonData) => void;
  isProcessing: boolean;
  processingStatus: string;
}

export const ScannerInput: React.FC<ScannerInputProps> = ({
  onScanImage,
  onTranslateText,
  onSelectSample,
  isProcessing,
  processingStatus,
}) => {
  const [inputMode, setInputMode] = useState<'upload' | 'camera' | 'text' | 'samples'>('upload');
  const [customText, setCustomText] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stop camera when unmounting or switching tabs
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('कैमरा शुरू नहीं हो सका। कृपया अनुमति दें या फाइल अपलोड विकल्प चुनें।');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    playSound('click');
    const video = videoRef.current;
    
    try {
      setIsCompressing(true);
      const canvas = document.createElement('canvas');
      const width = Math.min(video.videoWidth || 1280, 1400);
      const height = Math.min(video.videoHeight || 720, 1400);
      canvas.width = Math.max(width, 1);
      canvas.height = Math.max(height, 1);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setPreviewImage(dataUrl);
        stopCamera();
        await onScanImage(dataUrl, 'image/jpeg');
      }
    } catch (e) {
      console.error('Camera capture error:', e);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('कृपया केवल एक इमेज (फोटो) फाइल चुनें।');
      return;
    }
    playSound('click');
    setIsCompressing(true);

    try {
      // Automatically resize and compress image to ~150KB for fast free-tier upload & zero memory crashes
      const { base64, mimeType } = await compressImage(file, 1350, 0.82);
      setPreviewImage(base64);
      await onScanImage(base64, mimeType);
    } catch (err: any) {
      console.warn('Compression fallback to standard reader:', err);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
        await onScanImage(result, file.type || 'image/jpeg');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    playSound('click');
    onTranslateText(customText.trim());
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-xl shadow-purple-500/5 border border-purple-100/80 dark:border-slate-800 transition-all">
      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-purple-50/70 dark:bg-slate-800/80 rounded-2xl border border-purple-100 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setInputMode('upload');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              inputMode === 'upload'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>फोटो अपलोड</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInputMode('camera');
              startCamera();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              inputMode === 'camera'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>कैमरा स्कैन</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setInputMode('text');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              inputMode === 'text'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>टेक्स्ट लिखें / पेस्ट</span>
          </button>
        </div>

        {/* Sample Stories / Lessons Button */}
        <button
          type="button"
          onClick={() => {
            stopCamera();
            setInputMode('samples');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-extrabold border transition-all ${
            inputMode === 'samples'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 shadow-md shadow-orange-500/20'
              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>तैयार पाठ (Samples)</span>
        </button>
      </div>

      {/* Mode 1: File Upload & Drag-and-Drop */}
      {inputMode === 'upload' && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all ${
              dragOver
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/30 scale-[1.01]'
                : 'border-purple-200 dark:border-slate-700 bg-gradient-to-b from-purple-50/30 to-white dark:from-slate-800/40 dark:to-slate-900 hover:border-purple-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
              }}
            />

            <div className="max-w-md mx-auto space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-300 shadow-inner">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  किताब के पन्ने या होमवर्क की फोटो चुनें
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  यहाँ क्लिक करें या फोटो खींचकर यहाँ ड्रॉप करें (JPG, PNG, WebP)
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/70 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 text-[11px] font-semibold">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                सुझाव: साफ रोशनी में सीधी फोटो लेने से AI सबसे सटीक पढ़ता है
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Live Camera Capture */}
      {inputMode === 'camera' && (
        <div className="space-y-4">
          {cameraError ? (
            <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-center space-y-3">
              <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700"
              >
                पुनः प्रयास करें
              </button>
            </div>
          ) : (
            <div className="relative rounded-3xl overflow-hidden bg-black aspect-[4/3] max-h-[380px] mx-auto flex items-center justify-center shadow-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={isProcessing || isCompressing}
                  className="px-6 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/40 flex items-center gap-2 transform active:scale-95 transition-all disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                  फोटो खींचें और पढ़ें
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white text-xs backdrop-blur-md"
                  title="बंद करें"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Direct Text Input / Paste */}
      {inputMode === 'text' && (
        <form onSubmit={handleTextSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="यहाँ कोई भी English या Hindi पाठ, कहानी, होमवर्क या वाक्य लिखें या पेस्ट करें..."
              rows={5}
              className="w-full p-4 rounded-2xl border border-purple-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base leading-relaxed resize-y transition-all"
            />
            {customText && (
              <button
                type="button"
                onClick={() => setCustomText('')}
                className="absolute top-3 right-3 text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
              >
                साफ़ करें
              </button>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!customText.trim() || isProcessing}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-purple-600/20 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              सरल हिंदी में अनुवाद और उच्चारण सीखें
            </button>
          </div>
        </form>
      )}

      {/* Mode 4: Sample Lessons for Kids */}
      {inputMode === 'samples' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              सीखने के लिए तैयार सुंदर कहानियाँ और पाठ:
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SAMPLE_LESSONS.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => {
                  playSound('success');
                  onSelectSample(lesson);
                }}
                className="group cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-slate-800/80 dark:to-slate-800/40 border border-purple-200/70 dark:border-slate-700 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all text-left space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-300">
                    <span className="truncate">{lesson.title}</span>
                    <span className="text-base">📖</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                    {lesson.summaryInHindi}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-purple-600 dark:text-purple-400 font-semibold pt-2 border-t border-purple-100 dark:border-slate-700/60">
                  <span>{lesson.vocabList.length} कठिन शब्द</span>
                  <span className="group-hover:translate-x-1 transition-transform">पढ़ना शुरू करें →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing / Progress State Indicator */}
      {isProcessing && (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 animate-pulse flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-300" />
            <div>
              <p className="text-sm font-bold">{processingStatus || 'AI स्कैन और अनुवाद हो रहा है...'}</p>
              <p className="text-xs text-purple-100">बच्ची के लिए सरल हिंदी, उच्चारण और शब्द अर्थ तैयार किए जा रहे हैं</p>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded image thumbnail preview */}
      {previewImage && !isProcessing && (
        <div className="mt-4 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={previewImage}
              alt="Scan Preview"
              className="w-12 h-12 object-cover rounded-xl border border-slate-300 dark:border-slate-600"
            />
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                स्कैन की गई फोटो
              </p>
              <p className="text-[11px] text-slate-500">टेक्स्ट सफलतापूर्वक पढ़ा गया</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
