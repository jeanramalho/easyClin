import React from 'react';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: string; // tailwind grid-cols string, e.g. 'grid-cols-1 md:grid-cols-3'
}

export const Grid: React.FC<GridProps> = ({ cols = 'grid-cols-1 md:grid-cols-3', className = '', children, ...rest }) => {
  return (
    <div className={`grid gap-6 ${cols} ${className}`} {...rest}>
      {children}
    </div>
  );
};

export default Grid;
