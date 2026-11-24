import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../utils/cn';

interface TabsContextType {
    activeTab: string;
    setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
    defaultValue: string;
    children: React.ReactNode;
    className?: string;
    onValueChange?: (value: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ defaultValue, children, className, onValueChange }) => {
    const [activeTab, setActiveTab] = useState(defaultValue);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        if (onValueChange) onValueChange(value);
    };

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
            <div className={cn("w-full", className)}>{children}</div>
        </TabsContext.Provider>
    );
};

export const TabsList: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
    return (
        <div className={cn("inline-flex items-center justify-center rounded-xl bg-zinc-100 p-1.5 border border-zinc-200 backdrop-blur-md", className)}>
            {children}
        </div>
    );
};

export const TabsTrigger: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ value, children, className }) => {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");

    const isActive = context.activeTab === value;

    return (
        <button
            type="button"
            onClick={() => context.setActiveTab(value)}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none",
                isActive
                    ? "bg-black text-white shadow-md font-semibold"
                    : "text-zinc-600 hover:text-black hover:bg-zinc-200/60",
                className
            )}
        >
            {children}
        </button>
    );
};

export const TabsContent: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ value, children, className }) => {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsContent must be used within Tabs");

    if (context.activeTab !== value) return null;

    return <div className={cn("mt-4 animate-fade-in-up", className)}>{children}</div>;
};
