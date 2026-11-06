export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const IMAGE_FILE_EXTENSIONS = /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i;

export const getUploadFileSizeError = (file) => {
  const isImage = file.type.startsWith('image/') || IMAGE_FILE_EXTENSIONS.test(file.name);
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
  if (file.size <= maxSize) return '';

  return isImage
    ? 'Ukuran foto maksimal 2 MB.'
    : 'Ukuran dokumen maksimal 5 MB.';
};

export const validateUploadFile = (file) => {
  const error = getUploadFileSizeError(file);
  if (error) window.alert(error);
  return !error;
};
