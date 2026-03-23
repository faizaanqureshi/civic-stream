import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  const baseClasses =
    "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden";
  const clickableClasses = onClick
    ? "cursor-pointer hover:shadow-md transition-shadow duration-200"
    : "";

  return (
    <div
      className={`${baseClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
