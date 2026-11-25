/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./contexts/**/*.{js,ts,jsx,tsx}",
        "./utils/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                // Chat widget theme: per-client tokens set as CSS vars by utils/theme/cssVars.ts
                le: {
                    accent: "var(--le-accent)",
                    "accent-soft": "var(--le-accent-soft)",
                    link: "var(--le-link)",
                    "selected-text": "var(--le-selected-text)",
                    "selected-bg": "var(--le-selected-bg)",
                    "selected-border": "var(--le-selected-border)",
                    "on-btn": "var(--le-on-btn)",
                    "on-bubble": "var(--le-on-bubble)",
                    "tint-1": "var(--le-tint-1)",
                    "tint-2": "var(--le-tint-2)",
                    border: "var(--le-border)",
                    track: "var(--le-track)",
                    "bg-1": "var(--le-bg-1)",
                    "bg-2": "var(--le-bg-2)",
                    "bg-3": "var(--le-bg-3)",
                    // Fixed (never themed)
                    ink: "#1C1B26",
                    muted: "#6E6A80",
                    icon: "#4A4660",
                    faint: "#8A8699",
                    field: "#E8E5F2",
                    "bot-border": "#EFECF8",
                    "tile-border": "#ECE8F8",
                    disabled: "#F6F5FA",
                    success: "#22A55B",
                    danger: "#B4283C",
                    star: "#F5A524",
                },
                // LEGACY (removed once every chat component reads le-* tokens)
                brand: {
                    DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)",
                    ink: "var(--brand-ink)",
                    soft: "var(--brand-soft)",
                    border: "var(--brand-border)",
                    on: "var(--on-brand)",
                },
                // Visitor chat: fixed neutrals
                chat: {
                    ink: "#1C1B2E",
                    body: "#3B3950",
                    muted: "#6F6C86",
                    faint: "#A3A0B8",
                    line: "#E8E6F3",
                    subtle: "#F6F5FB",
                    online: "#22A75A",
                    danger: "#C42B3B",
                },
            },
            fontFamily: {
                chat: ["Outfit", "Inter", "system-ui", "-apple-system", "sans-serif"],
            },
            backgroundImage: {
                "le-page": "linear-gradient(170deg, var(--le-bg-1) 0%, var(--le-bg-2) 50%, var(--le-bg-3) 100%)",
                "le-btn": "linear-gradient(135deg, var(--le-btn-from), var(--le-btn-to))",
                "le-bubble": "linear-gradient(135deg, var(--le-bubble-from), var(--le-bubble-to))",
                "le-robot-acc": "linear-gradient(135deg, var(--le-robot-acc-from), var(--le-robot-acc-to))",
                "le-glow": "radial-gradient(closest-side, var(--le-glow), var(--le-glow-2) 55%, rgba(255,255,255,0))",
                "brand-grad": "var(--brand-grad)",
                "chat-bg": "var(--chat-bg)",
            },
            boxShadow: {
                "le-card": "0 2px 14px var(--le-shadow)",
                "le-float": "0 8px 28px var(--le-shadow), 0 2px 8px var(--le-shadow)",
                "chat-card": "0 1px 2px rgba(28, 27, 46, 0.04), 0 8px 24px -8px rgba(60, 50, 140, 0.12)",
                "chat-float": "0 12px 32px -10px rgba(60, 50, 140, 0.22)",
                "chat-brand": "0 8px 20px -6px rgb(var(--brand-rgb) / 0.5)",
            },
            animation: {
                'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear',
                'marquee': 'marquee var(--duration) linear infinite',
                'spotlight': 'spotlight 2s ease .5s 1 forwards',
                'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
                'float': 'float 6s ease-in-out infinite',
                'shimmer': 'shimmer 2.5s linear infinite',
                'menu-in': 'menuIn 160ms cubic-bezier(0.16, 1, 0.3, 1) both',
                'mascot-bob': 'mascotBob 4.5s ease-in-out infinite',
                'twinkle': 'twinkle 3s ease-in-out infinite',
            },
            keyframes: {
                'border-beam': {
                    '100%': {
                        'offset-distance': '100%',
                    },
                },
                marquee: {
                    from: { transform: 'translateX(0%)' },
                    to: { transform: 'translateX(-50%)' },
                },
                spotlight: {
                    '0%': {
                        opacity: '0',
                        transform: 'translate(-72%, -62%) scale(0.5)',
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translate(-50%,-50%) scale(1)',
                    },
                },
                pulseGlow: {
                    '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
                    '50%': { opacity: '0.8', transform: 'scale(1.05)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                },
                menuIn: {
                    from: { opacity: '0', transform: 'translateY(-4px) scale(0.98)' },
                    to: { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
                mascotBob: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
                twinkle: {
                    '0%, 100%': { opacity: '0.45', transform: 'scale(0.9)' },
                    '50%': { opacity: '1', transform: 'scale(1.1)' },
                }
            },
        },
    },
    plugins: [],
}
