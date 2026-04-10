import { useEffect } from "react";

export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;

    if (description) {
      const setMeta = (selector: string, content: string) => {
        const el = document.querySelector<HTMLMetaElement>(selector);
        if (el) el.content = content;
      };
      setMeta('meta[property="og:title"]', title);
      setMeta('meta[name="twitter:title"]', title);
      setMeta('meta[property="og:description"]', description);
      setMeta('meta[name="twitter:description"]', description);
    }

    return () => {
      document.title = prev;
    };
  }, [title, description]);
}
