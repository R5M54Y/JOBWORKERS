// JOBWORKERS Branding Configuration
// All site name, tagline, and branding strings from environment variables

export interface BrandingConfig {
  siteName: string;
  tagline: string;
  copyright: string;
}

export function getBrandingConfig(env?: any): BrandingConfig {
  const siteName = env?.SITE_NAME || 'JOBWORKERS';
  const tagline = env?.SITE_TAGLINE || 'Remote job opportunities';
  const copyright = env?.SITE_COPYRIGHT || `© 2026 ${siteName}. Remote job opportunities aggregated from top sources.`;

  return {
    siteName,
    tagline,
    copyright,
  };
}
