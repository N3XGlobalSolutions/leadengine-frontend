import React from 'react';

interface QuickRepliesProps {
  options: string[];
  onSelect: (option: string) => void;
  primaryColor?: string;
  secondaryColor?: string;
}

const QuickReplies: React.FC<QuickRepliesProps> = ({
  options,
  onSelect,
  primaryColor = '#4F46E5',
  secondaryColor = '#6366F1'
}) => {
  if (!options || options.length === 0) return null;

  // Determine if we should use inline styles (for hex colors) or class names
  const isHexColor = (color: string) => /^#([0-9A-F]{3}){1,2}$/i.test(color);
  const useCustomColors = isHexColor(primaryColor);

  // Helper function to create a lighter version of a color
  const lightenColor = (hex: string, percent: number = 90): string => {
    if (!isHexColor(hex)) return hex;
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 mb-2 px-1">
      <div className="flex gap-2 whitespace-nowrap">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelect(option)}
            className={`
              px-4 py-2 
              bg-white
              border-2
              rounded-full 
              text-sm font-medium 
              shadow-sm hover:shadow-md
              transition-all duration-200 
              animate-fade-in-up
              ${useCustomColors
                ? ''
                : 'text-indigo-600 border-indigo-300 hover:bg-indigo-50 hover:border-indigo-400'
              }
            `}
            style={{
              animationDelay: `${index * 50}ms`,
              ...(useCustomColors ? {
                color: primaryColor,
                borderColor: lightenColor(primaryColor, 60), // More visible: 40% instead of 70%
              } : {})
            }}
            onMouseEnter={(e) => {
              if (useCustomColors) {
                e.currentTarget.style.backgroundColor = lightenColor(primaryColor, 95);
                e.currentTarget.style.borderColor = lightenColor(primaryColor, 50);
              }
            }}
            onMouseLeave={(e) => {
              if (useCustomColors) {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = lightenColor(primaryColor, 40); // Match default state
              }
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickReplies;
