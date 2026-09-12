"use client";

import { X, Plus } from "lucide-react";

interface AddItemListProps<T> {
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  addLabel: string;
  emptyLabel?: string;
}

export default function AddItemList<T>({
  items,
  onAdd,
  onRemove,
  renderItem,
  addLabel,
  emptyLabel,
}: AddItemListProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && emptyLabel && (
        <p className="text-sm text-gray-400 italic py-2">{emptyLabel}</p>
      )}
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1">{renderItem(item, i)}</div>
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="mt-2 w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium mt-1 w-fit"
      >
        <Plus size={15} />
        {addLabel}
      </button>
    </div>
  );
}
