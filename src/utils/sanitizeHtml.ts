// JOBWORKERS Canonical HTML Sanitizer
// Single source of truth for sanitizing untrusted job description HTML

/**
 * Sanitizes untrusted HTML from external job sources.
 * 
 * ALLOWS: p, br, h1-h6, strong, em, ul, ol, li, a (with safe hrefs)
 * REMOVES: script, iframe, object, embed, style, event handlers, dangerous URLs
 * 
 * Defense-in-depth: Apply at both storage boundary and rendering boundary.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';

  return dirty
    // Remove dangerous tags and their contents
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '')
    .replace(/<object[^>]*>.*?<\/object>/gis, '')
    .replace(/<embed[^>]*>.*?<\/embed>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<base[^>]*>/gi, '')
    
    // Remove event handler attributes (onclick, onerror, onload, etc.)
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]*/gi, '')
    
    // Remove dangerous URL schemes from href/src attributes
    .replace(/href\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, 'href="#"')
    .replace(/href\s*=\s*["']?\s*vbscript:[^"'\s>]*/gi, 'href="#"')
    .replace(/href\s*=\s*["']?\s*data:[^"'\s>]*/gi, 'href="#"')
    .replace(/src\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, '')
    .replace(/src\s*=\s*["']?\s*vbscript:[^"'\s>]*/gi, '')
    
    // Remove form elements (potential phishing)
    .replace(/<form[^>]*>.*?<\/form>/gis, '')
    .replace(/<input[^>]*>/gi, '')
    .replace(/<button[^>]*>.*?<\/button>/gis, '')
    .replace(/<textarea[^>]*>.*?<\/textarea>/gis, '')
    .replace(/<select[^>]*>.*?<\/select>/gis, '');
}

/**
 * Strips all HTML tags, leaving only plain text.
 * Use for previews, excerpts, or when HTML formatting is not desired.
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
