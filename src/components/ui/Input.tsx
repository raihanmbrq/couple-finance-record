import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
   ({ label, error, prefix, className = '', ...props }, ref) => {
     return (
       <div className="space-y-1.5">
         {label && <label className="block text-sm font-medium text-text-secondary">{label}</label>}
         <div className="relative">
           {prefix && (
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium pointer-events-none">
               {prefix}
             </span>
           )}
           <input
             ref={ref}
             className={`input-field ${prefix ? 'pl-12' : ''} ${error ? 'border-expense focus:ring-expense/30 focus:border-expense' : ''} ${className}`}
             {...props}
           />
         </div>
         {error && <p className="text-xs text-expense">{error}</p>}
       </div>
     );
   }
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
   ({ label, error, className = '', children, ...props }, ref) => {
     return (
       <div className="space-y-1.5">
         {label && <label className="block text-sm font-medium text-text-secondary">{label}</label>}
         <select
           ref={ref}
           className={`input-field appearance-none bg-surface ${className}`}
           {...props}
         >
           {children}
         </select>
         {error && <p className="text-xs text-expense">{error}</p>}
       </div>
     );
   }
);
Select.displayName = 'Select';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
   ({ label, error, className = '', ...props }, ref) => {
     return (
       <div className="space-y-1.5">
         {label && <label className="block text-sm font-medium text-text-secondary">{label}</label>}
         <textarea
           ref={ref}
           className={`input-field resize-none ${className}`}
           {...props}
         />
         {error && <p className="text-xs text-expense">{error}</p>}
       </div>
     );
   }
);
Textarea.displayName = 'Textarea';
