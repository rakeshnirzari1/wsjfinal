import React from 'react';
import { MapPin, Users, ExternalLink, Briefcase } from 'lucide-react';
import { Company } from '../types';

interface CompanyCardProps {
  company: Company;
  onClick: (company: Company) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company, onClick }) => {
  return (
    <div 
      onClick={() => onClick(company)}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          {company.logo && (
            <img 
              src={company.logo} 
              alt={company.name}
              className="h-16 w-16 rounded-lg object-cover"
            />
          )}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {company.name}
            </h3>
            <p className="text-gray-600">{company.industry}</p>
          </div>
        </div>
        <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>

      <p className="text-gray-700 mb-4 line-clamp-2">
        {company.description}
      </p>

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{company.location}</span>
        </div>
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-1" />
          <span>{company.size} employees</span>
        </div>
        <div className="flex items-center">
          <Briefcase className="h-4 w-4 mr-1" />
          <span>{company.jobs.length} open positions</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button className="text-blue-600 hover:text-blue-700 font-medium">
          View Jobs
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100">
          Visit Website
        </button>
      </div>
    </div>
  );
};