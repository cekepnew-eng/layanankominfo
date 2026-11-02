const PHOTO_FIELDS = [
  'foto_profil',
  'foto_profile',
  'fotoProfil',
  'pas_foto',
  'foto_pegawai',
  'foto_url',
  'url_foto',
  'avatar_url',
  'image_url',
  'profile_picture',
  'profile_photo_url',
  'profile_image',
  'photo_url',
  'photo',
  'avatar',
  'picture',
  'foto'
];

function getTndProfileImage(tndUser, tndData, ssoUrl) {
  const profile = tndUser?.profile || tndData?.data?.profile || {};
  const candidate = [
    ...PHOTO_FIELDS.map(field => tndUser?.[field]),
    ...['foto_profil', 'foto', 'url_foto', 'avatar', 'photo', 'image'].map(field => profile?.[field]),
    tndData?.data?.foto_profil,
    tndData?.data?.foto,
    tndData?.data?.foto_url,
    tndData?.data?.avatar,
    tndData?.data?.photo
  ].find(value => typeof value === 'string' && value.trim());

  if (!candidate || candidate.trim().length > 4096) return null;

  const image = candidate.trim();
  try {
    const configuredBaseUrl = process.env.TND_PHOTO_BASE_URL || process.env.VITE_PROFILE_IMAGE_URL;
    if (/^https?:\/\//i.test(image)) {
      const imageUrl = new URL(image);
      if (configuredBaseUrl) {
        const baseUrl = new URL(configuredBaseUrl);
        if (!['http:', 'https:'].includes(baseUrl.protocol)) {
          throw new Error('TND_PHOTO_BASE_URL must use HTTP or HTTPS.');
        }
        if (imageUrl.origin === baseUrl.origin && !imageUrl.pathname.startsWith(baseUrl.pathname)) {
          const filename = imageUrl.pathname.split('/').filter(Boolean).pop();
          if (filename) {
            return new URL(encodeURIComponent(filename), baseUrl.href.endsWith('/') ? baseUrl : `${baseUrl.href}/`).toString();
          }
        }
      }
      return imageUrl.toString();
    }

    const ssoOrigin = new URL(ssoUrl).origin;
    if (image.startsWith('//')) return new URL(`https:${image}`).toString();
    if (image.startsWith('/')) return new URL(image, ssoOrigin).toString();

    if (!image.includes('/') && !image.includes('\\')) {
      if (!configuredBaseUrl) {
        console.error('TND returned a photo filename, but TND_PHOTO_BASE_URL is not configured.');
        return null;
      }
      const baseUrl = new URL(configuredBaseUrl);
      if (!['http:', 'https:'].includes(baseUrl.protocol)) {
        throw new Error('TND_PHOTO_BASE_URL must use HTTP or HTTPS.');
      }
      return new URL(encodeURIComponent(image), baseUrl.href.endsWith('/') ? baseUrl : `${baseUrl.href}/`).toString();
    }

    return new URL(image, ssoOrigin).toString();
  } catch (error) {
    console.error('Invalid TND profile image URL:', error.message);
    return null;
  }
}

module.exports = { getTndProfileImage };
