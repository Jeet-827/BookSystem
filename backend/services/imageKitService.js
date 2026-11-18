/**
 * ImageKit Image Upload Service
 * Handles uploading book covers and promotional media to ImageKit CDN
 */

const getCredentials = () => {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || 'private_ztJQL6rhsM66kCjxxRiZVBbCzrE=';
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || 'public_NuSLYQVfr88fx8bAosC2M0+cAHE=';
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/55dq64n9a';
  return { privateKey, publicKey, urlEndpoint };
};

/**
 * Upload an image file (base64 string, buffer, or remote URL) to ImageKit
 * @param {Object} params
 * @param {string|Buffer} params.file - Base64 string, data URL, or remote URL
 * @param {string} [params.fileName] - Name of the file
 * @param {string} [params.folder] - Folder path in ImageKit
 * @returns {Promise<Object>} ImageKit upload response with public CDN URL
 */
export const uploadImageToImageKit = async ({ file, fileName, folder = '/bookmart/books' }) => {
  const { privateKey } = getCredentials();

  if (!file) {
    throw new Error('Image file payload is required for upload');
  }

  const cleanFileName = fileName || `book_cover_${Date.now()}.jpg`;
  const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', cleanFileName);
  formData.append('folder', folder);
  formData.append('useUniqueFileName', 'true');

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: {
      Authorization: authHeader,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || 'ImageKit upload failed';
    throw new Error(`[ImageKit Error] ${errorMsg}`);
  }

  return {
    success: true,
    fileId: data.fileId,
    name: data.name,
    url: data.url,
    thumbnailUrl: data.thumbnailUrl,
    height: data.height,
    width: data.width,
    size: data.size,
    filePath: data.filePath,
  };
};

/**
 * Delete an image file from ImageKit
 * @param {string} fileId
 */
export const deleteImageFromImageKit = async (fileId) => {
  if (!fileId) return false;
  const { privateKey } = getCredentials();
  const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');

  const response = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: authHeader,
    },
  });

  return response.ok;
};
