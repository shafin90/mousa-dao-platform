import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/shared/utils/cn";
import { ChevronDown, Search, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  clearable?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  label,
  error,
  disabled,
  className,
  clearable = true,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  const handleSelect = (opt: Option) => {
    onChange(opt.value);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(!open)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm transition-colors",
            "hover:border-ring/50",
            "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
            error && "border-destructive focus:ring-destructive/20 focus:border-destructive",
            !selectedOption && "text-muted-foreground/60"
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-muted-foreground/60")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {clearable && value && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={12} />
              </span>
            )}
            <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
          </div>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border bg-card shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Search size={14} className="shrink-0 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-muted-foreground">No options found</p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                      opt.value === value && "bg-primary/10 font-medium text-primary"
                    )}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};
