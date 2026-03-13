import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses =
    "px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-[#0F9B7A] text-white hover:bg-[#0d8268] active:scale-95",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 active:scale-95",
    outline:
      "border-2 border-[#0F9B7A] text-[#0F9B7A] hover:bg-[#0F9B7A] hover:text-white active:scale-95",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
