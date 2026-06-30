// src/components/shared/FilterBar.tsx
import React from 'react';
import { X } from 'lucide-react';

interface FilterBarProps {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
  options: {
    categories?: string[];
    difficulties?: string[];
    topics?: string[];
    [key: string]: string[] | undefined;
  };
  className?: string;
}

export function FilterBar({ filters, onChange, options, className = '' }: FilterBarProps) {
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    onChange(newFilters);
  };

  const clearFilters = () => {
    const cleared = Object.keys(filters).reduce((acc, key) => ({ ...acc, [key]: '' }), {});
    onChange(cleared);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {options.categories && (
        <select
          value={filters.category || ''}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
        >
          <option value="">All Categories</option>
          {options.categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      )}

      {options.difficulties && (
        <select
          value={filters.difficulty || ''}
          onChange={(e) => handleFilterChange('difficulty', e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
        >
          <option value="">All Difficulties</option>
          {options.difficulties.map((diff) => (
            <option key={diff} value={diff.toLowerCase()}>{diff}</option>
          ))}
        </select>
      )}

      {options.topics && (
        <select
          value={filters.topic || ''}
          onChange={(e) => handleFilterChange('topic', e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
        >
          <option value="">All Topics</option>
          {options.topics.map((topic) => (
            <option key={topic} value={topic}>{topic}</option>
          ))}
        </select>
      )}

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-800 transition-colors"
        >
          <X className="w-4 h-4" />
          Clear Filters
        </button>
      )}
    </div>
  );
}