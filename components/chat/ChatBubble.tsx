
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { Message, MessageRole } from '../../types';
import { MapPin, DollarSign, Home, Calendar, CreditCard, User, Phone, ThumbsUp, ThumbsDown, Check, Info } from 'lucide-react';


interface ChatBubbleProps {
  message: Message;
  allowFeedback?: boolean;
  onFeedback?: (feedbackType: 'up' | 'down') => void;
  botAvatar?: string;
  botName?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, allowFeedback, onFeedback, botAvatar, botName }) => {
  const isBot = message.role === MessageRole.Bot;

  return (
    <div className={`flex w-full mb-4 animate-fade-in-up ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex gap-3 max-w-[95%] md:max-w-2xl ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>

        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm mt-0 overflow-hidden 
          ${isBot ? 'bg-white border border-gray-100' : 'bg-gray-900 border border-gray-700'}`}>
          {isBot ? (
            <img src={botAvatar || "https://cdn-icons-png.flaticon.com/512/4712/4712109.png"} alt={botName || "Bot"} className="w-5 h-5 object-contain" />
          ) : (
            <User size={16} className="text-white" />
          )}
        </div>

        <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>

          {/* Sender Name */}
          <span className="text-[10px] text-gray-400 mb-1 px-1">
            {isBot ? (botName || 'AI Assistant') : 'Me'}
          </span>

          {/* Message Content */}
          {isBot && message.showActions ? (
            // ⭐ Special rendering for summary message (when action buttons will show)
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 px-5 py-4 rounded-2xl rounded-bl-none shadow-md max-w-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📋</span>
                <h4 className="font-semibold text-blue-900">Your Information Summary</h4>
              </div>
              <div className="prose prose-sm max-w-none text-gray-800">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-700">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-blue-900">{children}</strong>,
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-3 rounded-lg border border-blue-100">
                        <table className="min-w-full text-sm border-collapse">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-blue-50">{children}</thead>,
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => <tr className="even:bg-gray-50">{children}</tr>,
                    th: ({ children }) => (
                      <th className="px-3 py-2 text-left font-semibold text-blue-800 border border-blue-100 whitespace-nowrap">{children}</th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-2 text-gray-700 border border-gray-100 whitespace-nowrap">{children}</td>
                    ),
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            // Regular message rendering
            <div
              className={`
                px-4 py-3 sm:px-5 sm:py-3.5 text-[15px] leading-relaxed break-words relative w-fit
                ${isBot
                  ? message.isSoftDQ
                    ? 'bg-amber-50/90 backdrop-blur-md text-gray-800 rounded-3xl rounded-bl-md border border-amber-200/50 shadow-sm'
                    : 'bg-white text-gray-800 rounded-3xl rounded-bl-md shadow-[0_2px_10px_-2px_rgba(0,0,0,0.04)] border border-gray-100'
                  : 'bg-slate-800 text-white rounded-3xl rounded-br-md shadow-[0_4px_14px_rgba(0,0,0,0.08)]'
                }
              `}
            >
              {isBot ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-700">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children }) => (
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600">{children}</code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto my-2 text-sm">{children}</pre>
                    ),
                    a: ({ href, children }) => (
                      <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
                    ),
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-bold mb-1">{children}</h3>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-600 my-2">{children}</blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-3 rounded-lg border border-blue-100 shadow-sm">
                        <table className="min-w-full text-sm border-collapse">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-blue-50">{children}</thead>,
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => <tr className="even:bg-slate-50">{children}</tr>,
                    th: ({ children }) => (
                      <th className="px-3 py-2 text-left font-semibold text-blue-800 border border-blue-100 whitespace-nowrap text-xs">{children}</th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-2 text-gray-700 border border-gray-100 whitespace-nowrap text-xs">{children}</td>
                    ),
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              ) : (
                <span className="whitespace-pre-wrap">{message.text}</span>
              )}
            </div>
          )}

          {/* Soft-DQ Info Banner */}
          {isBot && message.isSoftDQ && (
            <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 max-w-md">
              <Info size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-amber-700">Based on your needs, we'll follow up when the timing is right.</span>
            </div>
          )}

          {/* Summary Card */}
          {message.isSummary && message.summaryData && (
            <div className="mt-3 w-full bg-white rounded-xl p-5 shadow-lg border border-gray-100 animate-fade-in-up">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2 flex items-center justify-between">
                <span>Lead Qualification Summary</span>
                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">Completed</span>
              </h3>

              {(() => {
                const sd = message.summaryData || {};

                // Helper to find key case-insensitively
                const findKey = (search: string) => Object.keys(sd).find(k => k.toLowerCase() === search);

                const nameKey = findKey('name');
                const phoneKey = findKey('phone');

                const getValue = (val: any): string => {
                  if (val === null || val === undefined) return '';
                  if (typeof val === 'string') return val;
                  if (typeof val === 'object' && val.answer) return val.answer;
                  return String(val);
                };

                const nameValue = nameKey ? getValue(sd[nameKey]) : null;
                const phoneValue = phoneKey ? getValue(sd[phoneKey]) : null;

                // Detect S3 Mapping format: has `answers` array and `lead_priority`
                const isS3Mapping = Array.isArray(sd.answers) && sd.lead_priority !== undefined;

                // S3 Mapping: internal structural keys to skip in generic grid
                const S3_INTERNAL_KEYS = new Set([
                  'name', 'phone', 'answers', 'signal_breakdown', 'avg_signal_score',
                  'total_questions', 'disqualified', 'sessionId', 's3_max_lead_output',
                  's3_lead_output', 's2_lead_output',
                ]);

                // Generic remaining data (for non-mapping leads)
                const remainingData = Object.entries(sd).filter(([key]) => {
                  const lower = key.toLowerCase();
                  if (isS3Mapping) return !S3_INTERNAL_KEYS.has(key) && lower !== 'name' && lower !== 'phone';
                  return lower !== 'name' && lower !== 'phone' && key !== 'sessionId' && !key.startsWith('q0')
                    && key !== 's3_max_lead_output' && key !== 's3_lead_output' && key !== 's2_lead_output';
                });

                return (
                  <div>
                    {/* Spotlight: Name + Phone */}
                    {(nameValue || phoneValue) && (
                      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-dashed border-gray-200">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <User size={24} />
                        </div>
                        <div>
                          {nameValue && <h4 className="text-lg font-bold text-gray-900">{nameValue}</h4>}
                          {phoneValue && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                              <Phone size={12} />
                              <span>{phoneValue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* S3 Mapping: clean Q&A rows, no internal scoring data shown to customer */}
                    {isS3Mapping && Array.isArray(sd.answers) && sd.answers.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 text-sm text-gray-700">
                        {sd.answers.map((ans: any, i: number) => {
                          if (!ans || typeof ans !== 'object') return null;
                          const question = typeof ans.question === 'string' ? ans.question : `Question ${i + 1}`;
                          const answer = typeof ans.answer === 'string' ? ans.answer : String(ans.answer || '—');
                          return (
                            <div key={i} className="flex items-start gap-2.5">
                              <div className="mt-0.5 p-1 rounded bg-gray-100 text-gray-600">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                              <div className="overflow-hidden">
                                <span className="block text-xs text-gray-500 font-medium lowercase first-letter:uppercase">{question}</span>
                                <span className="font-semibold truncate block" title={answer}>{answer}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Generic (non-S3-mapping) remaining grid */}
                    {!isS3Mapping && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 text-sm text-gray-700">
                        {remainingData.map(([key, value]) => {
                          let label: string;
                          let displayValue: string;

                          const valueObj = value as { label?: string; answer?: string } | null;

                          if (typeof value === 'object' && value !== null && valueObj?.label && valueObj?.answer !== undefined) {
                            label = valueObj.label;
                            displayValue = valueObj.answer || 'Not provided';
                          } else {
                            label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            displayValue = typeof value === 'string' ? value : String(value || 'Not provided');
                          }

                          let icon = <Check className="w-3.5 h-3.5" />;
                          let bgClass = "bg-gray-100 text-gray-600";

                          const lowerKey = key.toLowerCase();
                          const lowerLabel = label.toLowerCase();
                          if (lowerKey.includes('location') || lowerLabel.includes('location') || lowerLabel.includes('address') || lowerLabel.includes('area')) {
                            icon = <MapPin className="w-3.5 h-3.5" />;
                            bgClass = "bg-red-50 text-red-500";
                          } else if (lowerKey.includes('budget') || lowerLabel.includes('budget') || lowerLabel.includes('price')) {
                            icon = <DollarSign className="w-3.5 h-3.5" />;
                            bgClass = "bg-green-50 text-green-600";
                          } else if (lowerKey.includes('type') || lowerLabel.includes('type') || lowerLabel.includes('bhk') || lowerLabel.includes('property')) {
                            icon = <Home className="w-3.5 h-3.5" />;
                            bgClass = "bg-blue-50 text-blue-500";
                          } else if (lowerKey.includes('move') || lowerLabel.includes('move') || lowerLabel.includes('timeline') || lowerLabel.includes('date')) {
                            icon = <Calendar className="w-3.5 h-3.5" />;
                            bgClass = "bg-purple-50 text-purple-500";
                          } else if (lowerKey.includes('financ') || lowerLabel.includes('financ') || lowerLabel.includes('loan')) {
                            icon = <CreditCard className="w-3.5 h-3.5" />;
                            bgClass = "bg-yellow-50 text-yellow-600";
                          }

                          return (
                            <div key={key} className="flex items-start gap-2.5">
                              <div className={`mt-0.5 p-1 rounded ${bgClass}`}>
                                {icon}
                              </div>
                              <div className="overflow-hidden">
                                <span className="block text-xs text-gray-500 font-medium lowercase first-letter:uppercase">{label}</span>
                                <span className="font-semibold truncate block" title={displayValue}>{displayValue}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Feedback Section */}
          {isBot && allowFeedback && onFeedback && (
            <div className="flex gap-2 mt-2 ml-1 animate-fade-in">
              <button
                onClick={() => onFeedback('up')}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${message.feedback === 'up' ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400'}`}
                title="Helpful"
              >
                <ThumbsUp size={14} className={message.feedback === 'up' ? 'fill-current' : ''} />
              </button>
              <button
                onClick={() => onFeedback('down')}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${message.feedback === 'down' ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-gray-400'}`}
                title="Not helpful"
              >
                <ThumbsDown size={14} className={message.feedback === 'down' ? 'fill-current' : ''} />
              </button>
              <span className="text-[10px] text-gray-300 self-center ml-1">Was this helpful?</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
