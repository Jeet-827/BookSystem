import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, buildTitle } from '../utils/seo';

const SEOHead = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
  structuredData = null,
}) => {
  const fullTitle = buildTitle(title);
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL;

  return (
    <Helmet>
      {/* 1. Title */}
      <title>{fullTitle}</title>

      {/* 2. Robots & Description */}
      <meta name="description" content={description} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* 3. Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      {/* 4. Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_IN" />

      {/* 5. Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@redkitindia" />

      {/* 6. Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
