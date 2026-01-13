"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, onCheckedChange, defaultChecked, checked, disabled, ...props }, ref) => {
        const [isChecked, setIsChecked] = React.useState(defaultChecked ?? checked ?? false)

        React.useEffect(() => {
            if (checked !== undefined) {
                setIsChecked(checked)
            }
        }, [checked])

        const handleClick = () => {
            if (disabled) return
            const newValue = !isChecked
            setIsChecked(newValue)
            onCheckedChange?.(newValue)
        }

        return (
            <button
                type="button"
                role="switch"
                aria-checked={isChecked}
                disabled={disabled}
                onClick={handleClick}
                className={cn(
                    "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    isChecked ? "bg-blue-600" : "bg-slate-200",
                    className
                )}
                {...(props as any)}
            >
                <span
                    className={cn(
                        "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
                        isChecked ? "translate-x-4" : "translate-x-0"
                    )}
                />
                <input
                    ref={ref}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => { }}
                    className="sr-only"
                    {...props}
                />
            </button>
        )
    }
)
Switch.displayName = "Switch"

export { Switch }
