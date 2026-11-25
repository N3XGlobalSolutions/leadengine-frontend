import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, EllipsisVertical, type LucideIcon } from 'lucide-react';

export interface ChatMenuItem {
    id: string;
    label: string;
    icon: LucideIcon;
    onSelect: () => void;
    tone?: 'default' | 'danger';
}

export interface ChatHeaderProps {
    variant: 'brand' | 'centered';
    title: string;              // brand: company name; centered: "{company} Assistant"
    initials?: string;          // brand variant: logo tile text
    statusText?: string | null; // "AI Assistant · Online" / "Online"; null/undefined hides the status line
    onBack?: () => void;        // centered variant: circular back button when provided
    menuItems: ChatMenuItem[];  // kebab menu; the kebab is hidden when empty
}

const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

const circleButton =
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/80 text-chat-ink ' +
    'shadow-[0_2px_12px_-4px_rgba(60,50,140,0.14)] transition-colors';

/**
 * The menu is portaled to <body> so its overlay always covers the whole page, whatever stacking
 * contexts the page creates. A portal leaves the chat root, so the brand CSS variables and the
 * chat font are copied onto the portal wrapper.
 */
const THEME_VARS = [
    '--brand',
    '--brand-rgb',
    '--brand-ink',
    '--brand-soft',
    '--brand-border',
    '--on-brand',
    '--brand-grad',
    '--chat-bg',
];

const readThemeStyle = (el: HTMLElement | null): React.CSSProperties => {
    if (!el || typeof window === 'undefined') return {};
    const computed = window.getComputedStyle(el);
    const style: Record<string, string> = { fontFamily: computed.fontFamily };
    THEME_VARS.forEach((name) => {
        const value = computed.getPropertyValue(name).trim();
        if (value) style[name] = value;
    });
    return style as React.CSSProperties;
};

interface AnchorRect {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
}

const toAnchorRect = (el: HTMLElement): AnchorRect => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
};

const StatusLine: React.FC<{ text: string; centered?: boolean }> = ({ text, centered }) => (
    <p
        className={`mt-0.5 flex items-center gap-1.5 text-sm text-chat-muted ${centered ? 'justify-center' : ''}`}
    >
        <span className="h-2 w-2 shrink-0 rounded-full bg-chat-online" aria-hidden="true" />
        <span className="truncate">{text}</span>
    </p>
);

const ChatHeader: React.FC<ChatHeaderProps> = ({ variant, title, initials, statusText, onBack, menuItems }) => {
    const [menuOpen, setOpen] = useState(false);
    const [anchor, setAnchor] = useState<AnchorRect | null>(null);
    const [themeStyle, setThemeStyle] = useState<React.CSSProperties>({});
    const buttonRef = useRef<HTMLButtonElement>(null);
    const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const menuId = useId();
    const buttonId = useId();

    const hasMenu = menuItems.length > 0;
    // If the menu items disappear (e.g. the view changed underneath), treat the menu as closed
    const open = menuOpen && hasMenu;

    const updateAnchor = useCallback(() => {
        if (buttonRef.current) setAnchor(toAnchorRect(buttonRef.current));
    }, []);

    const openMenu = () => {
        if (!buttonRef.current) return;
        setAnchor(toAnchorRect(buttonRef.current));
        setThemeStyle(readThemeStyle(buttonRef.current));
        setOpen(true);
    };

    const closeMenu = useCallback((returnFocus = true) => {
        setOpen(false);
        if (returnFocus) buttonRef.current?.focus();
    }, []);

    const focusItem = (index: number) => {
        const count = menuItems.length;
        if (count === 0) return;
        const next = ((index % count) + count) % count;
        itemRefs.current[next]?.focus();
    };

    // Move focus into the menu when it opens
    useLayoutEffect(() => {
        if (open) itemRefs.current[0]?.focus();
    }, [open]);

    // Escape closes; keep the menu attached to the kebab on resize/scroll
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeMenu();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        window.addEventListener('resize', updateAnchor);
        window.addEventListener('scroll', updateAnchor, true);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('resize', updateAnchor);
            window.removeEventListener('scroll', updateAnchor, true);
        };
    }, [open, closeMenu, updateAnchor]);

    const handleItemKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                focusItem(index + 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                focusItem(index - 1);
                break;
            case 'Home':
                e.preventDefault();
                focusItem(0);
                break;
            case 'End':
                e.preventDefault();
                focusItem(menuItems.length - 1);
                break;
            case 'Tab':
                // Menus aren't part of the tab order: Tab closes and focus returns to the kebab
                e.preventDefault();
                closeMenu();
                break;
            default:
                break;
        }
    };

    const handleSelect = (item: ChatMenuItem) => {
        closeMenu();
        item.onSelect();
    };

    const kebab = hasMenu ? (
        <button
            ref={buttonRef}
            id={buttonId}
            type="button"
            onClick={() => (open ? closeMenu() : openMenu())}
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={open ? menuId : undefined}
            className={`${circleButton} bg-white/75 hover:bg-white ${focusRing}`}
        >
            <EllipsisVertical className="h-5 w-5" aria-hidden="true" />
        </button>
    ) : (
        <span className="h-12 w-12 shrink-0" aria-hidden="true" />
    );

    const menuWidth = 'min(16.5rem, calc(100vw - 2rem))';

    const menuPortal =
        open && anchor && typeof document !== 'undefined'
            ? createPortal(
                  <div className="font-chat" style={themeStyle}>
                      {/* Dimmed page; clicking it closes the menu */}
                      <div
                          className="fixed inset-0 z-[60] bg-chat-ink/25 motion-safe:animate-[fadeIn_150ms_ease-out]"
                          aria-hidden="true"
                          onClick={() => closeMenu()}
                      />

                      {/* The kebab stays bright above the overlay (design page 6) */}
                      <button
                          type="button"
                          tabIndex={-1}
                          aria-hidden="true"
                          onClick={() => closeMenu()}
                          className={`${circleButton} fixed z-[61] bg-white`}
                          style={{ top: anchor.top, left: anchor.left, width: anchor.width, height: anchor.height }}
                      >
                          <EllipsisVertical className="h-5 w-5" aria-hidden="true" />
                      </button>

                      <div
                          id={menuId}
                          role="menu"
                          aria-labelledby={buttonId}
                          className="fixed z-[61] rounded-3xl bg-white py-1.5 shadow-chat-float motion-safe:animate-menu-in"
                          style={{
                              top: anchor.bottom + 12,
                              right: Math.max(16, window.innerWidth - anchor.right),
                              width: menuWidth,
                              transformOrigin: 'top right',
                          }}
                      >
                          {/* Nub pointing at the kebab */}
                          <span
                              className="absolute -top-1.5 h-3.5 w-3.5 rotate-45 rounded-[3px] bg-white"
                              style={{ right: Math.max(12, anchor.width / 2 - 7) }}
                              aria-hidden="true"
                          />
                          {menuItems.map((item, index) => {
                              const Icon = item.icon;
                              const danger = item.tone === 'danger';
                              return (
                                  <React.Fragment key={item.id}>
                                      {index > 0 && <div role="none" className="mx-6 h-px bg-chat-line" />}
                                      <button
                                          ref={(el) => {
                                              itemRefs.current[index] = el;
                                          }}
                                          type="button"
                                          role="menuitem"
                                          tabIndex={-1}
                                          onClick={() => handleSelect(item)}
                                          onKeyDown={(e) => handleItemKeyDown(e, index)}
                                          className={`relative flex w-full items-center gap-4 px-6 py-4 text-left text-[17px] outline-none transition-colors hover:bg-chat-subtle focus-visible:bg-chat-subtle ${
                                              danger ? 'text-chat-danger' : 'text-chat-ink'
                                          }`}
                                      >
                                          <Icon
                                              className={`h-[22px] w-[22px] shrink-0 ${danger ? 'text-chat-danger' : 'text-chat-body'}`}
                                              strokeWidth={1.75}
                                              aria-hidden="true"
                                          />
                                          <span className="truncate">{item.label}</span>
                                      </button>
                                  </React.Fragment>
                              );
                          })}
                      </div>
                  </div>,
                  document.body
              )
            : null;

    const headerPadding = 'px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]';

    if (variant === 'brand') {
        return (
            <header className={`relative flex items-center justify-between gap-3 ${headerPadding}`}>
                <div className="flex min-w-0 items-center gap-3">
                    {initials && (
                        <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-bold tracking-wide text-brand-ink shadow-chat-card"
                            aria-hidden="true"
                        >
                            {initials}
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="truncate text-[19px] font-semibold leading-tight text-chat-ink">{title}</p>
                        {statusText && <StatusLine text={statusText} />}
                    </div>
                </div>
                {kebab}
                {menuPortal}
            </header>
        );
    }

    return (
        <header className={`relative grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-2 ${headerPadding}`}>
            {onBack ? (
                <button
                    type="button"
                    onClick={onBack}
                    aria-label="Back"
                    className={`${circleButton} bg-white/75 hover:bg-white ${focusRing}`}
                >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
            ) : (
                <span className="h-12 w-12" aria-hidden="true" />
            )}
            <div className="min-w-0 text-center">
                <p className="truncate text-[18px] font-semibold leading-tight text-chat-ink">{title}</p>
                {statusText && <StatusLine text={statusText} centered />}
            </div>
            {kebab}
            {menuPortal}
        </header>
    );
};

export default ChatHeader;
