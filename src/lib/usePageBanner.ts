import { useEffect, useState } from 'react';
import { fetchPageBanner, resolveImageUrl } from './api';
import type { PageBanner } from './content-types';

export function usePageBanner(pageKey: string): { banner: PageBanner | null; backgroundImage: string | undefined } {
  const [banner, setBanner] = useState<PageBanner | null>(null);

  useEffect(() => {
    let active = true;
    fetchPageBanner(pageKey).then((data) => {
      if (active) setBanner(data);
    });
    return () => { active = false; };
  }, [pageKey]);

  const backgroundImage = banner?.image ? resolveImageUrl(banner.image) : undefined;

  return { banner, backgroundImage };
}
