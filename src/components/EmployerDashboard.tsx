import React, { useState } from 'react';
import { ArrowLeft, Plus, Search, Filter } from 'lucide-react';
import { JobCard } from './JobCard';
import { Job } from '../types';
import { mockJobs } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface EmployerDashboardProps {
  onBack: () => void;
  onPostJob: () => void;
  onEditJob: (job: Job) => void;
}

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({ 
  onBack, 
  onPostJob, 
  onEditJob 
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'filled'>('all');
  const [userJobs, setUserJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user jobs from database
  React.useEffect(() => {
    const fetchUserJobs = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('employer_id', user.id);
        
        if (error) {
          console.error('Error fetching jobs:', error);
          // Fallback to mock data for demo
          setUserJobs(mockJobs.filter(job => job.employerId === user.id));
        } else {
          // Transform database data to match Job interface
          const transformedJobs = data.map(job => ({
            id: job.id,
            title: job.title,
            company: job.company_name,
            companyWebsite: job.company_website || '',
            location: job.location,
            type: job.job_type.replace('_', '-').replace(/\b\w/g, l => l.toUpperCase()) as 'Full-time' | 'Part-time' | 'Contract' | 'Internship',
            remote: job.is_remote,
            salary: job.salary_min && job.salary_max ? {
              min: job.salary_min,
              max: job.salary_max,
              currency: job.salary_currency || 'AUD'
            } : undefined,
            description: job.description,
            requirements: job.requirements || [],
            benefits: job.benefits || [],
            tags: job.tags || [],
            postedDate: job.created_at,
            featured: job.is_featured,
            urgent: false,
            applications: job.applications_count || 0,
            companyId: job.employer_id,
            contactEmail: job.contact_email || '',
            contactPhone: job.contact_phone || '',
            contactApplyUrl: job.apply_url || '',
            categories: job.categories || [],
            employerId: job.employer_id,
            isFilled: job.is_filled,
            slug: job.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          }));
          setUserJobs(transformedJobs);
        }
      } catch (error) {
        console.error('Error:', error);
        // Fallback to mock data
        setUserJobs(mockJobs.filter(job => job.employerId === user.id));
      } finally {
        setLoading(false);
      }
    };

    fetchUserJobs();
  }, [user]);

  const filteredJobs = userJobs.filter(job => {
    const matchesSearch = searchTerm === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !job.isFilled) ||
      (statusFilter === 'filled' && job.isFilled);

    return matchesSearch && matchesStatus;
  });

  const handleDeleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);
      
      if (error) {
        console.error('Error deleting job:', error);
      } else {
        // Update local state
        setUserJobs(prev => prev.filter(job => job.id !== jobId));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleToggleFilled = async (jobId: string, isFilled: boolean) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_filled: isFilled })
        .eq('id', jobId);
      
      if (error) {
        console.error('Error updating job:', error);
      } else {
        // Update local state
        setUserJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, isFilled } : job
        ));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const stats = {
    total: userJobs.length,
    active: userJobs.filter(job => !job.isFilled).length,
    filled: userJobs.filter(job => job.isFilled).length,
    totalApplications: userJobs.reduce((sum, job) => sum + job.applications, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={onBack}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your job postings and track applications</p>
          </div>
          
          <button
            onClick={onPostJob}
            className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Post New Job
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Jobs</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Active Jobs</h3>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Filled Positions</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.filled}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Applications</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalApplications}</p>
            <p className="text-xs text-gray-400 mt-1">Total Views</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search your jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'filled')}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Jobs</option>
              <option value="active">Active Jobs</option>
              <option value="filled">Filled Jobs</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredJobs.length} of {userJobs.length} jobs
          </p>
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                showActions={true}
                onEdit={onEditJob}
                onDelete={handleDeleteJob}
                onToggleFilled={handleToggleFilled}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No jobs found' : 'No jobs posted yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria' 
                : 'Start by posting your first job to attract top talent in Western Sydney'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <button
                onClick={onPostJob}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Post Your First Job
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};