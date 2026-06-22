import React from 'react';
import Button from './Button';
import Card from './Card';

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/10 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg rounded-2xl shadow-2xl text-on-surface">
        <div className="px-6 py-4 border-b flex items-center justify-between border-outline-variant">
          <div className="flex items-center gap-2">
            {title && <h3 className="font-bold text-base">{title}</h3>}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="rounded-lg p-1 text-outline hover:bg-surface-container">
            <span className="material-symbols-outlined text-outline">close</span>
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </Card>
    </div>
  );
};

export default Modal;
