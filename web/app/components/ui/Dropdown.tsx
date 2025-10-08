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
        <div className="absolute right-0 mt-2 w-56 bg-default-component rounded-xl shadow-xl border border-default-border py-1 px-2 z-50">
          {children}
        </div>
      )}
    </div>
  );
}
