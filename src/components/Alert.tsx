import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

const alertVariants = cva(
	"flex gap-3 rounded-md border px-3 py-2 text-sm",
	{
		variants: {
			variant: {
				info: "border-info/40 bg-info/10 text-foreground",
				success: "border-success/40 bg-success/10 text-foreground",
				error: "border-destructive/40 bg-destructive/10 text-foreground",
				warning: "border-warning/40 bg-warning/10 text-foreground",
			},
		},
		defaultVariants: { variant: "info" },
	},
);

const ICONS: Record<NonNullable<VariantProps<typeof alertVariants>["variant"]>, string> = {
	info: "i",
	success: "\u2713",
	error: "!",
	warning: "!",
};

export interface AlertProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "title">,
		VariantProps<typeof alertVariants> {
	title?: ReactNode;
}

export function Alert({ className, variant = "info", title, children, ...props }: AlertProps) {
	const v = variant ?? "info";
	return (
		<div className={cn(alertVariants({ variant: v }), className)} role="status" {...props}>
			<span
				className={cn(
					"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
					v === "success" && "bg-success text-success-foreground",
					v === "error" && "bg-destructive text-destructive-foreground",
					v === "warning" && "bg-warning text-warning-foreground",
					v === "info" && "bg-info text-info-foreground",
				)}
				aria-hidden
			>
				{ICONS[v]}
			</span>
			<div className="flex flex-col gap-0.5">
				{title && <div className="font-medium">{title}</div>}
				{children && <div className="text-muted-foreground">{children}</div>}
			</div>
		</div>
	);
}
