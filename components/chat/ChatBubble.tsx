
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { Message, MessageRole } from '../../types';
import { MapPin, DollarSign, Home, Calendar, CreditCard, User, Phone, ThumbsUp, ThumbsDown } from 'lucide-react';


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
          <div
            className={`
              px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm break-words
              ${isBot
                ? 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                : 'bg-white text-gray-800 rounded-br-none border border-gray-100'
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
                }}
              >
                {message.text}
              </ReactMarkdown>
            ) : (
              <span className="whitespace-pre-wrap">{message.text}</span>
            )}
          </div>

          {/* Summary Card */}
          {message.isSummary && message.summaryData && (
            <div className="mt-3 w-full bg-white rounded-xl p-5 shadow-lg border border-gray-100 animate-fade-in-up">
              {/* Summary content omitted for brevity but should remain if space allows, or can be kept as is if I don't touch inner summary content. 
                  Actually I am replacing the whole return block, so I must include it. 
              */}
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2 flex items-center justify-between">
                <span>Lead Qualification Summary</span>
                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">Completed</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-700">
                {/* Contact Info */}
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 bg-gray-100 rounded text-gray-600">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="block text-xs text-gray-500 font-medium">Name</span>
                    <span className="font-semibold truncate block">{message.summaryData.name || 'Not provided'}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 bg-gray-100 rounded text-gray-600">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 font-medium">Phone</span>
                    <span className="font-semibold">{message.summaryData.phone || 'Not provided'}</span>
                  </div>
                </div>

                <div className="col-span-1 sm:col-span-2 border-t border-dashed border-gray-200 my-1"></div>

                {/* Requirements */}
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 bg-red-50 rounded text-red-500">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 font-medium">Location</span>
                    <span className="font-semibold">{message.summaryData.location}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 bg-green-50 rounded text-green-600">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 font-medium">Budget</span>
                    <span className="font-semibold">{message.summaryData.budget}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 bg-blue-50 rounded text-blue-500">
                    <Home className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 font-medium">Type</span>
                    <span className="font-semibold">{message.summaryData.type}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 bg-purple-50 rounded text-purple-500">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 font-medium">Move-in</span>
                    <span className="font-semibold">{message.summaryData.moveIn}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 sm:col-span-2">
                  <div className="mt-0.5 p-1 bg-yellow-50 rounded text-yellow-600">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 font-medium">Financing</span>
                    <span className="font-semibold">{message.summaryData.financing}</span>
                  </div>
                </div>
              </div>
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
