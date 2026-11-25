import React from 'react';
import { Check } from 'lucide-react';

export interface QuickRepliesProps {
  options: string[];
  /** The option the visitor already picked: shown checked, and all chips become non-interactive. */
  selected?: string;
  disabled?: boolean;
  onSelect: (option: string) => void;
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-le-accent';

const QuickReplies: React.FC<QuickRepliesProps> = ({ options, selected, disabled, onSelect }) => {
  if (!options || options.length === 0) return null;

  const locked = !!selected || !!disabled;

  return (
    <div role="group" aria-label="Suggested replies" className="flex flex-wrap gap-2">
      {options.map((option, index) => {
        const isSelected = option === selected;
        return (
          <button
            key={`${option}-${index}`}
            type="button"
            onClick={() => {
              if (!locked) onSelect(option);
            }}
            disabled={locked}
            aria-pressed={isSelected}
            // 36px tall (design); long options wrap and grow instead of being cut off
            className={`inline-flex min-h-[36px] max-w-full items-center gap-1.5 rounded-full border px-[14px] py-1.5 text-left text-[13px] leading-tight transition-colors motion-safe:animate-fade-in-up disabled:cursor-default ${focusRing} ${
              isSelected
                ? 'border-le-selected-border bg-le-selected-bg font-medium text-le-selected-text'
                : `border-le-border bg-white/[.85] text-le-link enabled:hover:border-le-selected-border enabled:hover:bg-le-selected-bg ${
                    disabled && !selected ? 'opacity-60' : ''
                  }`
            }`}
            style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
          >
            {isSelected && <Check size={13} strokeWidth={2.2} className="flex-shrink-0" aria-hidden="true" />}
            <span className="break-words">{option}</span>
          </button>
        );
      })}
    </div>
  );
};

export default QuickReplies;
