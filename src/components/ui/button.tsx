import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Brandbook v1.0 — 5 variantes PanaLearn
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3F72] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Ação principal: Teal sólido
        default:
          "bg-[#417B5A] text-white hover:bg-[#4e9168] active:bg-[#356649]",
        // Ação secundária importante: Grape sólido
        secondary:
          "bg-[#4B3F72] text-[#E9D2C0] hover:bg-[#5c4e8a] active:bg-[#3D3360]",
        // Editar / ações de linha: outline Grape
        outline:
          "border border-[#4B3F72] bg-transparent text-[#4B3F72] hover:bg-[#4B3F72]/5 active:bg-[#4B3F72]/10",
        // Ações neutras / refresh: ghost com borda Bone
        ghost:
          "border border-[#D0CEBA] bg-transparent text-[#6b7280] hover:bg-[#f3f1ec] hover:text-[#1F2041] active:bg-[#e4e5f0]",
        // Deletar: danger outline vermelho (sm)
        destructive:
          "border border-red-500 bg-transparent text-red-600 text-xs hover:bg-red-50 active:bg-red-100",
        // Mantido para compatibilidade com shadcn
        link: "text-[#4B3F72] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-7 rounded-md px-3 py-1 text-xs",
        lg:      "h-11 rounded-md px-8",
        icon:    "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
