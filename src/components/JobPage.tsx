import React, { useState } from 'react';
import { ArrowLeft, MapPin, Clock, DollarSign, Users, Building, Calendar, Zap, Mail, Phone, ExternalLink, Share2, Twitter, Facebook, Linkedin } from 'lucide-react';
import { Job } from '../types';
import { supabase } from '../lib/supabase';
import { mockJobs } from '../data/mockData';
import { useParams, useNavigate } from 'react-router-dom';

export const JobPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch jobs from database
  React.useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('is_filled', false);
        
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
            companyLogo: job.company_logo || `https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=100&h=100`,
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
            categories: job.categories || []
          }));
          setJobs(transformedJobs);
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

const ApplyModal: React.FC<{ job: Job; isOpen: boolean; onClose: () => void }> = ({ job, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleContactClick = (type: 'email' | 'phone' | 'url') => {
    if (type === 'email' && job.contactEmail) {
      window.location.href = `mailto:${job.contactEmail}`;
    } else if (type === 'phone' && job.contactPhone) {
      window.location.href = `tel:${job.contactPhone}`;
    } else if (type === 'url' && job.contactApplyUrl) {
      window.open(job.contactApplyUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Apply for {job.title}</h3>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            Contact the employer directly to apply for this position:
          </p>
          
          <div className="space-y-3">
          {job.contactEmail && (
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-blue-600">{job.contactEmail}</p>
              </div>
            </div>
          )}
          
          {job.contactPhone && (
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <Phone className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Phone</p>
                <p className="text-green-600">{job.contactPhone}</p>
              </div>
            </div>
          )}
          
          {job.contactApplyUrl && (
            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <ExternalLink className="h-5 w-5 text-purple-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Apply Online</p>
                <p className="text-purple-600 break-all">{job.contactApplyUrl}</p>
              </div>
            </div>
          )}
          </div>
        </div>
        
        <div className="space-y-3 mt-6">
          {job.contactEmail && (
            <button
              onClick={() => handleContactClick('email')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </button>
          )}
          
          {job.contactPhone && (
            <button
              onClick={() => handleContactClick('phone')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Now
            </button>
          )}
          
          {job.contactApplyUrl && (
            <button
              onClick={() => handleContactClick('url')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md font-medium hover:bg-purple-700 transition-colors flex items-center justify-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Apply Online
            </button>
          )}
          
          <button
            onClick={onClose}
            className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

  const [showApplyModal, setShowApplyModal] = useState(false);
  
  const job = jobs.find(j => j.slug === slug);

  // Track job view when job loads
  React.useEffect(() => {
    const trackView = async () => {
      if (job && job.id) {
        try {
          // Call the increment function
          const { error } = await supabase.rpc('increment_job_views', {
            job_id: job.id
          });
          
          if (error) {
            console.error('Error tracking job view:', error);
          }
        } catch (error) {
          console.error('Error tracking job view:', error);
        }
      }
    };

    trackView();
  }, [job]);

  // Set page title for SEO
  React.useEffect(() => {
    if (job) {
      const jobTitle = `${job.title} at ${job.company} - Western Sydney Jobs`;
      const jobDescription = `${job.title} position at ${job.company} in ${job.location}. ${job.description.substring(0, 150)}...`;
      const jobImage = job.companyLogo || 'https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630';
      const jobUrl = window.location.href;
      
      document.title = jobTitle;
      
      // Update meta description
      let metaDescription = document.getElementById('meta-description') as HTMLMetaElement;
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        metaDescription.setAttribute('id', 'meta-description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', jobDescription);
      
      // Update Open Graph tags
      let ogTitle = document.getElementById('og-title') as HTMLMetaElement;
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        ogTitle.setAttribute('id', 'og-title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', jobTitle);
      
      let ogDescription = document.getElementById('og-description') as HTMLMetaElement;
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        ogDescription.setAttribute('id', 'og-description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', jobDescription);
      
      let ogImage = document.getElementById('og-image') as HTMLMetaElement;
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        ogImage.setAttribute('id', 'og-image');
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute('content', jobImage);
      
      let ogUrl = document.getElementById('og-url') as HTMLMetaElement;
      if (!ogUrl) {
        ogUrl = document.createElement('meta');
        ogUrl.setAttribute('property', 'og:url');
        ogUrl.setAttribute('id', 'og-url');
        document.head.appendChild(ogUrl);
      }
      ogUrl.setAttribute('content', jobUrl);
      
      // Twitter Card tags
      let twitterTitle = document.getElementById('twitter-title') as HTMLMetaElement;
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta');
        twitterTitle.setAttribute('name', 'twitter:title');
        twitterTitle.setAttribute('id', 'twitter-title');
        document.head.appendChild(twitterTitle);
      }
      twitterTitle.setAttribute('content', jobTitle);
      
      let twitterDescription = document.getElementById('twitter-description') as HTMLMetaElement;
      if (!twitterDescription) {
        twitterDescription = document.createElement('meta');
        twitterDescription.setAttribute('name', 'twitter:description');
        twitterDescription.setAttribute('id', 'twitter-description');
        document.head.appendChild(twitterDescription);
      }
      twitterDescription.setAttribute('content', jobDescription);
      
      let twitterImage = document.getElementById('twitter-image') as HTMLMetaElement;
      if (!twitterImage) {
        twitterImage = document.createElement('meta');
        twitterImage.setAttribute('name', 'twitter:image');
        twitterImage.setAttribute('id', 'twitter-image');
        document.head.appendChild(twitterImage);
      }
      twitterImage.setAttribute('content', jobImage);
      
      // Scroll to top when job loads
      window.scrollTo(0, 0);
    }
    return () => {
      document.title = 'Western Sydney Jobs - Find Your Dream Job in Western Sydney';
      // Reset meta tags
      const metaDescription = document.getElementById('meta-description') as HTMLMetaElement;
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Discover thousands of job opportunities in Western Sydney. Explore top employers across all industries and kickstart your career today!');
      }
      
      const ogTitle = document.getElementById('og-title') as HTMLMetaElement;
      if (ogTitle) {
        ogTitle.setAttribute('content', 'Western Sydney Jobs - Find Your Dream Job');
      }
      
      const ogDescription = document.getElementById('og-description') as HTMLMetaElement;
      if (ogDescription) {
        ogDescription.setAttribute('content', 'Discover thousands of job opportunities in Western Sydney. Explore top employers across all industries and kickstart your career today!');
      }
      
      const ogImage = document.getElementById('og-image') as HTMLMetaElement;
      if (ogImage) {
        ogImage.setAttribute('content', 'https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630');
      }
      
      const ogUrl = document.getElementById('og-url') as HTMLMetaElement;
      if (ogUrl) {
        ogUrl.setAttribute('content', 'https://westernsydneyjobs.com.au');
      }
      
      const twitterTitle = document.getElementById('twitter-title') as HTMLMetaElement;
      if (twitterTitle) {
        twitterTitle.setAttribute('content', 'Western Sydney Jobs - Find Your Dream Job');
      }
      
      const twitterDescription = document.getElementById('twitter-description') as HTMLMetaElement;
      if (twitterDescription) {
        twitterDescription.setAttribute('content', 'Discover thousands of job opportunities in Western Sydney. Explore top employers across all industries and kickstart your career today!');
      }
      
      const twitterImage = document.getElementById('twitter-image') as HTMLMetaElement;
      if (twitterImage) {
        twitterImage.setAttribute('content', 'https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630');
      }
    };
  }, [job]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist.</p>
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

  const formatSalary = (salary?: { min: number; max: number; currency: string }) => {
    if (!salary) return 'Salary not specified';
    const { min, max, currency } = salary;
    const symbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'AUD' ? 'A$' : currency;
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

  const handleVisitWebsite = () => {
    if (job.companyWebsite) {
      window.open(job.companyWebsite, '_blank');
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = `${job.title} at ${job.company} - Western Sydney Jobs`;
    const description = `Check out this ${job.title} position at ${job.company} in ${job.location}. ${job.description.substring(0, 100)}...`;
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title + ' ' + url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </button>

        {/* Job Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="flex items-center space-x-4 mb-6 md:mb-0">
              {job.companyLogo && (
                <img 
                  src={job.companyLogo} 
                  alt={job.company}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <p className="text-xl text-gray-600 font-medium">{job.company}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Posted {formatDate(job.postedDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{job.applications} views</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              {job.featured && (
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium text-center">
                  Featured Job
                </span>
              )}
              {job.urgent && (
                <span className="flex items-center justify-center bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-medium">
                  <Zap className="h-3 w-3 mr-1" />
                  Urgent
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{job.company}</span>
                </div>
              </div>
            </div>

            {/* Skills & Technologies */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills & Technologies</h2>
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits</h2>
              <ul className="space-y-2">
                {job.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply for this job</h3>
              
              <div className="space-y-4 mb-6">
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900 mb-1">Salary Range</p>
                  <p>{formatSalary(job.salary)}</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900 mb-1">Job Type</p>
                  <p>{job.type}</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900 mb-1">Category</p>
                  <p>{job.categories?.join(', ') || 'Not specified'}</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900 mb-1">Location</p>
                  <p>{job.location} {job.remote && '(Remote)'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  Apply Now
                </button>
                
                {job.companyWebsite && (
                  <button
                    onClick={handleVisitWebsite}
                    className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </button>
                )}
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About {job.company}</h3>
              <div className="flex items-center space-x-3 mb-4">
                {job.companyLogo && (
                  <img 
                    src={job.companyLogo} 
                    alt={job.company}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{job.company}</p>
                  {job.companyWebsite && (
                    <button
                      onClick={handleVisitWebsite}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Visit Website
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Share Job */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Share2 className="h-5 w-5 mr-2" />
                Share this job
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleShare('twitter')}
                  className="flex items-center justify-center p-3 border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <Twitter className="h-4 w-4 mr-2 text-blue-400" />
                  <span className="text-sm">Twitter</span>
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="flex items-center justify-center p-3 border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="text-sm">Facebook</span>
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="flex items-center justify-center p-3 border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
                  <span className="text-sm">LinkedIn</span>
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="flex items-center justify-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-sm">Copy Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>

          {/* Apply Modal */}
          <ApplyModal
            job={job}
            isOpen={showApplyModal}
            onClose={() => setShowApplyModal(false)}
          />
        </div>
      </div>
  );
};