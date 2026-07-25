import React from "react";
import { cn } from "@/shared/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  className,
  label,
  error,
  leftIcon,
  rightIcon,
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full rounded-lg border bg-background px-3 py-2 text-sm transition-colors",
            "placeholder:text-muted-foreground/60",
            "hover:border-ring/50",
            "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
            error && "border-destructive focus:ring-destructive/20 focus:border-destructive",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};
