// SEO utility helpers for redkitindia.com
export const SITE_NAME = 'redkitindia';
export const SITE_URL = 'https://www.redkitindia.com';
export const DEFAULT_DESCRIPTION = 'redkitindia — India\'s premier online digital bookstore. Instant PDF & EPUB eBook downloads upon checkout, DRM-free offline reading, and 24-hour refund guarantee.';
export const DEFAULT_OG_IMAGE = 'https://www.redkitindia.com/og-image.jpg';

export function buildTitle(pageTitle) {
  return pageTitle ? `${pageTitle} | redkitindia` : 'redkitindia | Instant Digital eBook Platform – Online Downloads';
}

export function buildCanonical(path) {
  return `${SITE_URL}${path}`;
}
