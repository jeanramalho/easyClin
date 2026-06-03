import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, className = '', ...rest }, ref) => {
  const base = 'w-full px-3 py-2.5 border rounded-xl text-sm bg-surface-container border-outline-variant text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all';
  return (
    <div className="w-full">
      {label && <label className="block text-[10px] font-semibold text-outline uppercase tracking-wider mb-1">{label}</label>}
      <input ref={ref} className={`${base} ${className}`} {...rest} />
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
