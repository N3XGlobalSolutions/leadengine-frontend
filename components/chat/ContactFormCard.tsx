import React, { useId, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { PHONE_COUNTRY_CODE, isValidPhoneIN } from '../../utils/phone';

export interface ContactFormCardProps {
  defaultName?: string;
  defaultPhone?: string;
  disabled?: boolean;
  /** name is trimmed; phone is 10 digits with no country code */
  onSubmit: (name: string, phone: string) => void;
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-le-accent';

/** Keep only the 10-digit national number, accepting pasted "+91 98765 43210" or "098765 43210". */
const toPhoneDigits = (value: string): string => {
  let digits = (value || '').replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
};

/** "9876543210" -> "98765 43210" */
const formatPhoneDisplay = (digits: string): string =>
  digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;

const ContactFormCard: React.FC<ContactFormCardProps> = ({ defaultName, defaultPhone, disabled, onSubmit }) => {
  const id = useId();
  const nameId = `${id}-name`;
  const phoneId = `${id}-phone`;
  const nameErrorId = `${id}-name-error`;
  const phoneErrorId = `${id}-phone-error`;

  const [name, setName] = useState(defaultName || '');
  const [phoneDigits, setPhoneDigits] = useState(() => toPhoneDigits(defaultPhone || ''));
  const [touched, setTouched] = useState({ name: false, phone: false });
  const [attempted, setAttempted] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const nameValid = name.trim().length >= 2;
  const phoneValid = isValidPhoneIN(phoneDigits);
  const isValid = nameValid && phoneValid;

  const showNameError = !nameValid && (touched.name || attempted);
  const showPhoneError = !phoneValid && (touched.phone || attempted);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (!isValid) {
      setAttempted(true);
      if (!nameValid) nameRef.current?.focus();
      else phoneRef.current?.focus();
      return;
    }
    onSubmit(name.trim().replace(/\s+/g, ' '), phoneDigits);
  };

  // Design: 44px tall, radius 12, 1px fixed field border, white, 14px text
  const inputBase =
    'h-11 w-full min-w-0 rounded-xl border bg-white px-[14px] text-sm text-le-ink placeholder:text-le-faint transition-colors focus:outline-none focus:ring-[3px] disabled:cursor-not-allowed disabled:bg-le-disabled';
  const inputState = (hasError: boolean) =>
    hasError
      ? 'border-le-danger focus:border-le-danger focus:ring-le-danger/15'
      : 'border-le-field focus:border-le-accent focus:ring-le-selected-bg';

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Your contact details"
      className="w-full rounded-[18px] border border-white/95 bg-white/80 p-[14px] shadow-le-card motion-safe:animate-fade-in-up"
    >
      <label htmlFor={nameId} className="mb-1.5 block text-xs text-le-muted">
        Your name
      </label>
      <input
        ref={nameRef}
        id={nameId}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, name: true }))}
        disabled={disabled}
        autoComplete="name"
        autoCapitalize="words"
        enterKeyHint="next"
        maxLength={80}
        placeholder="Full name"
        aria-invalid={showNameError}
        aria-describedby={showNameError ? nameErrorId : undefined}
        className={`${inputBase} ${inputState(showNameError)}`}
      />
      {showNameError && (
        <p id={nameErrorId} className="mt-1.5 text-xs text-le-danger">
          Please enter your name
        </p>
      )}

      <label htmlFor={phoneId} className="mb-1.5 mt-2.5 block text-xs text-le-muted">
        WhatsApp number
      </label>
      <div className="flex gap-2">
        <div
          className="flex h-11 flex-shrink-0 items-center rounded-xl border border-le-field bg-white px-3 text-sm text-le-ink"
          aria-hidden="true"
        >
          {PHONE_COUNTRY_CODE}
        </div>
        <input
          ref={phoneRef}
          id={phoneId}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          enterKeyHint="done"
          value={formatPhoneDisplay(phoneDigits)}
          onChange={(e) => setPhoneDigits(toPhoneDigits(e.target.value))}
          onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
          disabled={disabled}
          placeholder="98765 43210"
          aria-label={`WhatsApp number, ${PHONE_COUNTRY_CODE}`}
          aria-invalid={showPhoneError}
          aria-describedby={showPhoneError ? phoneErrorId : undefined}
          className={`${inputBase} ${inputState(showPhoneError)}`}
        />
      </div>
      {showPhoneError && (
        <p id={phoneErrorId} className="mt-1.5 text-xs text-le-danger">
          Enter a 10-digit mobile number
        </p>
      )}

      <button
        type="submit"
        disabled={disabled}
        aria-disabled={disabled || !isValid}
        className={`mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-le-btn text-sm font-medium text-le-on-btn transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:opacity-60 aria-disabled:hover:brightness-100 aria-disabled:active:scale-100 ${focusRing}`}
      >
        Continue
      </button>

      <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-le-muted">
        <Lock size={12} strokeWidth={1.8} className="flex-shrink-0" aria-hidden="true" />
        <span>Only used to follow up on your enquiry. No spam.</span>
      </p>
    </form>
  );
};

export default ContactFormCard;
