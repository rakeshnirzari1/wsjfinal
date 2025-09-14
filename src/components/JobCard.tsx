import React from 'react';
import { MapPin, Clock, DollarSign, Users, ExternalLink, Zap } from 'lucide-react';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
  onClick?: (job: Job) => void;
  onEdit?: (job: Job) => void;
  onDelete?: (jobId: string) => void;
  onToggleFilled?: (jobId: string, isFilled: boolean) => void;
  showActions?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  onClick, 
  onEdit, 
  onDelete, 
  onToggleFilled, 
  showActions = false 
}) => {
  const formatSalary = (salary?: { min: number; max: number; currency: string }) => {
    if (!salary) return null;
    const { min, max, currency } = salary;
    const symbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency;
    return `${symbol}${(min / 1000).toFixed(0)}k - ${symbol}${(max / 1000).toFixed(0)}k`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div 
      onClick={(e) => {
        // Prevent click if clicking on action buttons
        if (showActions && (e.target as HTMLElement).closest('button')) {
          return;
        }
        onClick?.(job);
      }}
      className={`bg-white rounded-lg border p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group relative ${
        job.featured ? 'border-blue-200 shadow-sm' : 'border-gray-200 hover:border-gray-300'
      } ${job.isFilled ? 'opacity-60' : ''}`}
    >
      {job.isFilled && (
        <div className="absolute -top-2 -left-2 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-medium">
          Filled
        </div>
      )}
      
      {job.featured && !job.isFilled && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
          Featured
        </div>
      )}
      
      {job.urgent && !job.isFilled && (
        <div className="absolute top-4 left-4 flex items-center bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
          <Zap className="h-3 w-3 mr-1" />
          Urgent
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          {job.companyLogo && (
            <img 
              src={job.companyLogo} 
              alt={job.company}
              className="h-12 w-12 rounded-lg object-cover"
            />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {job.title}
            </h3>
            <p className="text-gray-600 font-medium">{job.company}</p>
          </div>
        </div>
        {!showActions && (
          <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{job.location}</span>
          {job.remote && <span className="ml-1 text-green-600">(Remote)</span>}
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>{job.type}</span>
        </div>
        {job.salary && (
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>{formatSalary(job.salary)}</span>
          </div>
        )}
      </div>

      <p className="text-gray-700 mb-4 line-clamp-2">
        {job.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {job.tags.slice(0, 4).map((tag, index) => (
          <span 
            key={index}
            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
          >
            {tag}
          </span>
        ))}
        {job.tags.length > 4 && (
          <span className="text-gray-500 text-sm">+{job.tags.length - 4} more</span>
        )}
        {job.categories && job.categories.length > 0 && (
          <div className="w-full mt-2">
            <div className="flex flex-wrap gap-1">
              {job.categories.map((category, index) => (
                <span 
                  key={index}
                  className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-500">{formatDate(job.postedDate)}</span>
        {showActions ? (
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(job);
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFilled?.(job.id, !job.isFilled);
              }}
              className={
                'text-sm font-medium ' + 
                (job.isFilled 
                  ? 'text-green-600 hover:text-green-700' 
                  : 'text-orange-600 hover:text-orange-700')
              }
            >
              {job.isFilled ? 'Mark Open' : 'Mark Filled'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this job?')) {
                  onDelete?.(job.id);
                }
              }}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        ) : (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(job);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 opacity-100"
          >
            Apply Now
          </button>
        )}
      </div>
    </div>
  );
};