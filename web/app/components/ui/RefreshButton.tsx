"use client";

import { ButtonHTMLAttributes } from "react";
import { HiArrowPath } from "react-icons/hi2";

interface RefreshButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onRefresh: () => void;
  isRefreshing?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RefreshButton({
  onRefresh,
  isRefreshing = false,
  size = "md",
  className = "",
  ...props
}: RefreshButtonProps) {
  const sizeClasses = {
    sm: "w-8 h-8 aspect-square",
    md: "w-10 h-10 aspect-square",
    lg: "w-12 h-12 aspect-square",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className={`
        ${sizeClasses[size]}
        bg-zinc-900 hover:bg-zinc-800 
        border-1 border-zinc-700 hover:border-zinc-600
        rounded-xl
        flex items-center justify-center
        transition-all duration-200
        cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      <HiArrowPath
        className={`
          ${iconSizeClasses[size]}
          text-neutral-200
          ${isRefreshing ? "animate-spin" : ""}
        `}
      />
    </button>
  );
}
