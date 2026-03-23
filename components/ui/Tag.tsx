import React from "react";

interface TagProps {
  children: React.ReactNode;
  variant?: "default" | "federal" | "provincial" | "municipal" | "urgent" | "new";
  className?: string;
}

export function Tag({ children, variant = "default", className = "" }: TagProps) {
  const baseClasses = "inline-block px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide";

  const variantClasses = {
    default: "bg-gray-100 text-gray-700",
    federal: "bg-red-100 text-red-800",
    provincial: "bg-blue-100 text-blue-800",
    municipal: "bg-green-100 text-green-800",
    urgent: "bg-amber-100 text-amber-800",
    new: "bg-teal-100 text-teal-800",
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
