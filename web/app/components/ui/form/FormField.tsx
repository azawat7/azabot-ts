"use client";

import React, { ReactNode, useState, useRef, useEffect } from "react";
import { HiChevronRight } from "react-icons/hi2";

interface FormFieldProps {
  label: string;
  description?: string;
  help?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({
  label,
  description,
  help,
  error,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-white font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {description && (
          <p className="text-neutral-400 text-sm mt-1">{description}</p>
        )}
      </label>
      {children}
      {help && !error && <p className="text-neutral-500 text-xs">{help}</p>}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  error?: string;
  isModified?: boolean;
}

export function TextInput({
  value,
  onChange,
  placeholder,
  maxLength,
  disabled = false,
  error,
  isModified = false,
}: TextInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      className={`w-full px-3 py-2 bg-zinc-800 border rounded-md text-white placeholder-neutral-500 transition-colors focus:outline-none ${
        error
          ? "border-red-500"
          : isModified
          ? "border-orange-500"
          : "border-zinc-600 hover:border-zinc-500"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    />
  );
}

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  error?: string;
  isModified?: boolean;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  error,
  isModified = false,
}: NumberInputProps) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={`w-full px-3 py-2 bg-zinc-800 border rounded-md text-white placeholder-neutral-500 transition-colors focus:outline-none ${
        error
          ? "border-red-500"
          : isModified
          ? "border-orange-500"
          : "border-zinc-600 hover:border-zinc-500"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    />
  );
}

interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  getDisplayText?: (value: string) => string;
  renderOption?: (value: string) => React.ReactNode;
  isModified?: boolean;
}

export function SelectInput({
  value,
  onChange,
  options,
  disabled = false,
  error,
  placeholder = "Select an option",
  getDisplayText,
  renderOption,
  isModified = false,
}: SelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableOptions = options.filter((option: string) => option !== value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-zinc-800 border rounded-md text-white transition-colors flex items-center justify-between focus:outline-none ${
          error
            ? "border-red-500"
            : isModified
            ? "border-orange-500"
            : "border-zinc-600 hover:border-zinc-500"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className={value ? "text-white" : "text-neutral-500"}>
          {value
            ? renderOption
              ? renderOption(value)
              : getDisplayText
              ? getDisplayText(value)
              : value
            : placeholder}
        </div>
        <HiChevronRight
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-90" : ""
          } ${disabled ? "text-neutral-500" : "text-neutral-400"}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {availableOptions.length > 0 ? (
            availableOptions.map((option: string) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full px-3 py-2 text-left text-white hover:bg-zinc-700 transition-colors first:rounded-t-md last:rounded-b-md focus:outline-none"
              >
                {renderOption
                  ? renderOption(option)
                  : getDisplayText
                  ? getDisplayText(option)
                  : option}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-neutral-500 text-sm">
              No other options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface BooleanInputProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  error?: string;
  isModified?: boolean;
}

export function BooleanInput({
  value,
  onChange,
  disabled = false,
  error,
  isModified = false,
}: BooleanInputProps) {
  return (
    <div className="flex items-center gap-3">
      <label
        className={`relative inline-flex items-center ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`w-11 h-6 bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700 ${
            disabled ? "opacity-50" : ""
          }`}
        />
      </label>
      {isModified && (
        <span className="text-orange-500 text-xs font-medium select-none">
          •
        </span>
      )}
    </div>
  );
}

interface TimeInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: "seconds" | "minutes" | "hours" | "days";
  disabled?: boolean;
  error?: string;
  isModified?: boolean;
}

export function TimeInput({
  value,
  onChange,
  min,
  max,
  unit = "seconds",
  disabled = false,
  error,
  isModified = false,
}: TimeInputProps) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-zinc-800 border rounded-md text-white placeholder-neutral-500 transition-colors focus:outline-none ${
          error
            ? "border-red-500"
            : isModified
            ? "border-orange-500"
            : "border-zinc-600 hover:border-zinc-500"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <span className="text-neutral-400 text-sm font-medium">{unit}</span>
      </div>
    </div>
  );
}
