import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { JobCard } from './JobCard';
import { JobFilters } from './JobFilters';
import { Job, WesternSydneyLocation } from '../types';
import { mockJobs, westernSydneyLocations } from '../data/mockData';
import { supabase } from '../lib/supabase';

export const LocationPage: React.FC = () => {
  const { locationSlug } = useParams<{ locationSlug: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [jobType, setJobType] = useState('');
  const [remote, setRemote] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Find the location data
  const locationData = westernSydneyLocations.find(loc => loc.slug === locationSlug);
  const locationName = locationData?.name;

  // Fetch jobs from database
  React.useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      if (!locationName) {
        setLoading(false);
        return;
      }
      
      try {
        // Check if Supabase is properly configured
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          console.warn('Supabase not configured, using mock data');
          setJobs(mockJobs.filter(job => job.location === locationName));
        } else {
          try {
            const { data, error } = await supabase
              .from('jobs')
              .select('*')
              .eq('is_filled', false)
              .eq('location', locationName)
              .gte('expires_at', new Date().toISOString());
            
            if (error) {
              console.error('Error fetching jobs:', error);
              // Fallback to mock data
              setJobs(mockJobs.filter(job => job.location === locationName));
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
                companyLogo: job.company_logo || `https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=100&h=100`
              }));
              setJobs(transformedJobs);
            }
          } catch (fetchError) {
            console.error('Network error fetching jobs:', fetchError);
            setJobs(mockJobs.filter(job => job.location === locationName));
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setJobs(mockJobs.filter(job => job.location === locationName));
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [locationName]);

  // Set page title and meta description
  React.useEffect(() => {
    if (locationData) {
      document.title = `Jobs in ${locationData.name} - Western Sydney Jobs`;
      // Scroll to top when component mounts
      window.scrollTo(0, 0);
      
      // Add meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `Find jobs in ${locationData.name}, Western Sydney. ${locationData.description}. Browse latest job opportunities from top employers.`);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = `Find jobs in ${locationData.name}, Western Sydney. ${locationData.description}. Browse latest job opportunities from top employers.`;
        document.head.appendChild(meta);
      }
      
      // Open Graph tags
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', `Jobs in ${locationData.name} - Western Sydney Jobs`);
      
      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', `Find jobs in ${locationData.name}, Western Sydney. ${locationData.description}. Browse latest job opportunities from top employers.`);
    }
    
    return () => {
      document.title = 'Western Sydney Jobs - Find Your Dream Job in Western Sydney';
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Find your dream job in Western Sydney. Browse thousands of job opportunities from top employers across all industries.');
      }
    };
  }, [locationData]);

  const filteredJobs = useMemo(() => {
    let filtered = jobs.filter(job => {
      const matchesSearch = searchTerm === '' || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = jobType === '' || job.type.toLowerCase() === jobType.toLowerCase();
      const matchesRemote = !remote || job.remote;

      return matchesSearch && matchesType && matchesRemote;
    });
    
    // Sort featured jobs first
    return filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [searchTerm, jobType, remote, jobs]);

  const handleJobClick = (job: Job) => {
    navigate(`/jobs/${job.slug}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setJobType('');
    setRemote(false);
  };

  if (!locationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Location Not Found</h2>
          <p className="text-gray-600 mb-6">The location you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading jobs in {locationData.name}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Jobs
        </button>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <MapPin className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 px-4">
              Jobs in
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 whitespace-nowrap">
                <span className="md:whitespace-nowrap whitespace-normal break-words">
                  {locationData.name}
                </span>
              </span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {locationData.description}
          </p>
        </div>

        {/* Filters */}
        <div id="job-filters">
        <JobFilters
          searchTerm={searchTerm}
          location=""
          jobType={jobType}
          remote={remote}
          onSearchChange={setSearchTerm}
          onLocationChange={() => {}} // Disabled for location pages
          onJobTypeChange={setJobType}
          onRemoteChange={setRemote}
          onClearFilters={clearFilters}
        />
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredJobs.length} jobs in {locationData.name}
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
              <MapPin className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found in {locationData.name}</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or check back later for new opportunities</p>
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