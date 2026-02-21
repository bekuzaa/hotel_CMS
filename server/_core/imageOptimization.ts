/**
 * Image Optimization Utilities
 * Handles image resizing, compression, and format conversion
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-100
  format?: 'jpeg' | 'png' | 'webp';
  preserveAspectRatio?: boolean;
}

export interface OptimizedImageResult {
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  format: string;
  compressionRatio: number;
}

// Default optimization presets
export const IMAGE_PRESETS = {
  thumbnail: {
    maxWidth: 150,
    maxHeight: 150,
    quality: 80,
    format: 'webp' as const,
  },
  small: {
    maxWidth: 320,
    maxHeight: 240,
    quality: 85,
    format: 'webp' as const,
  },
  medium: {
    maxWidth: 640,
    maxHeight: 480,
    quality: 85,
    format: 'webp' as const,
  },
  large: {
    maxWidth: 1280,
    maxHeight: 720,
    quality: 90,
    format: 'webp' as const,
  },
  banner: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 90,
    format: 'webp' as const,
  },
};

/**
 * Calculate optimal dimensions while preserving aspect ratio
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Scale down if needed
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  return { width, height };
}

/**
 * Get image metadata from buffer
 */
export async function getImageMetadata(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  // Basic format detection from magic bytes
  const format = detectImageFormat(buffer);
  
  // Extract dimensions (simplified - in production use sharp or jimp)
  const dimensions = await extractDimensions(buffer, format);
  
  return {
    ...dimensions,
    format,
    size: buffer.length,
  };
}

/**
 * Detect image format from magic bytes
 */
function detectImageFormat(buffer: Buffer): string {
  if (buffer.length < 8) return 'unknown';
  
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'png';
  }
  
  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'jpeg';
  }
  
  // WebP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'webp';
  }
  
  // GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'gif';
  }
  
  return 'unknown';
}

/**
 * Extract dimensions from image buffer (simplified)
 */
async function extractDimensions(buffer: Buffer, format: string): Promise<{ width: number; height: number }> {
  try {
    switch (format) {
      case 'png':
        // PNG dimensions are at bytes 16-24
        return {
          width: buffer.readUInt32BE(16),
          height: buffer.readUInt32BE(20),
        };
      
      case 'jpeg':
        // JPEG requires parsing markers (simplified)
        return parseJpegDimensions(buffer);
      
      case 'webp':
        // WebP dimensions extraction
        return parseWebPDimensions(buffer);
      
      default:
        return { width: 0, height: 0 };
    }
  } catch {
    return { width: 0, height: 0 };
  }
}

/**
 * Parse JPEG dimensions from markers
 */
function parseJpegDimensions(buffer: Buffer): { width: number; height: number } {
  let offset = 2; // Skip SOI marker
  
  while (offset < buffer.length - 4) {
    if (buffer[offset] !== 0xFF) {
      offset++;
      continue;
    }
    
    const marker = buffer[offset + 1];
    
    // SOF markers contain dimensions
    if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2 || marker === 0xC3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    
    // Skip to next marker
    offset += 2 + buffer.readUInt16BE(offset + 2);
  }
  
  return { width: 0, height: 0 };
}

/**
 * Parse WebP dimensions
 */
function parseWebPDimensions(buffer: Buffer): { width: number; height: number } {
  // VP8 format
  if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x20) {
    return {
      height: buffer.readUInt16LE(24) & 0x3FFF,
      width: buffer.readUInt16LE(26) & 0x3FFF,
    };
  }
  
  // VP8L format
  if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x4C) {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3FFF) + 1,
      height: ((bits >> 14) & 0x3FFF) + 1,
    };
  }
  
  return { width: 0, height: 0 };
}

/**
 * Validate image file
 */
export function validateImage(buffer: Buffer, maxSizeBytes: number = 10 * 1024 * 1024): {
  valid: boolean;
  error?: string;
} {
  if (buffer.length === 0) {
    return { valid: false, error: 'Empty file' };
  }
  
  if (buffer.length > maxSizeBytes) {
    return { valid: false, error: `File too large (max ${maxSizeBytes / 1024 / 1024}MB)` };
  }
  
  const format = detectImageFormat(buffer);
  if (format === 'unknown') {
    return { valid: false, error: 'Unsupported image format' };
  }
  
  return { valid: true };
}

/**
 * Generate image variants for responsive design
 */
export function generateVariantKey(originalKey: string, preset: keyof typeof IMAGE_PRESETS): string {
  const lastDot = originalKey.lastIndexOf('.');
  const extension = lastDot > -1 ? originalKey.slice(lastDot) : '';
  const baseName = lastDot > -1 ? originalKey.slice(0, lastDot) : originalKey;
  
  return `${baseName}_${preset}${extension ? `.${IMAGE_PRESETS[preset].format}` : ''}`;
}

/**
 * Get content type for image format
 */
export function getContentType(format: string): string {
  const contentTypes: Record<string, string> = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  
  return contentTypes[format.toLowerCase()] || 'application/octet-stream';
}
