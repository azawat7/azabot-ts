"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function Dropdown({
  trigger,
  children,
  className = "",
  isOpen: externalIsOpen,
  onToggle,
}: DropdownProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        if (externalIsOpen === undefined) {
          setInternalIsOpen(false);
        } else if (onToggle) {
          onToggle();
        }
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, externalIsOpen, onToggle]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div>{trigger}</div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-zinc-800 rounded-xl shadow-xl border border-zinc-600 py-2 px-2 z-50 backdrop-blur-sm">
          {children}
        </div>
      )}
    </div>
  );
}
