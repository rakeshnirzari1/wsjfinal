import React, { useState, useEffect, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { JobsPage } from './components/JobsPage';
import { JobPage } from './components/JobPage';
import { CompaniesPage } from './components/CompaniesPage';
import { PricingPage } from './components/PricingPage';
import { JobPostForm } from './components/JobPostForm';
import { EmployerDashboard } from './components/EmployerDashboard';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { SuccessPage } from './components/SuccessPage';
import { PolicyPage } from './components/PolicyPage';
import { AdminPanel } from './components/AdminPanel';
import { LocationPage } from './components/LocationPage';
import { CategoryPage } from './components/CategoryPage';
import { LocationsPage } from './components/LocationsPage';
import { useAuth } from './hooks/useAuth';
import { Job, JobCategory } from './types';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
          <h1>Something went wrong</h1>
          <p>There was an error loading the page. Please refresh and try again.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface AppContentProps {
  onAppReady?: () => void;
}

function AppContent({ onAppReady }: AppContentProps) {
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<JobCategory | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  
  const { loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Set initial loading to false after auth is loaded
  useEffect(() => {
    if (!authLoading) {
      setAppLoading(false);
      // Notify that the app is ready
      if (onAppReady) {
        setTimeout(onAppReady, 100); // Small delay to ensure DOM is ready
      }
    }
  }, [authLoading, onAppReady]);

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (appLoading) {
        console.warn('Loading timeout reached, forcing app to load');
        setAppLoading(false);
        if (onAppReady) {
          onAppReady();
        }
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [appLoading, onAppReady]);

  const handlePageChange = (page: string, filterData?: any) => {
    try {
      if (page === 'post' && !isAuthenticated) {
        setShowLogin(true);
        return;
      }

      if (page === 'dashboard' && !isAuthenticated) {
        setShowLogin(true);
        return;
      }

      setEditingJob(null);
      
      // Handle company filter
      if (filterData?.companyId) {
        setCompanyFilter(filterData.companyId);
        navigate('/');
      } else {
        setCompanyFilter(null);
      }
      
      setCategoryFilter(null);
      window.scrollTo(0, 0);

      // Navigate to appropriate route
      switch (page) {
        case 'jobs':
          navigate('/');
          break;
        case 'companies':
          navigate('/companies');
          break;
        case 'pricing':
          navigate('/pricing');
          break;
        case 'post':
          navigate('/post');
          break;
        case 'dashboard':
          navigate('/dashboard');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      console.error('Error in handlePageChange:', error);
    }
  };

  // Get current page from URL
  const getCurrentPage = () => {
    try {
      const path = location.pathname;
      if (path === '/') return 'jobs';
      if (path === '/companies') return 'companies';
      if (path === '/pricing') return 'pricing';
      if (path === '/post') return 'post';
      if (path === '/dashboard') return 'dashboard';
      if (path === '/admin') return 'admin';
      if (path.startsWith('/jobs/')) return 'job-detail';
      if (path.match(/^\/(privacy|terms|cookies)$/)) return 'policy';
      return 'jobs';
    } catch (error) {
      console.error('Error getting current page:', error);
      return 'jobs';
    }
  };

  const currentPage = getCurrentPage();

  useEffect(() => {
    try {
      // Check URL parameters for success/cancel
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        setShowSuccess(true);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (urlParams.get('canceled') === 'true') {
        // Handle canceled payment if needed
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Error checking URL parameters:', error);
    }
  }, []);

  // Redirect after login
  useEffect(() => {
    try {
      if (isAuthenticated && (showLogin || showSignup)) {
        setShowLogin(false);
        setShowSignup(false);
        // Redirect to post job page if they were trying to post
        if (currentPage === 'post') {
          navigate('/post');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error in login redirect:', error);
    }
  }, [isAuthenticated, showLogin, showSignup, currentPage, navigate]);

  if (authLoading || appLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Western Sydney Jobs...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          currentPage="success"
          onPageChange={handlePageChange}
          onShowLogin={() => setShowLogin(true)}
          onShowSignup={() => setShowSignup(true)}
        />
        <SuccessPage onBack={() => {
          setShowSuccess(false);
          navigate('/');
        }} />
        <Footer onPageChange={handlePageChange} />
      </div>
    );
  }

  if (showLogin) {
    return (
      <LoginPage
        onBack={() => setShowLogin(false)}
        onSwitchToSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
      />
    );
  }

  if (showSignup) {
    return (
      <SignupPage
        onBack={() => setShowSignup(false)}
        onSwitchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />
    );
  }

  const handleJobClick = (jobSlug: string) => {
    try {
      navigate(`/jobs/${jobSlug}`);
    } catch (error) {
      console.error('Error navigating to job:', error);
    }
  };

  const handleCompanyClick = (companyId: string) => {
    try {
      handlePageChange('jobs', { companyId });
    } catch (error) {
      console.error('Error handling company click:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onShowLogin={() => setShowLogin(true)}
        onShowSignup={() => setShowSignup(true)}
      />
      
      <Routes>
        <Route 
          path="/" 
          element={
            <JobsPage 
              onJobClick={handleJobClick}
              companyFilter={companyFilter}
              categoryFilter={categoryFilter}
            />
          } 
        />
        <Route 
          path="/companies" 
          element={<CompaniesPage onCompanyClick={handleCompanyClick} />} 
        />
        <Route 
          path="/pricing" 
          element={
            <PricingPage
              onBack={() => navigate('/')}
              onSelectPlan={(planId: string) => {
                if (planId === 'basic') {
                  navigate('/post');
                } else {
                  navigate('/post');
                }
              }}
            />
          } 
        />
        <Route 
          path="/post" 
          element={
            <JobPostForm
              onBack={() => {
                if (editingJob) {
                  setEditingJob(null);
                  navigate('/dashboard');
                } else {
                  navigate('/');
                }
              }}
              onShowLogin={() => setShowLogin(true)}
              onSuccess={() => {
                if (editingJob) {
                  setEditingJob(null);
                  navigate('/dashboard');
                } else {
                  setShowSuccess(true);
                }
              }}
              editingJob={editingJob}
            />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <EmployerDashboard
              onBack={() => navigate('/')}
              onPostJob={() => {
                setEditingJob(null);
                navigate('/post');
              }}
              onEditJob={(job: Job) => {
                setEditingJob(job);
                navigate('/post');
              }}
            />
          } 
        />
        <Route 
          path="/admin" 
          element={
            <AdminPanel
              onBack={() => navigate('/')}
            />
          } 
        />
        <Route path="/jobs/:slug" element={<JobPage />} />
        <Route path="/privacy" element={<PolicyPage />} />
        <Route path="/terms" element={<PolicyPage />} />
        <Route path="/cookies" element={<PolicyPage />} />
        <Route path="/login" element={
          <LoginPage
            onBack={() => navigate('/')}
            onSwitchToSignup={() => {
              navigate('/');
              setShowSignup(true);
            }}
          />
        } />
        <Route path="/location/:locationSlug" element={<LocationPage />} />
        <Route path="/category/:categorySlug" element={<CategoryPage />} />
        <Route path="/locations" element={<LocationsPage />} />
      </Routes>
      
      <Footer onPageChange={handlePageChange} />
    </div>
  );
}

interface AppProps {
  onAppReady?: () => void;
}

function App({ onAppReady }: AppProps) {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent onAppReady={onAppReady} />
      </Router>
    </ErrorBoundary>
  );
}

export default App;