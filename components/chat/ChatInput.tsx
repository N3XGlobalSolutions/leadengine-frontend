
import React, { useState } from 'react';
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
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder || "Type your message here..."}
          disabled={disabled}
          className="w-full bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl py-4 pl-6 pr-14 shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple focus:bg-white transition-all text-base disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className={`
            absolute right-3 p-2.5 rounded-lg flex items-center justify-center transition-all duration-200
            ${!input.trim() || disabled
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : useCustomColors
                ? 'text-white shadow-md hover:shadow-lg'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
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

