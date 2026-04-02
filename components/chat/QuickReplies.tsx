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

  const isHexColor = (color: string) => /^#([0-9A-F]{3}){1,2}$/i.test(color);
  const useCustomColors = isHexColor(primaryColor);

  const hexToRgb = (hex: string) => {
    if (!isHexColor(hex)) return '79, 70, 229'; // Default indigo-600 rgb
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const num = parseInt(h, 16);
    return `${num >> 16}, ${(num >> 8) & 255}, ${num & 255}`;
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-3 mb-1 px-1 -mx-1">
      <div className="flex gap-2.5 whitespace-nowrap px-1">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelect(option)}
            className={`
              px-5 py-2.5
              border
              rounded-full 
              text-[14px] font-semibold tracking-wide
              shadow-sm hover:shadow-[0_4px_14px_rgba(0,0,0,0.12)]
              transition-all duration-300 ease-out
              animate-fade-in-up
              ${useCustomColors
                ? 'backdrop-blur-sm'
                : 'bg-indigo-50/80 backdrop-blur-sm text-indigo-700 border-indigo-200/50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:scale-[1.03]'
              }
            `}
            style={{
              animationDelay: `${index * 50}ms`,
              ...(useCustomColors ? {
                color: primaryColor,
                backgroundColor: `rgba(${hexToRgb(primaryColor)}, 0.1)`,
                borderColor: `rgba(${hexToRgb(primaryColor)}, 0.2)`,
              } : {})
            }}
            onMouseEnter={(e) => {
              if (useCustomColors) {
                e.currentTarget.style.backgroundColor = primaryColor;
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.style.transform = 'scale(1.03)';
              }
            }}
            onMouseLeave={(e) => {
              if (useCustomColors) {
                e.currentTarget.style.backgroundColor = `rgba(${hexToRgb(primaryColor)}, 0.1)`;
                e.currentTarget.style.color = primaryColor;
                e.currentTarget.style.borderColor = `rgba(${hexToRgb(primaryColor)}, 0.2)`;
                e.currentTarget.style.transform = 'scale(1)';
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
