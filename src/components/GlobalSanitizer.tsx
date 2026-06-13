'use client';

import { useEffect } from 'react';

// Replace any `blob:` URLs used as media sources with safe fallbacks.
export default function GlobalSanitizer() {
  useEffect(() => {
    const PLACEHOLDER_IMG = '/images/hero.png';
    const sanitizeElement = (el: Element) => {
      try {
        if (!el) return;
        if (el instanceof HTMLImageElement) {
          const src = el.getAttribute('src') || '';
          if (src.startsWith('blob:')) {
            el.setAttribute('src', PLACEHOLDER_IMG);
          }
        } else if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
          // handle <video> / <audio> and their <source> children
          const src = el.getAttribute('src') || '';
          if (src.startsWith('blob:')) {
            el.removeAttribute('src');
            // pause to avoid trying to fetch
            try { el.pause(); } catch {}
          }

          const sources = Array.from(el.querySelectorAll('source'));
          sources.forEach((s) => {
            const ssrc = s.getAttribute('src') || '';
            if (ssrc.startsWith('blob:')) {
              s.removeAttribute('src');
            }
          });
        }
      } catch (e) {
        // best-effort only
      }
    };

    // Sanitize existing elements
    document.querySelectorAll('img, video, audio').forEach(sanitizeElement);

    // Observe for dynamically added/changed nodes
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.target instanceof Element) {
          if ((m.attributeName === 'src' || m.attributeName === 'srcset')) {
            sanitizeElement(m.target as Element);
          }
        }

        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (node instanceof Element) {
              if (node.matches && node.matches('img,video,audio')) sanitizeElement(node);
              node.querySelectorAll && node.querySelectorAll('img,video,audio').forEach(sanitizeElement);
            }
          });
        }
      }
    });

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset'],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
