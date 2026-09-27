import React from 'react';

export const SidebarLink = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      active
      ? 'bg-primary text-white shadow-md'
      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    {children}
  </button>
);

export const InputField = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="flex flex-col gap-1 mb-4">
    <label className="text-sm font-semibold text-gray-600">{label}</label>
    <input
      {...props}
      className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition"
    />
  </div>
);

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({ children, variant = 'primary', ...props }: ButtonProps) => (
  <button
    {...props}
    className={`px-4 py-2 rounded-md font-medium transition ${
      variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`}
  >
    {children}
  </button>
);
