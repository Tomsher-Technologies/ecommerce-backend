
export const getValidSubdomain = (host?: string | null) => {
  let subdomain: string | null = null;
  if (!host && typeof window !== 'undefined') {
    // On client side, get the host from window
    host = window.location.host;
  }
  if (host && host.includes('.')) {
    const candidate = host.split('.')[0];
    if (candidate && !candidate.includes('localhost')) {
      // Valid candidate
      subdomain = candidate;
    }
  }
  return subdomain;
};


export function getLanguageValueFromSubdomain(host: string | null | undefined): string | null | undefined {
  if (!host) {
    return null;
  }

  const parts = host.split('.');
  for (const part of parts) {
    if (part === 'ar' || part.endsWith('-ar')) {
      return 'ar';
    }
  }
  return 'en';
}

export function getLanguageDirectionFromSubdomain(host: string | null): string {
  const language = getLanguageValueFromSubdomain(host);
  return language === 'ar' ? 'rtl' : 'ltr';
}

export function getLanguageDirectionChangeFromSubdomain(host: any): string {
  const language = getLanguageValueFromSubdomain(host);
  return language === 'ar' ? 'left' : 'right';
}


export function getCountryShortTitleFromHostname(hostname: string | null | undefined) {
  if (hostname) {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const partsHyphen = parts[0]?.split('-');
      if (partsHyphen.length >= 2) {
        return partsHyphen[1];
      } else {
        return parts[0];
      }
    }
  }
  return null; 
}