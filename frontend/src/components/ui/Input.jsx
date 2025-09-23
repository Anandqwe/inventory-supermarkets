import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const inputVariants = cva(
  "flex w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-amoled-border dark:bg-amoled-card dark:text-amoled-primary dark:placeholder:text-amoled-muted",
  {
    variants: {
      size: {
        sm: "h-8 px-2 text-xs",
        default: "h-10 px-3",
        lg: "h-12 px-4 text-base",
      },
      state: {
        default: "",
        error: "border-danger-500 focus:ring-danger-500",
        success: "border-success-500 focus:ring-success-500",
      }
    },
    defaultVariants: {
      size: "default",
      state: "default",
    },
  }
);

const Input = React.forwardRef(({ 
  className, 
  type = "text",
  size,
  state,
  error,
  label,
  helperText,
  required,
  ...props 
}, ref) => {
  const inputId = React.useId();
  const errorId = React.useId();
  const helperTextId = React.useId();

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-surface-700 dark:text-amoled-secondary mb-1"
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={cn(inputVariants({ size, state: error ? "error" : state, className }))}
        ref={ref}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={
          cn(
            error && errorId,
            helperText && helperTextId
          ) || undefined
        }
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-danger-600 dark:text-danger-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperTextId} className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

// Price Input Component
const PriceInput = React.forwardRef(({ currency = "₹", ...props }, ref) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-surface-500 dark:text-surface-400 text-sm">{currency}</span>
      </div>
      <Input
        {...props}
        ref={ref}
        type="number"
        step="0.01"
        min="0"
        className={cn("pl-8", props.className)}
      />
    </div>
  );
});

PriceInput.displayName = "PriceInput";

// Number Input Component
const NumberInput = React.forwardRef(({ min = 0, step = 1, ...props }, ref) => {
  return (
    <Input
      {...props}
      ref={ref}
      type="number"
      min={min}
      step={step}
    />
  );
});

NumberInput.displayName = "NumberInput";

export { Input, PriceInput, NumberInput, inputVariants };