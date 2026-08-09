import * as React from "react";
import { cn } from "../../lib/utils";

const badgeVariants = {
  default: "border-transparent bg-primary text-white hover:bg-primary-700",
  secondary: "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200",
  destructive: "border-transparent bg-destructive text-white hover:bg-red-600",
  warning: "border-transparent bg-warning text-white hover:bg-amber-600",
  success: "border-transparent bg-success text-white hover:bg-emerald-600",
  outline: "text-slate-700 border-slate-300",
};

function Badge({ className, variant = "default", ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
