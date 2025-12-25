import React from 'react';

interface QuickRepliesProps {
  options: string[];
  onSelect: (option: string) => void;
}

const QuickReplies: React.FC<QuickRepliesProps> = ({ options, onSelect }) => {
  if (!options || options.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 mb-2 px-1">
      <div className="flex gap-2 whitespace-nowrap">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelect(option)}
            className="
              px-4 py-2 
              bg-white text-indigo-600 
              border border-indigo-100 
              rounded-full 
              text-sm font-medium 
              shadow-sm hover:shadow-md hover:bg-indigo-50 hover:border-indigo-200 
              transition-all duration-200 
              animate-fade-in-up
            "
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickReplies;
