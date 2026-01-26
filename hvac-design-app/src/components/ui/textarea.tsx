import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  warning?: string;
  message?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, warning, message, id, ...props }, ref) => {
    const validationClass = error 
      ? "border-red-500 focus-visible:ring-red-500" 
      : warning 
        ? "border-orange-500 focus-visible:ring-orange-500" 
        : "border-gray-300 focus-visible:ring-blue-500";
    const describedById = message ? `${id ?? "textarea"}-message` : undefined;
    
    return (
      <div className="space-y-1">
        <textarea
          id={id}
          className={cn(
            "flex min-h-[80px] w-full rounded-md bg-white px-3 py-2 text-sm placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50",
            "ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            "resize-y",
            validationClass,
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={describedById}
          {...props}
        />
        {message && (
          <p
            id={describedById}
            className={cn(
              "text-xs",
              error ? "text-red-500" : warning ? "text-orange-500" : "text-gray-500"
            )}
            role={error ? "alert" : undefined}
          >
            {message}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
