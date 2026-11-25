import React from 'react';
import { RobotMascot } from './Mascot';

export interface WelcomeScreenProps {
  /** Bot's display name, e.g. "A2D" → "Hi, I'm A2D" */
  botName: string;
  /** Muted text after the name in the speech bubble, e.g. "your Nuke Pc guide" */
  tagline?: string;
  /** Time-of-day greeting, e.g. "Good afternoon," */
  greeting: string;
  headline?: string;
}

/** Four-point twinkle star used around the mascot. */
const Sparkle: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className} style={style}>
    <path
      d="M12 0C12.6 6.5 17.5 11.4 24 12C17.5 12.6 12.6 17.5 12 24C11.4 17.5 6.5 12.6 0 12C6.5 11.4 11.4 6.5 12 0Z"
      style={{ fill: 'rgb(var(--brand-rgb, 109 91 240) / 0.5)' }}
    />
  </svg>
);

/**
 * Centre hero of the welcome view: speech bubble, robot mascot and greeting.
 * The page header and the message input are rendered by ChatPage around it.
 */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  botName,
  tagline,
  greeting,
  headline = 'How can I help you today?',
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full px-4 py-6 text-center">
      {/* Mascot + speech bubble */}
      <div className="flex flex-col items-center">
        {/* Bubble starts just left of the robot's centre line and grows to the right, wrapping if the name is long */}
        <div className="relative z-10 w-0 flex -mb-1.5 self-center">
          <p
            className="shrink-0 -ml-5 w-max max-w-[min(20rem,50vw)] bg-white rounded-2xl px-4 py-2.5 shadow-chat-card text-left text-[15px] leading-snug motion-safe:animate-fade-in-up"
          >
            <span className="font-medium text-chat-ink">Hi, I&apos;m {botName}</span>
            {tagline && <span className="text-chat-muted"> · {tagline}</span>}
          </p>
        </div>

        <div className="relative">
          {/* Soft brand glow behind the robot */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgb(var(--brand-rgb, 109 91 240) / 0.16) 0%, rgb(var(--brand-rgb, 109 91 240) / 0.06) 42%, transparent 70%)',
            }}
          />

          <Sparkle className="absolute -left-6 top-[6%] w-3.5 h-3.5 sm:w-4 sm:h-4 motion-safe:animate-twinkle" />
          <Sparkle
            className="absolute -right-7 top-[60%] w-3 h-3 sm:w-3.5 sm:h-3.5 motion-safe:animate-twinkle"
            style={{ animationDelay: '1.2s' }}
          />

          <RobotMascot size={172} className="relative sm:w-[208px] sm:h-[238px]" />
        </div>
      </div>

      {/* Greeting */}
      <div className="mt-8 sm:mt-10">
        <p className="text-[19px] sm:text-[22px] text-chat-muted leading-snug">{greeting}</p>
        <h1 className="mt-1 text-[26px] sm:text-[32px] font-semibold tracking-tight text-chat-ink leading-tight">
          {headline}
        </h1>
      </div>
    </div>
  );
};

export default WelcomeScreen;
