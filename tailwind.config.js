/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{ts,tsx,html}"],
	theme: {
		extend: {
			fontFamily: {
				sans: ["Inter", "system-ui", "sans-serif"],
			},
			colors: {
				background: "var(--color-background)",
				foreground: "var(--color-foreground)",
				muted: "var(--color-muted)",
				"muted-foreground": "var(--color-muted-foreground)",
				border: "var(--color-border)",
				input: "var(--color-input)",
				ring: "var(--color-ring)",
				primary: {
					DEFAULT: "var(--color-primary)",
					foreground: "var(--color-primary-foreground)",
				},
				secondary: {
					DEFAULT: "var(--color-secondary)",
					foreground: "var(--color-secondary-foreground)",
				},
				brand: {
					DEFAULT: "var(--color-brand)",
					foreground: "var(--color-brand-foreground)",
				},
				destructive: {
					DEFAULT: "var(--color-destructive)",
					foreground: "var(--color-destructive-foreground)",
				},
				success: {
					DEFAULT: "var(--color-success)",
					foreground: "var(--color-success-foreground)",
				},
				warning: {
					DEFAULT: "var(--color-warning)",
					foreground: "var(--color-warning-foreground)",
				},
				info: {
					DEFAULT: "var(--color-info)",
					foreground: "var(--color-info-foreground)",
				},
				card: {
					DEFAULT: "var(--color-card)",
					foreground: "var(--color-card-foreground)",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
		},
	},
	plugins: [],
};
