'use client';
import { useEffect } from 'react';

// Hosting can inject branding after hydration. Keep it outside the game controls.
export default function PlatformBadgeGuard() {
  useEffect(() => {
    const selector =
      'netlify-badge, #netlify-badge, .netlify-badge, [data-netlify-badge], a, iframe';
    const inspect = (root: Element | ShadowRoot) => {
      const elements = [
        ...(root instanceof Element && root.matches(selector) ? [root] : []),
        ...root.querySelectorAll(selector),
      ];
      for (const el of elements) {
        const named = el.matches(
          'netlify-badge, #netlify-badge, .netlify-badge, [data-netlify-badge]'
        );
        const text = (
          el.textContent ||
          el.getAttribute('aria-label') ||
          el.getAttribute('title') ||
          ''
        )
          .replace(/\s+/g, ' ')
          .trim();
        const src = el.getAttribute('src') || '';
        if (
          named ||
          /^powered\s*by\s*netlify$/i.test(text) ||
          /netlify.*badge|badge.*netlify/i.test(src)
        ) {
          let target = el;
          for (
            let parent = el.parentElement;
            parent && parent !== document.body;
            parent = parent.parentElement
          ) {
            if (!/^powered\s*by\s*netlify$/i.test((parent.textContent || '').trim())) break;
            const bounds = parent.getBoundingClientRect();
            if (bounds.width <= 480 && bounds.height <= 140) target = parent;
          }
          const tree = el.getRootNode();
          if (tree instanceof ShadowRoot) {
            const bounds = tree.host.getBoundingClientRect();
            if (bounds.width <= 480 && bounds.height <= 140) target = tree.host;
          }
          (target as HTMLElement).style.setProperty('display', 'none', 'important');
        }
      }
      if (root instanceof Element && root.shadowRoot) inspect(root.shadowRoot);
      for (const child of root.querySelectorAll('*'))
        if (child.shadowRoot) inspect(child.shadowRoot);
    };
    inspect(document.body);
    const observer = new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes) if (node instanceof Element) inspect(node);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
