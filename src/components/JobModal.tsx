import React from 'react';
import { X, MapPin, Clock, DollarSign, Users, ExternalLink, Building, Calendar, Zap } from 'lucide-react';
import { Job } from '../types';

interface JobModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

export const JobModal: React.FC<JobModalProps> = ({ job, isOpen, onClose }) => {
  if (!isOpen || !job) return null;

  const formatSalary = (salary?: { min: number; max: number; currency: string }) => {
    if (!salary) return 'Salary not specified';
    const { min, max, currency } = salary;
    const symbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency;
    return `${symbol}${(min / 1000).toFixed(0)}k - ${symbol}${(max / 1000).toFixed(0)}k per year`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              {job.companyLogo && (
                <img 
                  src={job.companyLogo} 
                  alt={job.company}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
                <p className="text-lg text-gray-600 font-medium">{job.company}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Posted {formatDate(job.postedDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{job.applications} applicants</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {job.featured && (
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Featured
                </span>
              )}
              {job.urgent && (
                <span className="flex items-center bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                  <Zap className="h-3 w-3 mr-1" />
                  Urgent
                </span>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-700">
                  {job.location}
                  {job.remote && <span className="ml-2 text-green-600 font-medium">(Remote)</span>}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-700">{job.type}</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-700">{formatSalary(job.salary)}</span>
              </div>
            </div>

            <div className="flex items-start">
              <Building className="h-5 w-5 text-gray-400 mr-3 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Company</h4>
                <p className="text-gray-700">{job.company}</p>
                <button className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mt-1">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Company Profile
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills & Technologies</h3>
            <div className="flex flex-wrap gap-2">
              {job.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
            <p className="text-gray-700 leading-relaxed">{job.description}</p>
          </div>

          {/* Requirements */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
            <ul className="space-y-2">
              {job.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                  <span className="text-gray-700">{requirement}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
            <ul className="space-y-2">
              {job.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Apply Button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 transition-colors">
              Apply for this position
            </button>
            <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-md font-medium hover:bg-gray-50 transition-colors">
              Save Job
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};