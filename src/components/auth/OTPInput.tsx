import React, { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  hasError?: boolean;
  disabled?: boolean;
  length?: number;
  autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChange,
  onComplete,
  hasError = false,
  disabled = false,
  length = 6,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const updateDigit = (index: number, newDigit: string) => {
    const chars = value.split('');
    chars[index] = newDigit;
    const updated = chars.slice(0, length).join('');
    onChange(updated);

    if (updated.length === length && onComplete) {
      onComplete(updated);
    }
  };

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const char = rawVal.slice(-1);

    if (!/^\d*$/.test(char)) return;

    updateDigit(index, char);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
        updateDigit(index - 1, '');
      } else {
        updateDigit(index, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digitsOnly = pastedData.replace(/\D/g, '').slice(0, length);
    if (!digitsOnly) return;

    onChange(digitsOnly);

    const focusIndex = Math.min(digitsOnly.length, length - 1);
    inputRefs.current[focusIndex]?.focus();

    if (digitsOnly.length === length && onComplete) {
      onComplete(digitsOnly);
    }
  };

  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 my-3" role="group" aria-label="Verification code input">
      {Array.from({ length }).map((_, index) => {
        const isFilled = Boolean(digits[index]);

        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            value={digits[index]}
            disabled={disabled}
            onChange={(e) => handleInputChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            aria-label={`Digit ${index + 1} of ${length}`}
            className={`
              w-10 h-12 sm:w-12 sm:h-14 
              text-center font-mono text-lg sm:text-xl font-bold 
              rounded-lg outline-none transition-all
              ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-white cursor-text text-slate-900'}
              ${
                hasError
                  ? 'border-2 border-rose-500 text-rose-600 shadow-xs ring-1 ring-rose-200'
                  : isFilled
                  ? 'border-2 border-slate-900 shadow-xs'
                  : 'border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
              }
            `}
          />
        );
      })}
    </div>
  );
};
