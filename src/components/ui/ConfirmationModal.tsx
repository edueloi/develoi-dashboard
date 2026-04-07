import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false
}) => {
  const icons = {
    danger: <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />,
    warning: <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />,
    info: <AlertTriangle className="w-12 h-12 text-blue-500 mb-4" />
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className="flex justify-center">
          {icons[variant]}
        </div>
        <p className="text-slate-600 mb-8 leading-relaxed">
          {message}
        </p>
        <div className="flex flex-col gap-3">
          <Button 
            variant={variant === 'danger' ? 'danger' : 'primary'} 
            onClick={onConfirm}
            loading={loading}
            className="w-full"
          >
            {confirmLabel}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full"
          >
            {cancelLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
