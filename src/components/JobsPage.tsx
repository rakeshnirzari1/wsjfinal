import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { JobCard } from './JobCard';
import { JobFilters } from './JobFilters';
import { Job } from '../types';
import { mockJobs } from '../data/mockData';
import { jobCategories, westernSydneyLocations } from '../data/mockData';
import { JobCategory } from '../types';

interface JobsPageProps {
  onJobClick: (jobSlug: string) => void;
  companyFilter?: string | null;
  categoryFilter?: JobCategory | null;
}

export const JobsPage: React.FC<JobsPageProps> = ({ onJobClick, companyFilter, categoryFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [remote, setRemote] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | null>(categoryFilter || null);

  // Fetch jobs from database
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        
        if (!isSupabaseConfigured) {
          console.warn('Supabase not configured, using mock data');
          setJobs(mockJobs);
        } else {
          try {
            const { data, error } = await supabase
              .from('jobs')
              .select('*')
              .eq('is_filled', false)
              .gte('expires_at', new Date().toISOString());
            
            if (error) {
              console.error('Error fetching jobs:', error);
              setJobs(mockJobs);
            } else {
              // Transform database data to match Job interface
              const transformedJobs = data.map(job => ({
                id: job.id,
                title: job.title,
                company: job.company_name,
                companyWebsite: job.company_website || '',
                location: job.location,
                type: job.job_type.replace('_', '-').replace(/\b\w/g, l => l.toUpperCase()) as 'Full-time' | 'Part-time' | 'Contract' | 'Internship',
                remote: job.is_remote || false,
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
                employerId: job.employer_id,
                isFilled: job.is_filled,
                slug: job.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                categories: job.categories || [],
                // Add company info for job detail page
                companyLogo: job.company_logo || `https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=100&h=100`
              }));
              setJobs(transformedJobs);
            }
          } catch (fetchError) {
            console.error('Network error fetching jobs:', fetchError);
            setJobs(mockJobs);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setJobs(mockJobs);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = searchTerm === '' || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesLocation = location === '' || 
        job.location.toLowerCase().includes(location.toLowerCase());
      
      const matchesType = jobType === '' || job.type.toLowerCase() === jobType.toLowerCase();
      const matchesRemote = !remote || job.remote;
      const matchesCompany = !companyFilter || job.companyId === companyFilter;
      const matchesCategory = !selectedCategory || job.categories.includes(selectedCategory);

      return matchesSearch && matchesLocation && matchesType && matchesRemote && matchesCompany && matchesCategory;
    });
  }, [searchTerm, location, jobType, remote, companyFilter, selectedCategory, jobs]);

  const handleJobClick = (job: Job) => {
    onJobClick(job.slug);
  };

  const navigate = useNavigate();

  const clearFilters = () => {
    setSearchTerm('');
    setLocation('');
    setJobType('');
    setRemote(false);
    setSelectedCategory(null);
  };

  const handleCategoryClick = (category: JobCategory) => {
    const categoryData = jobCategories.find(cat => cat.id === category);
    if (categoryData) {
      navigate(`/category/${categoryData.slug}`);
    }
  };

  const handleLocationClick = (location: string) => {
    const locationData = westernSydneyLocations.find(loc => loc.name === location);
    if (locationData) {
      navigate(`/location/${locationData.slug}`);
      // Scroll to job filters section after navigation
      setTimeout(() => {
        const filtersElement = document.getElementById('job-filters');
        if (filtersElement) {
          filtersElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Find Your Dream
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Job in Western Sydney
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover exciting career opportunities across Western Sydney's growing job market
          </p>
        </div>

        {/* Category Tiles */}
        {!companyFilter && !categoryFilter && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {jobCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-md"
                >
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <h3 className="font-semibold text-sm text-gray-900 mb-1">{category.name}</h3>
                  <p className="text-xs text-gray-600">{category.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Locations */}
        {!companyFilter && !categoryFilter && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Popular Locations</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {westernSydneyLocations.slice(0, 12).map((location) => (
                <button
                  key={location.slug}
                  onClick={() => handleLocationClick(location.name)}
                  className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-center"
                >
                  <h3 className="font-medium text-sm text-gray-900">{location.name}</h3>
                </button>
              ))}
            </div>
            <div className="text-center mt-4">
              <button
                onClick={() => navigate('/locations')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All Locations →
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div id="job-filters">
          <JobFilters
          searchTerm={searchTerm}
          location={location}
          jobType={jobType}
          remote={remote}
          onSearchChange={setSearchTerm}
          onLocationChange={setLocation}
          onJobTypeChange={setJobType}
          onRemoteChange={setRemote}
          onClearFilters={clearFilters}
          />
        </div>

        {/* Results */}
        <div className="mb-6">
          {companyFilter && (
            <p className="text-blue-600 mb-2">
              Showing jobs from {mockJobs.find(j => j.companyId === companyFilter)?.company}
            </p>
          )}
          {selectedCategory && (
            <p className="text-blue-600 mb-2">
              Category: {selectedCategory}
            </p>
          )}
          <p className="text-gray-600">
            Showing {filteredJobs.length} of {jobs.length} jobs
          </p>
        </div>

        {/* Job Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onClick={handleJobClick}
            />
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};