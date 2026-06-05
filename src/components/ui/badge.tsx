import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Brandbook v1.0 — 7 variantes PanaLearn (status + plano)
const badgeVariants = cva(
  "inline-flex items-center gap-1 font-medium transition-colors",
  {
    variants: {
      variant: {
        // Status empresa
        ativo:       "bg-[#d4e8dc] text-[#2a6045]",
        inativo:     "bg-[#e8e4f3] text-[#4B3F72]",
        trial:       "bg-[#E9D2C0] text-[#7a5840]",
        // Tipo tenant
        principal:   "bg-[#1F2041] text-[#E9D2C0]",
        // Planos
        starter:     "bg-[#e4e5f0] text-[#1F2041]",
        pro:         "bg-[#4B3F72] text-[#E9D2C0]",
        enterprise:  "bg-[#417B5A] text-white",
        // Shadcn compatibilidade
        default:     "border-transparent bg-[#417B5A] text-white hover:bg-[#4e9168]",
        secondary:   "border-transparent bg-[#e4e5f0] text-[#1F2041] hover:bg-[#d8d8e8]",
        destructive: "border-transparent bg-red-100 text-red-700 hover:bg-red-200",
        outline:     "border border-[#D0CEBA] text-[#1F2041]",
      },
      size: {
        default: "text-[11px] px-[9px] py-[3px] rounded-[20px]",
        sm:      "text-[10px] px-2 py-0.5 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
