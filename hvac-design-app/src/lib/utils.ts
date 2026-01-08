import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * 
 * Combines clsx (conditional classes) with tailwind-merge (prevents conflicts)
 * Example: cn("bg-red-500", condition && "bg-blue-500") -> "bg-blue-500"
 * 
 * @param inputs - Array of class values (strings, objects, arrays)
 * @returns Merged className string
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
