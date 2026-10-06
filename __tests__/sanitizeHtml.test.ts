// JOBWORKERS HTML Sanitization Tests
// Regression tests for XSS prevention and safe HTML rendering

import { sanitizeHtml, stripHtml } from '../src/utils/sanitizeHtml';

describe('sanitizeHtml', () => {
  describe('ALLOWS safe formatting tags', () => {
    test('preserves p tags', () => {
      const input = '<p>Hello world</p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<p>Hello world</p>');
    });

    test('preserves h3 tags', () => {
      const input = '<h3>Section Title</h3>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<h3>Section Title</h3>');
    });

    test('preserves ul/li tags', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
    });

    test('preserves strong and em tags', () => {
      const input = '<strong>bold</strong> and <em>italic</em>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });

    test('preserves safe links with http/https', () => {
      const input = '<a href="https://example.com">Click here</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<a href="https://example.com">Click here</a>');
    });
  });

  describe('REMOVES dangerous tags', () => {
    test('removes script tags', () => {
      const input = '<p>Normal</p><script>alert(1)</script><p>After</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    test('removes iframe tags', () => {
      const input = '<p>Text</p><iframe src="https://evil.com"></iframe>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<iframe');
    });

    test('removes object and embed tags', () => {
      const input = '<object data="evil.swf"></object><embed src="bad.swf">';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<object');
      expect(result).not.toContain('<embed');
    });

    test('removes style tags and content', () => {
      const input = '<style>body { display: none; }</style><p>Text</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<style');
      expect(result).not.toContain('display: none');
    });

    test('removes form tags', () => {
      const input = '<form><input name="evil"></form>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<form');
      expect(result).not.toContain('<input');
    });
  });

  describe('REMOVES event handler attributes', () => {
    test('removes onclick', () => {
      const input = '<p onclick="alert(1)">Click me</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
    });

    test('removes onerror', () => {
      const input = '<img src=x onerror="alert(1)">';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onerror');
    });

    test('removes onload', () => {
      const input = '<body onload="alert(1)"><p>Text</p></body>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onload');
    });

    test('removes all on* attributes', () => {
      const input = '<div onmouseover="alert(1)" onfocus="alert(2)">Danger</div>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onmouseover');
      expect(result).not.toContain('onfocus');
    });
  });

  describe('REMOVES dangerous URL schemes', () => {
    test('blocks javascript: URLs in href', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });

    test('blocks vbscript: URLs', () => {
      const input = '<a href="vbscript:alert(1)">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('vbscript:');
    });

    test('blocks data: URLs in src', () => {
      const input = '<img src="data:text/html,<script>alert(1)</script>">';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('data:');
    });
  });

  describe('Edge cases', () => {
    test('handles empty string', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    test('handles null-like values gracefully', () => {
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
    });

    test('preserves legitimate HTML structure', () => {
      const input = `
        <h3>Responsibilities</h3>
        <ul>
          <li>Build features</li>
          <li>Work with team</li>
        </ul>
        <p>Requirements:</p>
        <ul>
          <li>5+ years experience</li>
          <li><strong>Remote</strong> friendly</li>
        </ul>
      `;
      const result = sanitizeHtml(input);
      expect(result).toContain('<h3>Responsibilities</h3>');
      expect(result).toContain('<li>Build features</li>');
      expect(result).toContain('<strong>Remote</strong>');
    });

    test('handles mixed safe and unsafe content', () => {
      const input = `
        <p>This is safe</p>
        <script>alert('xss')</script>
        <p>This is also safe</p>
        <img src=x onerror="alert(2)">
      `;
      const result = sanitizeHtml(input);
      expect(result).toContain('This is safe');
      expect(result).toContain('This is also safe');
      expect(result).not.toContain('alert');
      expect(result).not.toContain('onerror');
    });
  });
});

describe('stripHtml', () => {
  test('removes all HTML tags', () => {
    const input = '<p>Hello <strong>world</strong></p>';
    const result = stripHtml(input);
    expect(result).toBe('Hello world');
  });

  test('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });

  test('collapses multiple spaces', () => {
    const input = '<p>Hello    world</p>';
    const result = stripHtml(input);
    expect(result).toBe('Hello world');
  });

  test('removes script tags completely', () => {
    const input = '<script>alert(1)</script><p>Safe</p>';
    const result = stripHtml(input);
    expect(result).toBe('Safe');
    expect(result).not.toContain('alert');
  });
});
