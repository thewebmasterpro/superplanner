/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./src/**/*.{js,jsx,ts,tsx}",
	],
	theme: {
		extend: {
			colors: {
				status: {
					todo: '#94a3b8',
					in_progress: '#f59e0b',
					blocked: '#ef4444',
					done: '#10b981',
					cancelled: '#6b7280'
				},
				priority: {
					'1': '#d1d5db',
					'2': '#60a5fa',
					'3': '#f59e0b',
					'4': '#f97316',
					'5': '#ef4444'
				},
				border: 'var(--color-base-300)',
				input: 'var(--color-base-300)',
				ring: 'var(--color-primary)',
				background: 'var(--color-base-100)',
				foreground: 'var(--color-base-content)',
				primary: {
					DEFAULT: 'var(--color-primary)',
					foreground: 'var(--color-primary-content)'
				},
				secondary: {
					DEFAULT: 'var(--color-secondary)',
					foreground: 'var(--color-secondary-content)'
				},
				accent: {
					DEFAULT: 'var(--color-accent)',
					foreground: 'var(--color-accent-content)'
				},
				neutral: {
					DEFAULT: 'var(--color-neutral)',
					foreground: 'color-mix(in oklch, var(--color-base-content) 60%, transparent)'
				},
				destructive: {
					DEFAULT: 'var(--color-error)',
					foreground: 'var(--color-error-content)'
				},
				muted: {
					DEFAULT: 'var(--color-neutral)',
					foreground: 'color-mix(in oklch, var(--color-base-content) 60%, transparent)'
				},
				popover: {
					DEFAULT: 'var(--color-base-100)',
					foreground: 'var(--color-base-content)'
				},
				card: {
					DEFAULT: 'var(--color-base-100)',
					foreground: 'var(--color-base-content)'
				},
				chart: {
					'1': 'var(--color-primary)',
					'2': 'var(--color-secondary)',
					'3': 'var(--color-accent)',
					'4': 'var(--color-warning, #f59e0b)',
					'5': 'var(--color-error)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: [
					'Inter',
					'system-ui',
					'sans-serif'
				],
				display: [
					'Outfit',
					'Inter',
					'system-ui',
					'sans-serif'
				]
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		require("daisyui")({
			themes: [
				"light --default",
				"dark --prefersdark",
				"cupcake", "bumblebee", "emerald", "corporate",
				"synthwave", "retro", "cyberpunk", "valentine",
				"halloween", "garden", "forest", "aqua",
				"lofi", "pastel", "fantasy", "wireframe",
				"black", "luxury", "dracula", "cmyk",
				"autumn", "business", "acid", "lemonade",
				"night", "coffee", "winter", "dim", "nord", "sunset"
			],
			logs: false,
		})
	]
}
