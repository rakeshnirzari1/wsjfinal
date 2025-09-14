import React from 'react';
import { Search, MapPin, Filter, X } from 'lucide-react';

interface JobFiltersProps {
  searchTerm: string;
  location: string;
  jobType: string;
  remote: boolean;
  onSearchChange: (term: string) => void;
  onLocationChange: (location: string) => void;
  onJobTypeChange: (type: string) => void;
  onRemoteChange: (remote: boolean) => void;
  onClearFilters: () => void;
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  searchTerm,
  location,
  jobType,
  remote,
  onSearchChange,
  onLocationChange,
  onJobTypeChange,
  onRemoteChange,
  onClearFilters
}) => {
  const hasActiveFilters = searchTerm || location || jobType || remote;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Location Input */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Location..."
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Job Type Select */}
        <select
          value={jobType}
          onChange={(e) => onJobTypeChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Types</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Contract">Contract</option>
          <option value="Internship">Internship</option>
        </select>

        {/* Remote Toggle */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={remote}
              onChange={(e) => onRemoteChange(e.target.checked)}
              className="sr-only"
            />
            <div className={`relative w-11 h-6 rounded-full transition-colors ${
              remote ? 'bg-blue-600' : 'bg-gray-200'
            }`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                remote ? 'transform translate-x-5' : ''
              }`} />
            </div>
            <span className="ml-3 text-sm text-gray-700">Remote Only</span>
          </label>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center text-gray-500 hover:text-red-600 transition-colors"
            >
              <X className="h-4 w-4 mr-1" />
              <span className="text-sm">Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};