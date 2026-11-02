const profileImageBaseUrl = import.meta.env.VITE_PROFILE_IMAGE_URL?.trim();
const profileImageCacheVersion = Date.now().toString(36);

const withCacheVersion = (imageUrl, version) => {
  try {
    const url = new URL(imageUrl);
    url.searchParams.set('profileImageVersion', version || profileImageCacheVersion);
    return url.toString();
  } catch {
    return imageUrl;
  }
};

export const getProfileImageUrl = (image, source, cacheVersion) => {
  if (typeof image !== 'string' || !image.trim()) return null;

  const imageValue = image.trim();
  if (/^(data|blob):/i.test(imageValue)) return imageValue;

  const isTndImage = String(source || '').toUpperCase() === 'TND';
  const isAbsoluteUrl = /^(https?:)?\/\//i.test(imageValue);
  if (!profileImageBaseUrl || (!isTndImage && isAbsoluteUrl)) {
    return isTndImage && isAbsoluteUrl ? withCacheVersion(imageValue, cacheVersion) : imageValue;
  }

  try {
    const baseUrl = new URL(profileImageBaseUrl);
    if (!['http:', 'https:'].includes(baseUrl.protocol)) return imageValue;

    const imagePath = isAbsoluteUrl
      ? new URL(imageValue, baseUrl).pathname
      : imageValue.split(/[?#]/, 1)[0].replaceAll('\\', '/');
    const filename = imagePath.split('/').filter(Boolean).pop();
    if (!filename) return imageValue;

    const normalizedBaseUrl = baseUrl.href.endsWith('/') ? baseUrl.href : `${baseUrl.href}/`;
    const imageUrl = new URL(filename, normalizedBaseUrl).toString();
    return isTndImage ? withCacheVersion(imageUrl, cacheVersion) : imageUrl;
  } catch {
    return imageValue;
  }
};
