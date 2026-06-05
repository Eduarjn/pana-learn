import * as React from "react"

import { cn } from "@/lib/utils"

// Brandbook v1.0 — border Bone, focus ring Grape
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md bg-white px-3 py-2",
          "border border-[#D0CEBA] text-[13px] text-[#1F2041]",
          "placeholder:text-[#9b9b9b]",
          "transition-[border-color,box-shadow] duration-200",
          "focus-visible:outline-none focus-visible:border-[#4B3F72] focus-visible:ring-[3px] focus-visible:ring-[rgba(75,63,114,0.15)]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f3f4f6]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
