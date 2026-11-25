import React from 'react';
import { RobotAvatar } from './Mascot';

export interface TypingIndicatorProps {
  botName?: string;
}

const DOT_DELAYS = ['0ms', '150ms', '300ms'];

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ botName }) => (
  <div className="flex w-full items-start gap-2.5 motion-safe:animate-fade-in">
    <RobotAvatar size={32} className="flex-shrink-0" />
    {/* Same shape as a bot bubble; the dots row is one 14px/1.5 line tall */}
    <div
      className="flex h-[21px] box-content items-center gap-1.5 rounded-[6px_18px_18px_18px] border border-le-bot-border bg-white/[.92] px-[14px] py-[11px]"
      aria-hidden="true"
    >
      {DOT_DELAYS.map((delay) => (
        <span
          key={delay}
          className="h-[7px] w-[7px] rounded-full bg-le-accent opacity-80 motion-safe:animate-bounce"
          style={{ animationDelay: delay }}
        />
      ))}
    </div>
    <span role="status" aria-live="polite" className="sr-only">
      {botName || 'Assistant'} is typing…
    </span>
  </div>
);

export default TypingIndicator;
