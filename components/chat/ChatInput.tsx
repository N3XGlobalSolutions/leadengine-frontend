
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled,
  placeholder,
  primaryColor = '#4F46E5',
  secondaryColor = '#6366F1'
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when bot finishes replying (disabled becomes false)
  useEffect(() => {
    if (!disabled && inputRef.current) {
      // Small timeout to ensure DOM is fully ready and scrolling is done
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
    }
  };

  // Determine if we should use inline styles (for hex colors) or class names
  const isHexColor = (color: string) => /^#([0-9A-F]{3}){1,2}$/i.test(color);
  const useCustomColors = isHexColor(primaryColor);

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center w-full"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder || "Type your message here..."}
          disabled={disabled}
          className={`w-full bg-white/80 backdrop-blur-sm border ${
            useCustomColors ? 'focus:border-transparent' : 'focus:border-indigo-500'
          } text-slate-800 placeholder-slate-400 rounded-full py-4 pl-6 pr-14 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-2 focus:bg-white transition-all text-base disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
          style={useCustomColors ? { outlineColor: primaryColor } : undefined}
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className={`
            absolute right-2 p-2.5 rounded-full flex items-center justify-center transition-all duration-300
            ${!input.trim() || disabled
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : useCustomColors
                ? 'text-white shadow-md hover:shadow-lg hover:scale-105'
                : 'bg-slate-900 text-white hover:bg-black shadow-md hover:shadow-lg hover:scale-105'
            }
          `}
          style={
            input.trim() && !disabled && useCustomColors
              ? { backgroundColor: primaryColor }
              : undefined
          }
          onMouseEnter={(e) => {
            if (input.trim() && !disabled && useCustomColors) {
              e.currentTarget.style.backgroundColor = secondaryColor;
            }
          }}
          onMouseLeave={(e) => {
            if (input.trim() && !disabled && useCustomColors) {
              e.currentTarget.style.backgroundColor = primaryColor;
            }
          }}
        >
          <Send size={18} fill={input.trim() ? "currentColor" : "none"} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;

