import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Send } from 'lucide-react';

interface ChatInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;   // can't send (bot is replying); typing stays possible so mobile keyboards don't close
    placeholder?: string;
    autoFocus?: boolean;  // default true: focus when enabled again, on fine-pointer (non-touch) devices only
}

// ── Minimal Web Speech API types (not in this project's TS lib) ─────────────
interface SpeechAlternativeLike {
    readonly transcript: string;
}
interface SpeechResultLike {
    readonly isFinal: boolean;
    readonly length: number;
    readonly [index: number]: SpeechAlternativeLike;
}
interface SpeechResultListLike {
    readonly length: number;
    readonly [index: number]: SpeechResultLike;
}
interface SpeechRecognitionEventLike extends Event {
    readonly resultIndex: number;
    readonly results: SpeechResultListLike;
}
interface SpeechRecognitionErrorEventLike extends Event {
    readonly error: string;
}
interface SpeechRecognitionLike extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
    onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const getSpeechRecognition = (): SpeechRecognitionCtor | null => {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as {
        SpeechRecognition?: SpeechRecognitionCtor;
        webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

const isFinePointer = (): boolean =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: fine)').matches;

const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

const ChatInput: React.FC<ChatInputProps> = ({
    onSend,
    disabled = false,
    placeholder = 'Type your reply...',
    autoFocus = true,
}) => {
    const [input, setInput] = useState('');
    const [listening, setListening] = useState(false);
    const [micMessage, setMicMessage] = useState('');
    const [speechSupported] = useState(() => getSpeechRecognition() !== null);

    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const dictationBaseRef = useRef(''); // text already in the box when dictation started

    // Focus the box when it can be used again (after the bot replies) - desktop only
    useEffect(() => {
        if (!autoFocus || disabled || !isFinePointer()) return;
        const timeoutId = window.setTimeout(() => {
            if (document.activeElement !== inputRef.current) inputRef.current?.focus();
        }, 50);
        return () => window.clearTimeout(timeoutId);
    }, [disabled, autoFocus]);

    const stopListening = useCallback(() => {
        const recognition = recognitionRef.current;
        if (recognition) {
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            try {
                recognition.abort();
            } catch {
                // already stopped
            }
        }
        recognitionRef.current = null;
        setListening(false);
    }, []);

    // Never keep the microphone open after unmount
    useEffect(
        () => () => {
            const recognition = recognitionRef.current;
            if (!recognition) return;
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            try {
                recognition.abort();
            } catch {
                // already stopped
            }
        },
        []
    );

    // Stop dictating while the bot is replying (its onend handler resets the listening state)
    useEffect(() => {
        if (!disabled) return;
        try {
            recognitionRef.current?.abort();
        } catch {
            // already stopped
        }
    }, [disabled]);

    const startListening = () => {
        const Recognition = getSpeechRecognition();
        if (!Recognition) return;

        const recognition = new Recognition();
        recognition.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        dictationBaseRef.current = input.trim();

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0]?.transcript || '';
            }
            const base = dictationBaseRef.current;
            const spoken = transcript.trim();
            setInput(base && spoken ? `${base} ${spoken}` : base || spoken);
        };
        recognition.onerror = (event) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setMicMessage('Microphone access is blocked. Allow it in your browser settings to use voice input.');
            } else if (event.error === 'no-speech') {
                setMicMessage("Didn't catch that. Tap the mic and try again.");
            } else if (event.error !== 'aborted') {
                setMicMessage('Voice input stopped. Please try again.');
            }
        };
        recognition.onend = () => {
            recognitionRef.current = null;
            setListening(false);
            inputRef.current?.focus();
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
            setMicMessage('');
            setListening(true);
        } catch {
            setMicMessage('Voice input is unavailable right now.');
            setListening(false);
        }
    };

    const toggleListening = () => {
        if (listening) {
            // stop() (not abort) lets the browser deliver the final result
            try {
                recognitionRef.current?.stop();
            } catch {
                stopListening();
            }
        } else {
            startListening();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || disabled) return;
        if (listening) stopListening();
        onSend(text);
        setInput('');
    };

    const canSend = input.trim().length > 0 && !disabled;

    return (
        <form onSubmit={handleSubmit} className="w-full" aria-label="Send a message">
            <div className="flex h-16 w-full items-center gap-1 rounded-full bg-white pl-6 pr-2 shadow-chat-float transition-shadow focus-within:ring-2 focus-within:ring-brand/30">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={listening ? 'Listening…' : placeholder}
                    aria-label="Message"
                    autoComplete="off"
                    enterKeyHint="send"
                    className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-chat-ink placeholder:text-chat-muted focus:outline-none"
                />

                {speechSupported && (
                    <button
                        type="button"
                        onClick={toggleListening}
                        disabled={disabled}
                        aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                        aria-pressed={listening}
                        title={micMessage || undefined}
                        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${focusRing} ${
                            listening ? 'bg-brand/10 text-brand-ink' : 'text-chat-body hover:bg-chat-subtle'
                        }`}
                    >
                        {listening && (
                            <span
                                className="absolute inset-0 rounded-full ring-2 ring-brand/40 motion-safe:animate-ping"
                                aria-hidden="true"
                            />
                        )}
                        <Mic className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden="true" />
                    </button>
                )}

                <button
                    type="submit"
                    disabled={!canSend}
                    aria-label="Send message"
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-grad text-brand-on transition-all ${focusRing} ${
                        canSend ? 'shadow-chat-brand hover:brightness-105 active:scale-95' : 'cursor-not-allowed opacity-50'
                    }`}
                >
                    <Send className="h-5 w-5 -translate-x-px translate-y-px" strokeWidth={2} aria-hidden="true" />
                </button>
            </div>

            {/* Announces dictation state / mic problems to screen readers */}
            <p className="sr-only" aria-live="polite">
                {listening ? 'Listening for your message' : micMessage}
            </p>
        </form>
    );
};

export default ChatInput;
