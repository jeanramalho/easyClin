import React from 'react';

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
      <div className="w-full max-w-lg rounded-2xl border shadow-2xl bg-surface-container-lowest border-outline-variant text-on-surface">
        <div className="px-6 py-4 border-b flex items-center justify-between border-outline-variant">
          <div className="flex items-center gap-2">
            {title && <h3 className="font-bold text-base">{title}</h3>}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-outline">close</span>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
