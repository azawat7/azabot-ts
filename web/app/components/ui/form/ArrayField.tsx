"use client";

import { HiPlus } from "react-icons/hi2";

interface ArrayFieldProps<T> {
  label: string;
  description?: string;
  help?: string;
  error?: string;
  value: T[];
  onChange: (value: T[]) => void;
  renderItem: (
    item: T,
    index: number,
    onChange: (item: T) => void,
    onRemove: () => void
  ) => React.ReactNode;
  renderItemHeaders?: () => React.ReactNode;
  createNewItem: () => T;
  maxItems?: number;
  disabled?: boolean;
}

export function ArrayField<T>({
  label,
  description,
  help,
  error,
  value,
  onChange,
  renderItem,
  renderItemHeaders,
  createNewItem,
  maxItems,
  disabled = false,
}: ArrayFieldProps<T>) {
  const addItem = () => {
    if (maxItems && value.length >= maxItems) return;
    onChange([...value, createNewItem()]);
  };

  const removeItem = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const updateItem = (index: number, item: T) => {
    const newValue = [...value];
    newValue[index] = item;
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      {(label || description) && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {label && <label className="text-white font-medium">{label}</label>}
            {description && (
              <p className="text-neutral-400 text-sm mt-1">{description}</p>
            )}
          </div>
        </div>
      )}

      {value.length > 0 && (
        <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-lg p-4 space-y-3">
          {renderItemHeaders && (
            <div className="pb-3 border-b border-neutral-800/30">
              {renderItemHeaders()}
            </div>
          )}

          <div className="space-y-2">
            {value.map((item, index) => (
              <div key={index}>
                {renderItem(
                  item,
                  index,
                  (newItem) => updateItem(index, newItem),
                  () => removeItem(index)
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2 border-t border-neutral-800/30">
            <button
              onClick={addItem}
              disabled={
                disabled || (maxItems ? value.length >= maxItems : false)
              }
              className="flex items-center gap-2 px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-sky-500/20 hover:border-sky-500/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sky-500/10 disabled:hover:text-sky-400 disabled:hover:border-sky-500/20 cursor-pointer"
              title="Add new item"
            >
              <HiPlus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Item</span>
            </button>
          </div>
        </div>
      )}

      {value.length === 0 && (
        <div className="text-center py-4 bg-neutral-900/50 border border-neutral-800/50 rounded-lg">
          <p className="text-sm text-neutral-400">No items added yet</p>
          <p className="text-xs mt-1 text-neutral-500">
            Click "Add Item" to get started
          </p>
          <div className="mt-4">
            <button
              onClick={addItem}
              disabled={
                disabled || (maxItems ? value.length >= maxItems : false)
              }
              className="flex items-center gap-2 px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-sky-500/20 hover:border-sky-500/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sky-500/10 disabled:hover:text-sky-400 disabled:hover:border-sky-500/20 mx-auto cursor-pointer"
              title="Add new item"
            >
              <HiPlus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Item</span>
            </button>
          </div>
        </div>
      )}

      {help && !error && label && (
        <p className="text-neutral-500 text-xs">{help}</p>
      )}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
