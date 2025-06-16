import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                primary: '#4C6E5D',
                secondary: '#6B7F66',
                background: '#FAFAF8',
                surface: '#FFFFFF',
                'surface-secondary': '#F5F5F3',
                'text-primary': '#000000',
                'text-secondary': '#4C4C4C',
                border: '#E5E5E5',
                accent: '#C8D5B9',
                success: '#4CAF50',
                error: '#F44336',
                warning: '#FF9800',
            },
            boxShadow: {
                'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
                'card-hover': '0 4px 16px rgba(0, 0, 0, 0.1)',
            },
        },
    },
    plugins: [],
};

export default config;