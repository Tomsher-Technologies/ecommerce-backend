"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCountrySubDomainFromHostname = exports.getLanguageValueFromSubdomain = exports.getValidSubdomain = void 0;
const removeProtocol = (url) => {
    return url.replace(/(^\w+:|^)\/\//, '');
};
const getValidSubdomain = (host) => {
    let subdomain = null;
    if (!host && typeof window !== 'undefined') {
        host = window.location.host;
    }
    if (host) {
        host = removeProtocol(host);
        if (host.includes('.')) {
            const candidate = host.split('.')[0];
            if (candidate && !candidate.includes('localhost')) {
                subdomain = candidate;
            }
        }
    }
    return subdomain;
};
exports.getValidSubdomain = getValidSubdomain;
function getLanguageValueFromSubdomain(host, languageData) {
    if (!host) {
        return null;
    }
    host = removeProtocol(host);
    let languageCode = '';
    const parts = host.split('.');
    if (parts.length >= 2) {
        const partsHyphen = parts[0]?.split('-');
        if (partsHyphen.length >= 2) {
            languageCode = partsHyphen[0];
        }
        else {
            languageCode = parts[0];
        }
    }
    if (languageCode) {
        for (const language of languageData) {
            if (languageCode.toLowerCase() === language.languageCode.toLowerCase() ||
                languageCode.toLowerCase().endsWith(`-${language.languageCode.toLowerCase()}`)) {
                return language._id;
            }
        }
    }
    return false; // Default to false if no supported language code is found
}
exports.getLanguageValueFromSubdomain = getLanguageValueFromSubdomain;
function getCountrySubDomainFromHostname(hostname) {
    if (hostname) {
        // Remove protocol if present
        hostname = removeProtocol(hostname);
        const parts = hostname.split('.');
        if (parts.length >= 2) {
            const partsHyphen = parts[0]?.split('-');
            if (partsHyphen.length >= 2) {
                return partsHyphen[1];
            }
            else {
                return parts[0];
            }
        }
    }
    return null;
}
exports.getCountrySubDomainFromHostname = getCountrySubDomainFromHostname;
