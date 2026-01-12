import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    // Base styles (always applied)
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default:
                    "bg-blue-600 text-white shadow-lg shadow-blue-200/50 hover:bg-blue-700 hover:shadow-blue-300/50 hover:scale-[1.02] active:scale-[0.98]",
                destructive:
                    "bg-red-600 text-white shadow-sm hover:bg-red-700",
                outline:
                    "border-2 border-slate-300 bg-transparent text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400",
                secondary:
                    "bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200",
                ghost:
                    "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                link:
                    "text-blue-600 underline-offset-4 hover:underline",
            },
            size: {
                default: "h-11 px-6 py-3",
                sm: "h-9 px-4 py-2 text-xs",
                lg: "h-14 px-8 py-4 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
