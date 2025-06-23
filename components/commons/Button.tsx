// File: /components/commons/Button.tsx
import React from 'react';

interface ButtonProps {
  onClick: () => void | Promise<void>;
  disabled?: boolean;   // <- this must be included!
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onClick, disabled = false, children }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded text-white
        bg-blue-600 hover:bg-blue-700
        disabled:bg-gray-400 disabled:cursor-not-allowed
        transition-colors duration-200
      `}
    >
      {children}
    </button>
  );
};

export default Button;
