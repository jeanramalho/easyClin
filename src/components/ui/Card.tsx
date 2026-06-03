import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

export const Card: React.FC<CardProps> = ({ as: Component = 'div', className = '', children, ...rest }) => {
  return (
    <Component className={`rounded-xl border overflow-hidden shadow-sm bg-surface-container-lowest border-outline-variant ${className}`} {...rest}>
      {children}
    </Component>
  );
};

export default Card;
