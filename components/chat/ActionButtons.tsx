
import React from 'react';

interface ActionButtonsProps {
  onSchedule: () => void;
  onLater: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onSchedule, onLater }) => {
  return (
    <div className="flex gap-3 justify-end mb-4 animate-fade-in-up w-full max-w-[85%] md:max-w-xl ml-auto">
      <button
        onClick={onSchedule}
        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
      >
        Yes, schedule a call
      </button>
      <button
        onClick={onLater}
        className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-sm"
      >
        Maybe later
      </button>
    </div>
  );
};

export default ActionButtons;
