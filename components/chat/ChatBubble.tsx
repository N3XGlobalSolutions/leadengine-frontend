import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { Check, Copy, Info, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Message, MessageRole } from '../../types';
import { RobotAvatar } from './Mascot';

export interface ChatBubbleProps {
  message: Message;
  /** Show this instead of message.text (used for the completion message). */
  textOverride?: string;
  /** When given, bot text bubbles get a Copy / thumbs up / thumbs down row. */
  onFeedback?: (type: 'up' | 'down') => void;
  /** Rendered under the bubble, left-aligned with the bubble (not the avatar): chips, form card, booking card. */
  children?: React.ReactNode;
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-le-accent';

/** Markdown -> plain-ish text for the clipboard. */
const toPlainText = (text: string): string =>
  text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/\*\*|__/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .trim();

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / insecure contexts
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
};

// Markdown inside the bot bubble: links use the client's link colour, everything else stays neutral.
const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  strong: ({ children }) => <strong className="font-medium text-le-ink">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`rounded text-le-link underline underline-offset-2 [overflow-wrap:anywhere] ${focusRing}`}
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded-md bg-le-disabled px-1.5 py-0.5 font-mono text-[0.85em] text-le-ink">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 max-w-full overflow-x-auto rounded-xl bg-le-ink p-3 text-[13px] text-white [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit">
      {children}
    </pre>
  ),
  h1: ({ children }) => <h1 className="mb-2 text-base font-medium text-le-ink">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 text-[15px] font-medium text-le-ink">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1 text-sm font-medium text-le-ink">{children}</h3>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-[3px] border-le-field pl-3 text-le-muted">{children}</blockquote>
  ),
  hr: () => <hr className="my-3 border-le-field" />,
  img: ({ src, alt }) => <img src={src} alt={alt || ''} className="my-2 max-w-full rounded-xl" loading="lazy" />,
  // Wide tables scroll inside the bubble instead of stretching the page
  table: ({ children }) => (
    <div className="my-2 max-w-full overflow-x-auto rounded-xl border border-le-field">
      <table className="min-w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-le-disabled">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-le-field last:border-b-0">{children}</tr>,
  th: ({ children }) => (
    <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-le-ink">{children}</th>
  ),
  td: ({ children }) => <td className="whitespace-nowrap px-3 py-2 text-le-ink">{children}</td>,
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, textOverride, onFeedback, children }) => {
  const isBot = message.role === MessageRole.Bot;
  const text = textOverride ?? message.text ?? '';
  const hasText = text.trim().length > 0;

  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    []
  );

  const handleCopy = async () => {
    const ok = await copyToClipboard(toPlainText(text));
    if (!ok) return;
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 1600);
  };

  if (!isBot) {
    return (
      <div className="flex w-full flex-col items-end gap-2.5 motion-safe:animate-fade-in-up">
        {hasText && (
          <div className="max-w-[250px] whitespace-pre-wrap break-words rounded-[18px_6px_18px_18px] bg-le-bubble px-[14px] py-[11px] text-sm leading-normal text-le-on-bubble [overflow-wrap:anywhere]">
            {text}
          </div>
        )}
        {children && <div className="w-full min-w-0">{children}</div>}
      </div>
    );
  }

  const actionButton = `inline-flex h-[30px] w-[30px] items-center justify-center rounded-full transition-colors hover:bg-white/70 ${focusRing}`;
  const actionTone = (active: boolean) => (active ? 'text-le-selected-text' : 'hover:text-le-icon');

  return (
    <div className="flex w-full items-start gap-2.5 motion-safe:animate-fade-in-up">
      <RobotAvatar size={32} className="flex-shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col items-start">
        {hasText && (
          <div
            className={`min-w-0 max-w-[268px] break-words rounded-[6px_18px_18px_18px] border px-[14px] py-[11px] text-sm leading-normal text-le-ink [overflow-wrap:anywhere] ${
              message.isSoftDQ ? 'border-amber-200 bg-amber-50' : 'border-le-bot-border bg-white/[.92]'
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}
            >
              {text}
            </ReactMarkdown>
          </div>
        )}

        {message.isSoftDQ && (
          <p className="mt-1.5 flex items-start gap-1.5 px-1 text-xs text-amber-800">
            <Info size={14} strokeWidth={1.7} className="mt-px flex-shrink-0" aria-hidden="true" />
            <span>We'll follow up when the timing is right.</span>
          </p>
        )}

        {hasText && onFeedback && (
          <div className="-ml-1.5 mt-1 flex items-center gap-0.5 text-le-faint">
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? 'Copied' : 'Copy message'}
              title="Copy"
              className={`${actionButton} ${actionTone(copied)}`}
            >
              {copied ? (
                <Check size={14} strokeWidth={1.7} aria-hidden="true" />
              ) : (
                <Copy size={14} strokeWidth={1.7} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onFeedback('up')}
              aria-label="Helpful"
              aria-pressed={message.feedback === 'up'}
              title="Helpful"
              className={`${actionButton} ${actionTone(message.feedback === 'up')}`}
            >
              <ThumbsUp
                size={14}
                strokeWidth={1.7}
                className={message.feedback === 'up' ? 'fill-current' : ''}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={() => onFeedback('down')}
              aria-label="Not helpful"
              aria-pressed={message.feedback === 'down'}
              title="Not helpful"
              className={`${actionButton} ${actionTone(message.feedback === 'down')}`}
            >
              <ThumbsDown
                size={14}
                strokeWidth={1.7}
                className={message.feedback === 'down' ? 'fill-current' : ''}
                aria-hidden="true"
              />
            </button>
            {copied && <span className="ml-1 text-xs text-le-selected-text">Copied</span>}
            <span role="status" className="sr-only">
              {copied ? 'Message copied to clipboard' : ''}
            </span>
          </div>
        )}

        {children && <div className={`w-full min-w-0 ${hasText ? 'mt-2.5' : ''}`}>{children}</div>}
      </div>
    </div>
  );
};

export default ChatBubble;
