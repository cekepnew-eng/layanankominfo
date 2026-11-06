const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const getDataUrl = (value) => {
  if (typeof value !== 'string') return null;
  const marker = value.indexOf('data:');
  if (marker < 0) return null;
  const dataUrl = value.slice(marker).split(/\s/)[0];
  return /^data:[^;,]+;base64,[A-Za-z0-9+/]+={0,2}$/.test(dataUrl) ? dataUrl : null;
};

const validateUploadPayload = (value, { documentsOnly = false } = {}) => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const error = validateUploadPayload(item, { documentsOnly });
      if (error) return error;
    }
    return '';
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      const error = validateUploadPayload(item, { documentsOnly });
      if (error) return error;
    }
    return '';
  }
  if (typeof value !== 'string') return '';

  const dataUrl = getDataUrl(value);
  if (!dataUrl) return value.includes('data:')
    ? 'Format file tidak valid. Unggah ulang dokumen atau foto.'
    : '';
  const [, mimeType, encodedData] = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (mimeType === 'application/pdf') {
    const bytes = Buffer.from(encodedData, 'base64').length;
    return bytes > MAX_DOCUMENT_SIZE ? 'Ukuran dokumen maksimal 5 MB.' : '';
  }
  if (!documentsOnly && ALLOWED_IMAGE_TYPES.has(mimeType)) {
    const bytes = Buffer.from(encodedData, 'base64').length;
    return bytes > MAX_IMAGE_SIZE ? 'Ukuran foto maksimal 2 MB.' : '';
  }
  return 'File harus berupa PDF, JPG, PNG, atau WEBP.';
};

const validateRequiredFileFields = (schema, formData = {}) => {
  const fileFormData = formData && typeof formData === 'object' ? formData : {};
  let fields = schema;
  if (typeof fields === 'string') {
    try {
      fields = JSON.parse(fields);
    } catch (error) {
      return 'Konfigurasi formulir layanan tidak valid.';
    }
  }
  if (!Array.isArray(fields)) return '';

  for (const field of fields) {
    if (field.type === 'group') {
      const error = validateRequiredFileFields(field.subFields || [], fileFormData);
      if (error) return error;
      continue;
    }
    if (field.type !== 'file') continue;

    const keys = [...new Set([field.id, field.label, field.name].filter(Boolean))];
    const value = keys.map(key => fileFormData[key]).find(item =>
      (typeof item === 'string' && item.trim() !== '') || (item && typeof item === 'object')
    );
    if (field.required !== false && value === undefined) {
      return `Berkas "${field.label || field.name || 'lampiran'}" wajib diunggah.`;
    }
    if (value !== undefined) {
      const error = validateUploadPayload(value);
      if (error) return error;
    }
  }
  return '';
};

module.exports = { validateUploadPayload, validateRequiredFileFields };
