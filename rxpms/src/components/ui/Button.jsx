import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";

const buttonVariants = {
  default: "bg-primary text-white hover:bg-primary-700",
  destructive: "bg-destructive text-white hover:bg-red-600",
  outline: "border border-slate-300 bg-white hover:bg-slate-100 text-slate-700",
  secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  ghost: "hover:bg-slate-100 text-slate-700",
  link: "text-primary underline-offset-4 hover:underline",
};

const buttonSizes = {
  default: "h-9 px-3 py-2 text-[13px]",
  sm: "h-8 px-2.5 text-xs",
  lg: "h-11 px-5 text-sm",
  icon: "h-9 w-9",
};

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
