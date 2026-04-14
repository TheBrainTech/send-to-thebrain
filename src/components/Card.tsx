import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn(
				"rounded-lg border border-border bg-card text-card-foreground shadow-sm",
				className,
			)}
			{...props}
		/>
	),
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn("flex flex-col gap-1 p-4", className)} {...props} />
	),
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
	({ className, ...props }, ref) => (
		<h2
			ref={ref}
			className={cn("text-lg font-semibold leading-tight tracking-tight", className)}
			{...props}
		/>
	),
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
	HTMLParagraphElement,
	HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
	),
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn("flex items-center gap-2 p-4 pt-0", className)}
			{...props}
		/>
	),
);
CardFooter.displayName = "CardFooter";
