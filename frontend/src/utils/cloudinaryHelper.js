/**
 * Cloudinary URL Helper Utility
 * 
 * Generates optimized Cloudinary URLs based on image type, device context, and pixel density.
 * Supports blur-up placeholders, srcset generation, and automatic format/quality optimization.
 * 
 * IMPORTANT: Keep architecture flexible for future offline caching - use this helper everywhere,
 * don't hardcode Cloudinary URLs in components.
 */

// Image type configurations with aspect ratios and size matrices
const IMAGE_CONFIG = {
  page: {
    aspectRatio: 4 / 3, // 4:3 landscape
    sizes: {
      phone2x: { width: 1600, height: 1200 },
      phone3x: { width: 2400, height: 1800 },
      tablet2x: { width: 2400, height: 1800 },
      thumbnail: null, // No thumbnails for pages
      placeholder: { width: 40, height: 30 }, // Blur-up placeholder
    },
  },
  cover: {
    aspectRatio: 3 / 4, // 3:4 portrait
    sizes: {
      phone2x: { width: 600, height: 800 },
      phone3x: { width: 900, height: 1200 },
      tablet2x: { width: 900, height: 1200 },
      thumbnail: { width: 300, height: 400 },
      placeholder: { width: 30, height: 40 },
    },
  },
  icon: {
    aspectRatio: 1, // 1:1 square
    sizes: {
      phone2x: { width: 300, height: 300 },
      phone3x: { width: 450, height: 450 },
      tablet2x: { width: 400, height: 400 },
      thumbnail: { width: 160, height: 160 },
      placeholder: { width: 20, height: 20 },
    },
  },
};

// Cache for transformed URLs to minimize repeated string operations
const urlCache = new Map();

/**
 * Detects device type and pixel density
 * @returns {{ isTablet: boolean, pixelDensity: number, sizeKey: string }}
 */
export const getDeviceContext = () => {
  const width = window.innerWidth;
  const pixelDensity = window.devicePixelRatio || 1;
  const isTablet = width >= 768;
  
  let sizeKey;
  if (isTablet) {
    sizeKey = 'tablet2x';
  } else if (pixelDensity >= 2.5) {
    sizeKey = 'phone3x';
  } else {
    sizeKey = 'phone2x';
  }
  
  return { isTablet, pixelDensity, sizeKey };
};

/**
 * Extracts Cloudinary base URL and public ID from a full URL
 * @param {string} url - Full Cloudinary URL
 * @returns {{ baseUrl: string, publicId: string } | null}
 */
const parseCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // Match Cloudinary URL pattern
  // Example: https://res.cloudinary.com/dhcxck5bi/image/upload/v1234567890/folder/image.jpg
  const cloudinaryRegex = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload)(?:\/v\d+)?(\/.*?)$/;
  const match = url.match(cloudinaryRegex);
  
  if (match) {
    return {
      baseUrl: match[1],
      publicId: match[2],
    };
  }
  
  // Also handle URLs that might already have transformations
  const transformedRegex = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload)\/[^/]+\/(v\d+\/.*?)$/;
  const transformedMatch = url.match(transformedRegex);
  
  if (transformedMatch) {
    return {
      baseUrl: transformedMatch[1],
      publicId: '/' + transformedMatch[2],
    };
  }
  
  return null;
};

/**
 * Generates a transformed Cloudinary URL
 * @param {string} originalUrl - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @param {number} options.width - Target width
 * @param {number} options.height - Target height (optional, will maintain aspect if not provided)
 * @param {boolean} options.blur - Add blur effect for placeholder
 * @param {string} options.crop - Crop mode (default: 'fill')
 * @param {string} options.gravity - Gravity for cropping (default: 'auto')
 * @returns {string} Transformed URL
 */
export const transformCloudinaryUrl = (originalUrl, options = {}) => {
  const { width, height, blur = false, crop = 'fill', gravity = 'auto' } = options;
  
  const parsed = parseCloudinaryUrl(originalUrl);
  if (!parsed) {
    // Not a Cloudinary URL, return as-is
    return originalUrl;
  }
  
  // Build transformation string
  const transforms = [];
  
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop) transforms.push(`c_${crop}`);
  if (gravity) transforms.push(`g_${gravity}`);
  if (blur) transforms.push('e_blur:1000');
  
  // Always add auto format and quality for optimization
  transforms.push('f_auto', 'q_auto');
  
  const transformString = transforms.join(',');
  
  return `${parsed.baseUrl}/${transformString}${parsed.publicId}`;
};

/**
 * Main helper function to get optimized Cloudinary URL
 * @param {string} originalUrl - Original Cloudinary URL
 * @param {string} type - Image type: 'page', 'cover', or 'icon'
 * @param {Object} options - Additional options
 * @param {string} options.size - Size override: 'phone2x', 'phone3x', 'tablet2x', 'thumbnail', 'placeholder'
 * @param {boolean} options.blur - Force blur (for placeholders)
 * @returns {string} Optimized URL
 */
export const cloudinaryUrl = (originalUrl, type = 'page', options = {}) => {
  if (!originalUrl) return '';
  
  const config = IMAGE_CONFIG[type];
  if (!config) {
    console.warn(`Unknown image type: ${type}, returning original URL`);
    return originalUrl;
  }
  
  // Determine size key
  const sizeKey = options.size || getDeviceContext().sizeKey;
  const sizeConfig = config.sizes[sizeKey];
  
  if (!sizeConfig) {
    // Size not available for this type (e.g., thumbnail for pages)
    return originalUrl;
  }
  
  // Generate cache key
  const cacheKey = `${originalUrl}|${type}|${sizeKey}|${options.blur || false}`;
  
  if (urlCache.has(cacheKey)) {
    return urlCache.get(cacheKey);
  }
  
  const transformedUrl = transformCloudinaryUrl(originalUrl, {
    width: sizeConfig.width,
    height: sizeConfig.height,
    blur: options.blur || sizeKey === 'placeholder',
  });
  
  // Cache the result
  urlCache.set(cacheKey, transformedUrl);
  
  return transformedUrl;
};

/**
 * Generates srcset string for responsive images
 * @param {string} originalUrl - Original Cloudinary URL
 * @param {string} type - Image type: 'page', 'cover', or 'icon'
 * @returns {string} srcset string for use in img tag
 */
export const generateSrcSet = (originalUrl, type = 'page') => {
  if (!originalUrl) return '';
  
  const config = IMAGE_CONFIG[type];
  if (!config) return '';
  
  const srcsetEntries = [];
  
  // Generate entries for each size
  const sizes = config.sizes;
  
  if (sizes.phone2x) {
    const url = cloudinaryUrl(originalUrl, type, { size: 'phone2x' });
    srcsetEntries.push(`${url} ${sizes.phone2x.width}w`);
  }
  
  if (sizes.phone3x) {
    const url = cloudinaryUrl(originalUrl, type, { size: 'phone3x' });
    srcsetEntries.push(`${url} ${sizes.phone3x.width}w`);
  }
  
  if (sizes.tablet2x) {
    const url = cloudinaryUrl(originalUrl, type, { size: 'tablet2x' });
    srcsetEntries.push(`${url} ${sizes.tablet2x.width}w`);
  }
  
  return srcsetEntries.join(', ');
};

/**
 * Gets sizes attribute for responsive images
 * @param {string} type - Image type: 'page', 'cover', or 'icon'
 * @returns {string} sizes attribute for use in img tag
 */
export const getSizesAttribute = (type = 'page') => {
  switch (type) {
    case 'page':
      // Book pages take full width on mobile, 80% on larger screens
      return '(max-width: 768px) 100vw, 80vw';
    case 'cover':
      // Book covers are in carousels, fixed widths
      return '(max-width: 768px) 160px, 200px';
    case 'icon':
      // Icons are small and fixed
      return '160px';
    default:
      return '100vw';
  }
};

/**
 * Gets blur-up placeholder URL
 * @param {string} originalUrl - Original Cloudinary URL
 * @param {string} type - Image type: 'page', 'cover', or 'icon'
 * @returns {string} Tiny blurred placeholder URL
 */
export const getPlaceholderUrl = (originalUrl, type = 'page') => {
  return cloudinaryUrl(originalUrl, type, { size: 'placeholder', blur: true });
};

/**
 * Gets optimized URL for current device
 * @param {string} originalUrl - Original Cloudinary URL
 * @param {string} type - Image type
 * @returns {string} Optimized URL for current device
 */
export const getOptimizedUrl = (originalUrl, type = 'page') => {
  return cloudinaryUrl(originalUrl, type);
};

/**
 * Gets thumbnail URL
 * @param {string} originalUrl - Original Cloudinary URL
 * @param {string} type - Image type (must be 'cover' or 'icon')
 * @returns {string} Thumbnail URL
 */
export const getThumbnailUrl = (originalUrl, type = 'cover') => {
  return cloudinaryUrl(originalUrl, type, { size: 'thumbnail' });
};

/**
 * Validation helper for admin uploads
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} type - Image type: 'page', 'cover', or 'icon'
 * @returns {{ valid: boolean, warnings: string[], errors: string[] }}
 */
export const validateImageDimensions = (width, height, type) => {
  const config = IMAGE_CONFIG[type];
  if (!config) {
    return { valid: false, warnings: [], errors: [`Unknown image type: ${type}`] };
  }
  
  const warnings = [];
  const errors = [];
  
  // Check aspect ratio (with 5% tolerance)
  const actualRatio = width / height;
  const expectedRatio = config.aspectRatio;
  const ratioDiff = Math.abs(actualRatio - expectedRatio) / expectedRatio;
  
  if (ratioDiff > 0.05) {
    const expectedStr = type === 'page' ? '4:3 (landscape)' : type === 'cover' ? '3:4 (portrait)' : '1:1 (square)';
    errors.push(`Görsel en boy oranı ${expectedStr} olmalıdır. Mevcut oran: ${actualRatio.toFixed(2)}`);
  }
  
  // Check minimum dimensions (use largest size as minimum)
  const minSize = config.sizes.phone3x || config.sizes.tablet2x;
  if (minSize) {
    if (width < minSize.width || height < minSize.height) {
      warnings.push(`Önerilen minimum boyut: ${minSize.width}×${minSize.height}px. Mevcut: ${width}×${height}px`);
    }
  }
  
  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
};

// Export config for reference
export const IMAGE_STANDARDS = IMAGE_CONFIG;

export default {
  cloudinaryUrl,
  generateSrcSet,
  getSizesAttribute,
  getPlaceholderUrl,
  getOptimizedUrl,
  getThumbnailUrl,
  transformCloudinaryUrl,
  validateImageDimensions,
  getDeviceContext,
  IMAGE_STANDARDS,
};
