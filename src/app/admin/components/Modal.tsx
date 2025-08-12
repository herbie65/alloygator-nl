"use client";
import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] flex flex-col relative">
        <div className="p-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold z-10"
            aria-label="Sluit"
          >
            &times;
          </button>
          {title && <h2 className="text-xl font-semibold pr-8">{title}</h2>}
        </div>
        <div className="p-6 pt-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal; 