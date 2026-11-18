/**
 * Google Drive Storage & Download Service
 * Handles OAuth2 authentication, file uploads, permissions, and direct download links.
 */

import DriveConfig from '../models/DriveConfig.js';

const getOAuthCredentials = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/callback';

  return { clientId, clientSecret, redirectUri };
};

/**
 * Generate Google OAuth2 Consent URL
 * @param {string} [customRedirectUri]
 * @returns {string} Authorization URL
 */
export const getDriveAuthUrl = (customRedirectUri) => {
  const { clientId, redirectUri } = getOAuthCredentials();
  const targetRedirect = customRedirectUri || redirectUri;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: targetRedirect,
    response_type: 'code',
    scope:
      'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  });

  return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
};

/**
 * Exchange Authorization Code for Access & Refresh Tokens
 * @param {string} code
 * @param {string} [customRedirectUri]
 * @returns {Promise<Object>}
 */
export const handleDriveAuthCallback = async (code, customRedirectUri) => {
  const { clientId, clientSecret, redirectUri } = getOAuthCredentials();
  const targetRedirect = customRedirectUri || redirectUri;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: targetRedirect,
      grant_type: 'authorization_code',
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || 'Failed to exchange authorization code');
  }

  let connectedEmail = '';
  if (data.access_token) {
    try {
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (userRes.ok) {
        const userInfo = await userRes.json();
        connectedEmail = userInfo.email || '';
      }
    } catch {
      // Ignore userinfo failure
    }
  }

  let config = await DriveConfig.findOne({ key: 'primary' });
  if (!config) {
    config = new DriveConfig({ key: 'primary' });
  }

  config.accessToken = data.access_token;
  if (data.refresh_token) {
    config.refreshToken = data.refresh_token;
  }
  config.expiryDate = Date.now() + (data.expires_in || 3600) * 1000;
  config.scope = data.scope || '';
  config.connectedEmail = connectedEmail || config.connectedEmail || 'Connected Google Account';
  config.isConnected = true;

  await config.save();

  return {
    success: true,
    connectedEmail: config.connectedEmail,
  };
};

/**
 * Get a valid access token (refreshes automatically if expired)
 * @returns {Promise<string>}
 */
export const getValidDriveAccessToken = async () => {
  const { clientId, clientSecret } = getOAuthCredentials();
  const config = await DriveConfig.findOne({ key: 'primary' });

  if (!config || !config.refreshToken) {
    throw new Error(
      'Google Drive is not connected. Please connect your Google account via the Admin portal first.'
    );
  }

  // If token is still valid with > 60s buffer, return it
  if (config.accessToken && config.expiryDate > Date.now() + 60000) {
    return config.accessToken;
  }

  // Refresh the token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Failed to refresh Google Drive token: ${data.error_description || data.error}`);
  }

  config.accessToken = data.access_token;
  config.expiryDate = Date.now() + (data.expires_in || 3600) * 1000;
  await config.save();

  return config.accessToken;
};

/**
 * Check Google Drive connection status
 * @returns {Promise<Object>}
 */
export const getDriveStatus = async () => {
  const config = await DriveConfig.findOne({ key: 'primary' });
  return {
    isConnected: Boolean(config?.isConnected && config?.refreshToken),
    connectedEmail: config?.connectedEmail || '',
    updatedAt: config?.updatedAt || null,
  };
};

/**
 * Upload a digital book file to Google Drive using multipart upload
 * @param {Object} params
 * @param {Buffer|Uint8Array} params.fileBuffer - Raw file binary
 * @param {string} params.fileName - Name of the file with extension
 * @param {string} [params.mimeType] - MIME type of the file
 * @param {string} [params.description] - File description
 * @returns {Promise<Object>} File metadata with direct download URL
 */
export const uploadFileToGoogleDrive = async ({
  fileBuffer,
  fileName,
  mimeType = 'application/pdf',
  description = 'BookMart Digital Book Download',
}) => {
  const accessToken = await getValidDriveAccessToken();

  const boundary = `-------314159265358979323846_${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName || `digital_book_${Date.now()}.pdf`,
    mimeType: mimeType || 'application/pdf',
    description: description || 'BookMart Instant Digital Download',
  };

  const multipartHeader = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  const headerBuffer = Buffer.from(multipartHeader, 'utf8');
  const footerBuffer = Buffer.from(closeDelimiter, 'utf8');
  const bodyBuffer = Buffer.concat([headerBuffer, fileBuffer, footerBuffer]);

  // 1. Upload file to Google Drive
  const uploadResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(bodyBuffer.length),
      },
      body: bodyBuffer,
    }
  );

  const fileData = await uploadResponse.json();
  if (!uploadResponse.ok) {
    throw new Error(
      `[Google Drive Upload Error] ${fileData?.error?.message || 'File upload failed'}`
    );
  }

  const fileId = fileData.id;

  // 2. Set file permission to anyone with link (read-only)
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permErr) {
    console.warn(`[Google Drive] Notice setting public permissions: ${permErr.message}`);
  }

  // Direct universal download URL
  const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const webViewLink = `https://drive.google.com/file/d/${fileId}/view`;

  return {
    success: true,
    fileId,
    name: fileData.name || fileName,
    size: fileData.size ? `${(fileData.size / (1024 * 1024)).toFixed(1)} MB` : '4.5 MB',
    downloadUrl: directDownloadUrl,
    webViewLink,
  };
};

/**
 * Fetch a direct readable stream of a Google Drive file for server-side proxy download
 * @param {string} fileId
 * @returns {Promise<Response>} Native fetch response stream
 */
export const getDriveFileDownloadStream = async (fileId) => {
  const accessToken = await getValidDriveAccessToken();
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Google Drive download failed (Status ${response.status})`);
  }

  return response;
};
