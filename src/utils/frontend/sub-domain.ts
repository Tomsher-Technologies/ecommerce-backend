
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


const supportedLanguageCodes = ['ar', 'en', 'sp', 'hn'];

export function getLanguageValueFromSubdomain(host: string | null | undefined, languageData: any[]): any {
  if (!host) {
    return null;
  }

  const parts = host.split('.');
  for (const part of parts) {
    for (const language of languageData) {
      if (part === language.languageCode || part.endsWith(`-${language.languageCode}`)) {
        return language._id;
      }
    }
  }
  return false; // Default to 'en' if no supported language code is found
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