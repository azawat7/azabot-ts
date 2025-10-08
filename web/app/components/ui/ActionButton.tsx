"use client";

import { ButtonHTMLAttributes, ReactElement } from "react";
import { HiArrowPath } from "react-icons/hi2";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onAction: () => void;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
  icon?: ReactElement;
  loadingIcon?: ReactElement;
  text?: string;
  variant?: "icon" | "text" | "icon-text";
}

export function ActionButton({
  onAction,
  isLoading = false,
  size = "md",
  className = "",
  icon,
  loadingIcon,
  text,
  variant = "icon",
  ...props
}: ActionButtonProps) {
  const sizeClasses = {
    sm: variant === "icon" ? "w-8 h-8 aspect-square" : "px-3 py-1.5 h-8",
    md: variant === "icon" ? "w-10 h-10 aspect-square" : "px-4 py-2 h-10",
    lg: variant === "icon" ? "w-12 h-12 aspect-square" : "px-6 py-3 h-12",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <button
      onClick={onAction}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        bg-default-component hover:bg-hover-component 
        ${className.includes("border-") ? "" : "border-1"}
        rounded-xl
        flex items-center justify-center
        transition-all duration-200
        cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {isLoading && loadingIcon ? (
        <div className="flex items-center gap-2">
          {loadingIcon}
          {variant !== "icon" && text && (
            <span className={`${textSizeClasses[size]} text-primary-text`}>
              {text}
            </span>
          )}
        </div>
      ) : variant === "text" ? (
        <span
          className={`${textSizeClasses[size]} text-primary-text font-medium`}
        >
          {text}
        </span>
      ) : variant === "icon-text" ? (
        <div className="flex items-center gap-2">
          {icon && <div className={iconSizeClasses[size]}>{icon}</div>}
          {text && (
            <span
              className={`${textSizeClasses[size]} text-primary-text font-medium`}
            >
              {text}
            </span>
          )}
        </div>
      ) : icon ? (
        icon
      ) : (
        <HiArrowPath
          className={`
            ${iconSizeClasses[size]}
            text-primary-text
            ${isLoading ? "animate-spin" : ""}
          `}
        />
      )}
    </button>
  );
}
