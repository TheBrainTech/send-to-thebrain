import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				primary:
					"bg-brand text-brand-foreground hover:opacity-90 shadow-sm",
				secondary:
					"bg-secondary text-secondary-foreground hover:brightness-95 border border-border",
				ghost:
					"bg-transparent text-foreground hover:bg-secondary",
				destructive:
					"bg-destructive text-destructive-foreground hover:opacity-90",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				sm: "h-8 px-3",
				md: "h-10 px-4",
				lg: "h-11 px-6",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "md",
		},
	},
);

export interface ButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, ...props }, ref) => (
		<button
			ref={ref}
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		/>
	),
);
Button.displayName = "Button";
