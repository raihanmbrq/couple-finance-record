import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { FloatingPanel } from '@/components/desktop/ui/FloatingPanel';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ElementType;
}

interface CustomDesktopDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  testId?: string;
  className?: string;
  /**
   * Render the option list in a body portal anchored to the trigger instead of
   * an in-flow absolute box. Use inside dialogs: an absolutely-positioned list
   * still extends the dialog's scroll area, which forced users to scroll the
   * modal before they could reach the options.
   */
  floating?: boolean;
}

export const CustomDesktopDropdown: React.FC<CustomDesktopDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  testId,
  className = '',
  floating = false,
}) => {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // No fallback to `options[0]`: an empty/unmatched value must show the
  // placeholder (e.g. "Please select a wallet") instead of a fake selection.
  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (open) {
      setHighlightedIndex(Math.max(0, options.findIndex((option) => option.value === value)));
    }
  }, [open, options, value]);

  useEffect(() => {
    // Floating mode delegates outside-click detection to FloatingPanel, which
    // also knows about the portaled list (it lives outside `containerRef`).
    if (floating) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [floating]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Tab') {
      setOpen(false);
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      } else if (options[highlightedIndex]) {
        onChange(options[highlightedIndex].value);
        setOpen(false);
      }
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setHighlightedIndex((current) => (current + direction + options.length) % options.length);
    }
  };

  const optionItems = options.map((opt) => {
    const isSelected = opt.value === value;
    const isHighlighted = highlightedIndex === options.indexOf(opt);
    const Icon = opt.icon;
    return (
      <button
        key={opt.value}
        type="button"
        onClick={() => {
          onChange(opt.value);
          setOpen(false);
        }}
        onMouseEnter={() => setHighlightedIndex(options.indexOf(opt))}
        role="option"
        aria-selected={isSelected}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-surface-hover transition-colors ${
          isSelected || isHighlighted ? 'bg-accent/10 font-bold text-accent' : 'text-text-primary'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
          <span className="truncate">{opt.label}</span>
        </div>
        {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
      </button>
    );
  });

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-medium text-text-primary shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <selectedOption.icon className="w-3.5 h-3.5 text-accent shrink-0" />}
          <span className={`truncate ${selectedOption ? '' : 'text-text-muted'}`}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && floating && (
        <FloatingPanel
          anchorRef={containerRef}
          open={open}
          onClose={() => setOpen(false)}
          matchAnchorWidth
          maxHeight={240}
          testId={testId ? `${testId}-listbox` : undefined}
          role="listbox"
          className="py-1 text-xs"
        >
          {optionItems}
        </FloatingPanel>
      )}

      {open && !floating && (
        <div className="absolute left-0 mt-1.5 min-w-full w-max max-w-xs bg-surface border border-border rounded-xl shadow-xl z-50 py-1 max-h-60 overflow-y-auto text-xs">
          {optionItems}
        </div>
      )}
    </div>
  );
};

