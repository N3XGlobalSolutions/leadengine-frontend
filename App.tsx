
import React, { useState, useEffect, useRef } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import ChatBubble from './components/ChatBubble';
import ChatInput from './components/ChatInput';
import ActionButtons from './components/ActionButtons';
import QuickReplies from './components/QuickReplies';
import { sendMessageToGemini, initializeChat } from './services/geminiService';
import { Message, MessageRole, SummaryData } from './types';
import { Building2 } from 'lucide-react';
import { brandConfig } from './config';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [leadData, setLeadData] = useState<SummaryData | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isChatEnded, setIsChatEnded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, hasStarted, isLoading, quickReplies]);

  const handleStart = async () => {
    setHasStarted(true);
    await handleBotResponse(`Hello! I'm interested in ${brandConfig.companyName}.`);
  };

  const addMessage = (role: MessageRole, text: string, options?: Partial<Message>) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(),
      role,
      text,
      timestamp: new Date(),
      ...options
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const determineQuickReplies = (text: string): string[] => {
    const lowerText = text.toLowerCase();
    
    // Logic to detect context from the bot's question using config options
    if (lowerText.includes("location") || lowerText.includes("area") || lowerText.includes("where")) {
        return brandConfig.leadQualification.options.locations;
    }
    if (lowerText.includes("budget") || lowerText.includes("price range")) {
        return brandConfig.leadQualification.options.budgets;
    }
    if (lowerText.includes("type") || lowerText.includes("bhk") || lowerText.includes("configuration")) {
        return brandConfig.leadQualification.options.types;
    }
    if (lowerText.includes("move-in") || lowerText.includes("timeline") || lowerText.includes("possession")) {
        return brandConfig.leadQualification.options.moveIn;
    }
    if (lowerText.includes("loan") || lowerText.includes("financing") || lowerText.includes("funding")) {
        return brandConfig.leadQualification.options.financing;
    }
    
    return [];
  };

  const handleBotResponse = async (prompt?: string) => {
    setIsLoading(true);
    setQuickReplies([]); // Clear previous replies while loading

    if (messages.length === 0 && prompt) {
       // Simulate initial connection delay for realism
       await new Promise(resolve => setTimeout(resolve, 600));
       
       // Send the initial invisible prompt to get the bot's greeting
       const response = await sendMessageToGemini(prompt);
       setIsLoading(false);
       addMessage(MessageRole.Bot, response.text, { 
         isSummary: !!response.summary, 
         summaryData: response.summary,
         showActions: response.showActions
       });
       return;
    }

    const lastUserMsg = messages.filter(m => m.role === MessageRole.User).pop()?.text;
    const response = await sendMessageToGemini(prompt || lastUserMsg || "Hello");

    setIsLoading(false);

    if (response.summary) {
      setLeadData(response.summary);
    }

    addMessage(MessageRole.Bot, response.text, { 
      isSummary: !!response.summary, 
      summaryData: response.summary,
      showActions: response.showActions
    });

    // If actions are shown (Schedule Call), don't show quick replies
    if (!response.showActions && !response.summary) {
        const replies = determineQuickReplies(response.text);
        setQuickReplies(replies);
    }
  };

  const handleSendMessage = async (text: string) => {
    setQuickReplies([]); // Clear quick replies immediately when user responds
    if (!hasStarted) {
      setHasStarted(true);
      addMessage(MessageRole.User, text);
      await handleBotResponse();
    } else {
      addMessage(MessageRole.User, text);
      await handleBotResponse();
    }
  };

  const submitToCRM = (status: 'scheduled' | 'later') => {
    console.log("------------------------------------------------");
    console.log("🚀 CRM SUBMISSION SIMULATION");
    console.log("------------------------------------------------");
    console.log("Lead Status:", status === 'scheduled' ? "HOT LEAD - Call Scheduled" : "WARM LEAD - Follow up later");
    console.log("Captured Data:", leadData);
    console.log("Chat Transcript:", messages.map(m => `[${m.role}]: ${m.text}`));
    console.log("------------------------------------------------");
  };

  const handleScheduleCall = () => {
    setQuickReplies([]);
    addMessage(MessageRole.User, "Yes, schedule a call.");
    submitToCRM('scheduled');
    setIsChatEnded(true);
    setTimeout(() => {
         addMessage(MessageRole.Bot, brandConfig.messages.scheduleSuccess);
    }, 1000);
  };

  const handleMaybeLater = () => {
    setQuickReplies([]);
    addMessage(MessageRole.User, "Maybe later.");
    submitToCRM('later');
    setIsChatEnded(true);
    setTimeout(() => {
        addMessage(MessageRole.Bot, brandConfig.messages.maybeLater);
   }, 1000);
  };

  const handleFeedback = (messageId: string, feedbackType: 'up' | 'down') => {
    // 1. Update UI
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, feedback: feedbackType } 
        : msg
    ));

    // 2. Log Feedback
    console.log("------------------------------------------------");
    console.log(`👍 FEEDBACK RECORDED for Message ID: ${messageId}`);
    console.log(`Type: ${feedbackType === 'up' ? 'THUMBS UP' : 'THUMBS DOWN'}`);
    console.log("------------------------------------------------");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left Side: Brand Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Building2 size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">{brandConfig.shortName}</span>
            </div>
            
            {/* Right Side: Bot Branding */}
            <div className="flex items-center gap-3">
               <div className="hidden sm:flex flex-col items-end mr-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Assistant</span>
                  <span className="text-sm font-bold text-indigo-600">{brandConfig.botDisplayName}</span>
               </div>
               <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center border-2 border-indigo-100 shadow-sm">
                  <img 
                    src={brandConfig.botAvatar} 
                    alt={brandConfig.botName}
                    className="w-6 h-6 object-contain"
                  />
               </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50/50">
        
        <div className="flex-1 overflow-y-auto w-full custom-scrollbar scroll-smooth">
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 min-h-full flex flex-col">
            
            {!hasStarted && messages.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center min-h-[60vh] animate-fade-in">
                 <WelcomeScreen onStart={handleStart} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-end pb-4 space-y-6">
                <div className="text-center text-xs text-gray-400 my-4 uppercase tracking-widest font-medium">Today</div>
                
                {messages.map((msg) => (
                  <React.Fragment key={msg.id}>
                    <ChatBubble 
                      message={msg} 
                      onFeedback={(type) => handleFeedback(msg.id, type)}
                      allowFeedback={msg.isSummary || msg.role === MessageRole.Bot && !!leadData} // Allow feedback on Summary OR any bot message after leadData is captured
                    />
                    {msg.showActions && (
                      <ActionButtons 
                        onSchedule={handleScheduleCall}
                        onLater={handleMaybeLater}
                      />
                    )}
                  </React.Fragment>
                ))}
                
                {isLoading && (
                   <div className="flex w-full justify-start animate-fade-in-up">
                      <div className="bg-white px-5 py-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></span>
                      </div>
                   </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Floating Input Area */}
        <div className="w-full bg-white/80 backdrop-blur-lg border-t border-gray-100 p-4 sm:p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-30">
           <div className="max-w-4xl mx-auto">
              {!isChatEnded && <QuickReplies options={quickReplies} onSelect={handleSendMessage} />}
              <ChatInput 
                onSend={handleSendMessage} 
                disabled={isLoading || isChatEnded} 
                placeholder={isChatEnded ? "Conversation ended" : "Type your message here..."}
              />
           </div>
        </div>

      </main>
    </div>
  );
}

export default App;
