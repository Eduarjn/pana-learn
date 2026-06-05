import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

// Brandbook v1.0 — underline Grape, sem background no item ativo
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "flex border-b border-[#e4e5f0] bg-transparent",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base
      "px-4 py-2 text-[13px] font-normal text-[#6b7280] border-b-2 border-transparent -mb-px cursor-pointer",
      "transition-colors duration-150 whitespace-nowrap",
      "hover:text-[#1F2041]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3F72] focus-visible:ring-offset-1",
      "disabled:pointer-events-none disabled:opacity-50",
      // Estado ativo: underline Grape, texto Grape, peso 500
      "data-[state=active]:text-[#4B3F72] data-[state=active]:border-b-[#4B3F72] data-[state=active]:font-medium",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3F72] focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
