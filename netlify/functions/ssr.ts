import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fywznswzldmccircvzic.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5d3puc3d6bGRtY2NpcmN2emljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTUzNTYsImV4cCI6MjA3MjYzMTM1Nn0.xvHjkl1RIsYsfaPqkdrG2pi9SdwHt9PwM8oO_Y9Cu4A';

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock jobs data for fallback
const mockJobs = [
  {
    id: '1',
    title: 'Administration Officer',
    company: 'Parramatta City Council',
    companyLogo: 'https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
    location: 'Parramatta',
    description: 'We are looking for an Administration Officer to join our team and support various administrative functions.',
    slug: 'administration-officer-parramatta-city-council',
    categories: ['Administration']
  },
  {
    id: '2',
    title: 'Registered Nurse',
    company: 'Blacktown Hospital',
    companyLogo: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
    location: 'Blacktown',
    description: 'Join our healthcare team to provide quality patient care in a busy hospital environment.',
    slug: 'registered-nurse-blacktown-hospital',
    categories: ['Healthcare & Medical']
  }
];

export const handler: Handler = async (event, context) => {
  const path = event.path;
  
  // Extract job slug from URL
  const jobSlug = path.split('/jobs/')[1];
  
  if (!jobSlug) {
    // Return default page for non-job URLs
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=0, must-revalidate'
      },
      body: getDefaultHTML()
    };
  }

  try {
    // Try to fetch job from Supabase
    let job = null;
    
    try {
      // First try to find by exact slug match
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_filled', false);
      
      if (!error && jobs) {
        // Find job by matching slug
        const foundJob = jobs.find(j => {
          const jobSlugFromTitle = j.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          return jobSlugFromTitle === jobSlug;
        });
        
        if (foundJob) {
          job = {
            id: foundJob.id,
            title: foundJob.title,
            company: foundJob.company_name,
            companyLogo: foundJob.company_logo || 'https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
            location: foundJob.location,
            description: foundJob.description,
            slug: foundJob.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            categories: foundJob.categories || []
          };
        }
      }
    } catch (error) {
      console.warn('Supabase query failed, using mock data:', error);
    }

    // Fallback to mock data if Supabase fails
    if (!job) {
      job = mockJobs.find(j => j.slug === jobSlug) || mockJobs[0];
    }

    // Generate dynamic HTML with job-specific meta tags
    const html = generateJobHTML(job, event);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=300, must-revalidate'
      },
      body: html
    };
  } catch (error) {
    console.error('Error generating job page:', error);
    
    // Return default page on error
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=0, must-revalidate'
      },
      body: getDefaultHTML()
    };
  }
};

function generateJobHTML(job: any, event: any) {
  const baseUrl = `https://${event.headers.host}`;
  const jobUrl = `${baseUrl}/jobs/${job.slug}`;
  const jobTitle = `${job.title} at ${job.company} - Western Sydney Jobs`;
  const jobDescription = `${job.title} position at ${job.company} in ${job.location}. ${job.description.substring(0, 150)}...`;
  const jobImage = job.companyLogo || 'https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Primary Meta Tags -->
  <title>${jobTitle}</title>
  <meta name="title" content="${jobTitle}" />
  <meta name="description" content="${jobDescription}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${jobUrl}" />
  <meta property="og:title" content="${jobTitle}" />
  <meta property="og:description" content="${jobDescription}" />
  <meta property="og:image" content="${jobImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Western Sydney Jobs" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${jobUrl}" />
  <meta name="twitter:title" content="${jobTitle}" />
  <meta name="twitter:description" content="${jobDescription}" />
  <meta name="twitter:image" content="${jobImage}" />
  
  <!-- Additional Meta Tags -->
  <meta name="robots" content="index, follow" />
  <meta name="author" content="Western Sydney Jobs" />
  <meta name="keywords" content="${job.title}, ${job.company}, ${job.location}, jobs, western sydney, ${job.categories.join(', ')}" />
  
  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": "${job.title}",
    "description": "${job.description}",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "${job.company}",
      "logo": "${job.companyLogo}"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "${job.location}",
        "addressRegion": "NSW",
        "addressCountry": "AU"
      }
    },
    "datePosted": "${new Date().toISOString()}",
    "employmentType": "FULL_TIME",
    "workHours": "Full-time",
    "url": "${jobUrl}",
    "jobBenefits": "${job.categories.join(', ')}"
  }
  </script>
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  
  <!-- Preload critical resources -->
  <link rel="preload" href="/src/main.tsx" as="script" />
  
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #f9fafb;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 20px;
    }
    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 3px solid #e5e7eb;
      border-top: 3px solid #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .job-preview {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }
    .job-title {
      font-size: 24px;
      font-weight: bold;
      color: #111827;
      margin-bottom: 8px;
    }
    .job-company {
      font-size: 18px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .job-location {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 16px;
    }
    .job-description {
      font-size: 14px;
      color: #374151;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div id="root">
    <!-- Loading fallback -->
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p style="color: #6b7280; font-family: Arial, sans-serif;">Loading Western Sydney Jobs...</p>
      
      <!-- Job preview for social media -->
      <div class="job-preview">
        <div class="job-title">${job.title}</div>
        <div class="job-company">${job.company}</div>
        <div class="job-location">📍 ${job.location}</div>
        <div class="job-description">${job.description.substring(0, 200)}...</div>
      </div>
    </div>
  </div>
  
  <script>
    // Redirect to the actual React app
    window.location.href = '${jobUrl}';
  </script>
  
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
}

function getDefaultHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Western Sydney Jobs - Find Your Dream Job</title>
  <meta name="description" content="Discover thousands of job opportunities in Western Sydney. Explore top employers across all industries and kickstart your career today!" />
  <meta property="og:title" content="Western Sydney Jobs - Find Your Dream Job" />
  <meta property="og:description" content="Discover thousands of job opportunities in Western Sydney. Explore top employers across all industries and kickstart your career today!" />
  <meta property="og:image" content="https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
</head>
<body>
  <div id="root">
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 20px;">
      <div style="width: 48px; height: 48px; border: 3px solid #e5e7eb; border-top: 3px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
      <p style="color: #6b7280; font-family: Arial, sans-serif;">Loading Western Sydney Jobs...</p>
    </div>
  </div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
}
