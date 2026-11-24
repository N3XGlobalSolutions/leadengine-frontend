import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AccordionItemProps {
    id: string;
    title: string;
    children: React.ReactNode;
    isOpen?: boolean;
    onToggle?: () => void;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, isOpen, onToggle }) => {
    return (
        <div className="border-b border-zinc-200 py-4 transition-colors">
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center justify-between py-2 text-left text-lg font-semibold text-black transition-all hover:text-zinc-700"
            >
                <span>{title}</span>
                <ChevronDown
                    className={cn(
                        "h-5 w-5 text-zinc-500 transition-transform duration-300",
                        isOpen && "rotate-180 text-black"
                    )}
                />
            </button>
            <div
                className={cn(
                    "grid transition-all duration-300 ease-in-out text-zinc-600 text-sm leading-relaxed overflow-hidden",
                    isOpen ? "grid-rows-[1fr] opacity-100 pt-2 pb-1" : "grid-rows-[0fr] opacity-0"
                )}
            >
                <div className="overflow-hidden">{children}</div>
            </div>
        </div>
    );
};

export const Accordion: React.FC<{ items: { id: string; title: string; content: string }[]; className?: string }> = ({ items, className }) => {
    const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);

    return (
        <div className={cn("w-full divide-y divide-zinc-200", className)}>
            {items.map((item) => (
                <AccordionItem
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    isOpen={openId === item.id}
                    onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                >
                    {item.content}
                </AccordionItem>
            ))}
        </div>
    );
};
