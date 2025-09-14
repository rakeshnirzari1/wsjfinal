import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CompanyCard } from './CompanyCard';
import { Company } from '../types';
import { mockCompanies } from '../data/mockData';

interface CompaniesPageProps {
  onCompanyClick: (companyId: string) => void;
}

export const CompaniesPage: React.FC<CompaniesPageProps> = ({ onCompanyClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
    
    // Set page title and meta description
    document.title = 'Top Employers - Western Sydney Jobs';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Explore leading employers across Western Sydney offering great career opportunities. Find your next job with top companies.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Explore leading employers across Western Sydney offering great career opportunities. Find your next job with top companies.';
      document.head.appendChild(meta);
    }
    
    // Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'Top Employers - Western Sydney Jobs');
    
    return () => {
      document.title = 'Western Sydney Jobs - Find Your Dream Job in Western Sydney';
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Find your dream job in Western Sydney. Browse thousands of job opportunities from top employers across all industries.');
      }
    };
  }, []);

  // Fetch companies from database
  React.useEffect(() => {
    const fetchCompanies = async () => {
      try {
        // Check if Supabase is properly configured
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          console.warn('Supabase not configured, using mock data');
          setCompanies(mockCompanies);
        } else {
          try {
            // Get unique companies from jobs table
            const { data: jobsData, error } = await supabase
              .from('jobs')
              .select('employer_id, company_name, company_logo, company_website, created_at')
              .not('company_name', 'is', null);
            
            if (error) {
              console.error('Error fetching companies:', error);
              setCompanies(mockCompanies);
            } else {
              // Group by company and create company objects
              const companyMap = new Map();
              
              jobsData.forEach(job => {
                if (!companyMap.has(job.employer_id)) {
                  companyMap.set(job.employer_id, {
                    id: job.employer_id,
                    name: job.company_name,
                    logo: `https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=200&h=200`,
                    description: `Leading employer in Western Sydney offering great career opportunities.`,
                    website: job.company_website || '',
                    location: 'Western Sydney',
                    size: '51-200',
                    industry: 'Various',
                    jobs: []
                  });
                }
              });
              
              // Count jobs for each company
              const { data: jobCounts, error: countError } = await supabase
                .from('jobs')
                .select('employer_id, id')
                .eq('is_filled', false);
              
              if (!countError) {
                const jobCountMap = new Map();
                jobCounts.forEach(job => {
                  const count = jobCountMap.get(job.employer_id) || 0;
                  jobCountMap.set(job.employer_id, count + 1);
                });
                
                // Update job counts
                companyMap.forEach((company, employerId) => {
                  company.jobs = Array(jobCountMap.get(employerId) || 0).fill('').map((_, i) => `${employerId}-${i}`);
                });
              }
              
              setCompanies(Array.from(companyMap.values()));
            }
          } catch (fetchError) {
            console.error('Network error fetching companies:', fetchError);
            setCompanies(mockCompanies);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setCompanies(mockCompanies);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCompanyClick = (company: Company) => {
    onCompanyClick(company.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 px-4">
            Top
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 whitespace-nowrap">
              Employers
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore leading employers across Western Sydney offering great career opportunities
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading companies...</p>
          </div>
        ) : (
          <>
        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredCompanies.length} companies
          </p>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCompanies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onClick={handleCompanyClick}
            />
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-600">Try a different search term</p>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};