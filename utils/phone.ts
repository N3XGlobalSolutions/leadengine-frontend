/**
 * Phone helpers for the visitor chat. The backend's contact extraction only accepts Indian
 * mobile numbers (10 digits starting 6-9, optionally prefixed with 91), so the form
 * validates the same rule before sending.
 */

export const PHONE_COUNTRY_CODE = '+91';

/** Digits only, with a leading 91 country code dropped when the rest is a full mobile number. */
export const normalizePhoneIN = (value: string): string => {
    const digits = (value || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    return digits;
};

/** True for a 10-digit Indian mobile number (starts with 6, 7, 8 or 9). */
export const isValidPhoneIN = (value: string): boolean => /^[6-9]\d{9}$/.test(normalizePhoneIN(value));

/** "9876543210" -> "+91 98765 43210". Anything that isn't a 10-digit number is returned unchanged. */
export const formatPhoneIN = (value: string): string => {
    const digits = normalizePhoneIN(value);
    if (digits.length !== 10) return value;
    return `${PHONE_COUNTRY_CODE} ${digits.slice(0, 5)} ${digits.slice(5)}`;
};
