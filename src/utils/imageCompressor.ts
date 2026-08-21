/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fast client-side image compressor & resizer.
 * Reduces 10MB+ phone camera images to ~150-250KB before uploading.
 * Prevents mobile browser memory overflow, page refreshes, and network timeouts.
 */
export async function compressImage(
  fileOrDataUrl: File | string,
  maxDimension: number = 1400,
  quality: number = 0.82
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;

        // Calculate aspect ratio preserving dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas context fails
          if (typeof fileOrDataUrl === 'string') {
            resolve({ base64: fileOrDataUrl, mimeType: 'image/jpeg' });
          } else {
            const reader = new FileReader();
            reader.onload = (e) =>
              resolve({
                base64: (e.target?.result as string) || '',
                mimeType: fileOrDataUrl.type || 'image/jpeg',
              });
            reader.onerror = reject;
            reader.readAsDataURL(fileOrDataUrl);
          }
          return;
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({
          base64: compressedDataUrl,
          mimeType: 'image/jpeg',
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(new Error('इमेज लोड करने में असमर्थ। कृपया दूसरी फोटो चुनें।'));
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
