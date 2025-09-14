import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Check, Loader2, Save, Upload, X } from 'lucide-react';
import { stripeProducts, StripeProduct } from '../stripe-config';
import { pricingPlans } from '../data/mockData';
import { createCheckoutSession } from '../services/stripe';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { JobFormData, JobCategory } from '../types';

interface JobPostFormProps {
  onBack: () => void;
  onShowLogin: () => void;
  onSuccess: () => void;
  editingJob?: any; // Job data when editing
}

export const JobPostForm: React.FC<JobPostFormProps> = ({ 
  onBack, 
  onShowLogin, 
  onSuccess, 
  editingJob 
}) => {
  const [step, setStep] = useState<'details' | 'pricing' | 'payment'>('details');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(editingJob?.companyLogo || null);
  const [hasAttemptedPayment, setHasAttemptedPayment] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState<JobFormData>({
    title: editingJob?.title || '',
    company: editingJob?.company || '',
    companyWebsite: editingJob?.companyWebsite || '',
    location: editingJob?.location || '',
    type: editingJob?.job_type ? (editingJob.job_type.replace('_', '-').replace(/\b\w/g, l => l.toUpperCase()) as 'Full-time' | 'Part-time' | 'Contract' | 'Internship') : 'Full-time',
    remote: editingJob?.remote || false,
    salaryMin: editingJob?.salary?.min?.toString() || '',
    salaryMax: editingJob?.salary?.max?.toString() || '',
    currency: editingJob?.salary?.currency || 'AUD',
    description: editingJob?.description || '',
    requirements: editingJob?.requirements ? editingJob.requirements.join('\n') : '',
    benefits: editingJob?.benefits ? editingJob.benefits.join('\n') : '',
    tags: editingJob?.tags ? editingJob.tags.join(', ') : '',
    contactEmail: editingJob?.contactEmail || '',
    contactPhone: editingJob?.contactPhone || '',
    contactApplyUrl: editingJob?.contactApplyUrl || '',
    jobType: 'free',
    categories: editingJob?.categories || []
  });

  // Reset payment attempt flag when step changes
  React.useEffect(() => {
    if (step !== 'payment') {
      setHasAttemptedPayment(false);
    }
  }, [step]);

  // Check for canceled payment on component mount
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('canceled') === 'true') {
      setHasAttemptedPayment(true);
      setStep('pricing');
      setMessage({ type: 'error', text: 'Payment was canceled. You can choose the free option or try again.' });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleInputChange = (field: keyof JobFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (category: JobCategory, checked: boolean) => {
    setFormData(prev => {
      const categories = checked 
        ? [...prev.categories, category].slice(0, 3) // Max 3 categories
        : prev.categories.filter(c => c !== category);
      return { ...prev, categories };
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage({ type: 'error', text: 'Logo file size must be less than 5MB' });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please upload an image file' });
        return;
      }
      
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleNextStep = () => {
    if (step === 'details') {
      // Validate required fields
      if (!formData.title || !formData.company || !formData.location || !formData.description || formData.categories.length === 0) {
        setMessage({ type: 'error', text: 'Please fill in all required fields and select at least one category.' });
        return;
      }
      
      if (editingJob) {
        // If editing, save directly without payment
        handleSaveJob();
      } else {
        setStep('pricing');
      }
    } else if (step === 'pricing' && selectedPlan) {
      if (selectedPlan.id === 'basic') {
        // Free job, save directly
        setFormData(prev => ({ ...prev, jobType: 'free' }));
        handleSaveJob();
      } else {
        setFormData(prev => ({ ...prev, jobType: 'featured' }));
        setStep('payment');
      }
    }
  };

  const handleSaveJob = async () => {
    if (!isAuthenticated || !user) {
      setMessage({ type: 'error', text: 'Please sign in to post a job.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      console.log('Saving job:', formData);
      
      // First, ensure employer record exists
      const { data: existingEmployer, error: employerCheckError } = await supabase
        .from('employers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (employerCheckError) {
        throw new Error(`Error checking employer: ${employerCheckError.message}`);
      }

      let logoUrl = logoPreview;
      
      // Upload logo if a new file was selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(fileName, logoFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('Logo upload error:', uploadError);
          setMessage({ type: 'error', text: 'Failed to upload logo. Please try again.' });
          return;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('company-logos')
          .getPublicUrl(fileName);
        
        logoUrl = publicUrl;
      }

      // If employer doesn't exist, create one
      if (!existingEmployer) {
        const { error: employerCreateError } = await supabase
          .from('employers')
          .insert([{
            id: user.id,
            email: user.email || formData.contactEmail,
            company_name: formData.company,
            company_logo: logoUrl,
            contact_person: user.user_metadata?.full_name || 'Unknown',
            phone: formData.contactPhone || null
          }]);

        if (employerCreateError) {
          throw new Error(`Error creating employer: ${employerCreateError.message}`);
        }
      } else if (logoUrl && logoUrl !== editingJob?.companyLogo) {
        // Update employer logo if changed
        const { error: updateEmployerError } = await supabase
          .from('employers')
          .update({ company_logo: logoUrl })
          .eq('id', user.id);
        
        if (updateEmployerError) {
          console.error('Error updating employer logo:', updateEmployerError);
        }
      }
      
      // Parse array fields
      const requirements = formData.requirements
        .split('\n')
        .map(req => req.trim())
        .filter(req => req.length > 0);
      
      const benefits = formData.benefits
        .split('\n')
        .map(benefit => benefit.trim())
        .filter(benefit => benefit.length > 0);
      
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Prepare job data for database
      const jobData = {
        employer_id: user.id,
        title: formData.title,
        description: formData.description,
        company_name: formData.company,
        company_logo: logoUrl || null,
        company_website: formData.companyWebsite || null,
        location: formData.location,
        salary_min: formData.salaryMin ? parseInt(formData.salaryMin) : null,
        salary_max: formData.salaryMax ? parseInt(formData.salaryMax) : null,
        salary_currency: formData.currency,
        job_type: formData.type.toLowerCase().replace('-', '_'),
        is_remote: formData.remote,
        is_featured: formData.jobType === 'featured',
        contact_email: formData.contactEmail || null,
        contact_phone: formData.contactPhone || null,
        apply_url: formData.contactApplyUrl || null,
        requirements: formData.requirements ? formData.requirements.split('\n').filter(r => r.trim()) : [],
        benefits: formData.benefits ? formData.benefits.split('\n').filter(b => b.trim()) : [],
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        categories: formData.categories || []
      };

      let result;
      if (editingJob) {
        // Update existing job
        result = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', editingJob.id)
          .eq('employer_id', user.id)
          .select();
      } else {
        // Insert new job
        result = await supabase
          .from('jobs')
          .insert([jobData])
          .select();
      }

      if (result.error) {
        throw new Error(result.error.message);
      }
      
      const successMessage = editingJob 
        ? 'Job updated successfully!' 
        : formData.jobType === 'free' 
          ? 'Free job posted successfully! Consider upgrading to Featured for better visibility.' 
          : 'Featured job posted successfully!';
      
      setMessage({ type: 'success', text: successMessage });
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      console.error('Error saving job:', error);
      setMessage({ type: 'error', text: 'Failed to save job. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan || selectedPlan.price === 0) return;
    
    if (!isAuthenticated) {
      setMessage({ type: 'error', text: 'Please sign in to continue with payment' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setHasAttemptedPayment(true);

    try {
      // Find the corresponding Stripe product
      const stripeProduct = stripeProducts.find(p => p.name === 'Featured Job Post');
      if (!stripeProduct) throw new Error('Product not found');

      const { url } = await createCheckoutSession({
        price_id: stripeProduct.priceId,
        success_url: `${window.location.origin}?success=true`,
        cancel_url: `${window.location.origin}/post?canceled=true`,
        mode: stripeProduct.mode,
      });

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create checkout session' });
      setHasAttemptedPayment(false);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'pricing') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => setStep('details')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job Details
          </button>
          <h2 className="text-3xl font-bold text-gray-900">Choose Your Job Type</h2>
          <p className="text-gray-600 mt-2">Select the best plan for your job posting</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`border-2 rounded-xl p-8 cursor-pointer transition-all ${
                selectedPlan?.id === plan.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${hasAttemptedPayment && plan.id === 'basic' ? 'ring-2 ring-green-500 ring-opacity-50' : ''}`}
            >
              {hasAttemptedPayment && plan.id === 'basic' && (
                <div className="bg-green-100 border border-green-200 rounded-md p-2 mb-4">
                  <p className="text-green-700 text-sm font-medium">✓ No payment required - Post for free!</p>
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {plan.currency === 'AUD' ? 'A$' : '$'}{plan.price}
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {selectedPlan?.id === plan.id && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-blue-700 text-sm font-medium">Selected Plan</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {hasAttemptedPayment && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Payment was canceled.</strong> You can still post your job for free using the Free Job Post option above, or try the premium option again.
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep('details')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleNextStep}
            disabled={!selectedPlan}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
          >
            {selectedPlan?.price === 0 ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Post Free Job
              </>
            ) : (
              'Continue to Payment'
            )}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => setStep('pricing')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pricing
          </button>
          <h2 className="text-3xl font-bold text-gray-900">Payment</h2>
          <p className="text-gray-600 mt-2">Complete your job posting</p>
        </div>

        {selectedPlan && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
            <div className="flex justify-between items-center mb-2">
              <span>{selectedPlan.name}</span>
              <span className="font-medium">{selectedPlan.currency === 'AUD' ? 'A$' : '$'}{selectedPlan.price}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
              <span>30 day premium listing</span>
            </div>
            <div className="border-t pt-4 flex justify-between items-center font-semibold">
              <span>Total</span>
              <span>{selectedPlan.currency === 'AUD' ? 'A$' : '$'}{selectedPlan.price}</span>
            </div>
          </div>
        )}

        {message && (
          <div className={`mb-6 p-3 rounded-md ${
            message.type === 'error' 
              ? 'bg-red-50 border border-red-200 text-red-700' 
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            {message.text}
            {message.type === 'error' && !isAuthenticated && (
              <button
                onClick={onShowLogin}
                className="ml-2 text-blue-600 hover:text-blue-700 underline"
              >
                Sign in now
              </button>
            )}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payment with Stripe</h3>
            <p className="text-gray-600 mb-6">
              You'll be redirected to Stripe's secure checkout to complete your payment.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep('pricing')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handlePayment}
            disabled={loading || !isAuthenticated}
            className="flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Complete Payment - ${selectedPlan?.currency === 'AUD' ? 'A$' : '$'}${selectedPlan?.price}`
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {editingJob ? 'Back to Dashboard' : 'Back to Jobs'}
        </button>
        <h2 className="text-3xl font-bold text-gray-900">
          {editingJob ? 'Edit Job' : 'Post a Job'}
        </h2>
        <p className="text-gray-600 mt-2">
          {editingJob ? 'Update your job posting details' : 'Fill in the details about your job opening'}
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'error' 
            ? 'bg-red-50 border border-red-200 text-red-700' 
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {message.text}
        </div>
      )}

      <form className="space-y-8">
        {/* Job Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Job Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Senior AI Engineer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. OpenAI"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Website
              </label>
              <input
                type="url"
                value={formData.companyWebsite}
                onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://company.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <div className="flex items-center space-x-4">
                {logoPreview ? (
                  <div className="relative">
                    <img 
                      src={logoPreview} 
                      alt="Company logo preview" 
                      className="h-16 w-16 rounded-lg object-cover border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <Upload className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG up to 5MB. Recommended: 200x200px
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <select
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a location</option>
                <option value="Parramatta">Parramatta</option>
                <option value="Blacktown">Blacktown</option>
                <option value="Liverpool">Liverpool</option>
                <option value="Fairfield">Fairfield</option>
                <option value="Penrith">Penrith</option>
                <option value="Campbelltown">Campbelltown</option>
                <option value="Camden">Camden</option>
                <option value="Bringelly">Bringelly</option>
                <option value="Oran Park">Oran Park</option>
                <option value="Mount Druitt">Mount Druitt</option>
                <option value="St Marys">St Marys</option>
                <option value="Leppington">Leppington</option>
                <option value="Luddenham">Luddenham</option>
                <option value="Kellyville">Kellyville</option>
                <option value="Marsden Park">Marsden Park</option>
                <option value="Schofields">Schofields</option>
                <option value="Rouse Hill">Rouse Hill</option>
                <option value="Castle Hill">Castle Hill</option>
                <option value="Baulkham Hills">Baulkham Hills</option>
                <option value="Merrylands">Merrylands</option>
                <option value="Auburn">Auburn</option>
                <option value="Bankstown">Bankstown</option>
                <option value="Cabramatta">Cabramatta</option>
                <option value="Wetherill Park">Wetherill Park</option>
                <option value="Smithfield">Smithfield</option>
                <option value="Prairiewood">Prairiewood</option>
                <option value="Bossley Park">Bossley Park</option>
                <option value="Horsley Park">Horsley Park</option>
                <option value="Cecil Park">Cecil Park</option>
                <option value="Kemps Creek">Kemps Creek</option>
                <option value="Badgerys Creek">Badgerys Creek</option>
                <option value="Rossmore">Rossmore</option>
                <option value="Catherine Field">Catherine Field</option>
                <option value="Harrington Park">Harrington Park</option>
                <option value="Narellan">Narellan</option>
                <option value="Smeaton Grange">Smeaton Grange</option>
                <option value="Gregory Hills">Gregory Hills</option>
                <option value="Spring Farm">Spring Farm</option>
                <option value="Currans Hill">Currans Hill</option>
                <option value="Mount Annan">Mount Annan</option>
                <option value="Macarthur">Macarthur</option>
                <option value="Minto">Minto</option>
                <option value="Ingleburn">Ingleburn</option>
                <option value="Raby">Raby</option>
                <option value="Bradbury">Bradbury</option>
                <option value="Airds">Airds</option>
                <option value="Ambarvale">Ambarvale</option>
                <option value="Claymore">Claymore</option>
                <option value="Eagle Vale">Eagle Vale</option>
                <option value="Eschol Park">Eschol Park</option>
                <option value="Kearns">Kearns</option>
                <option value="Leumeah">Leumeah</option>
                <option value="Macquarie Fields">Macquarie Fields</option>
                <option value="Minto Heights">Minto Heights</option>
                <option value="Ruse">Ruse</option>
                <option value="St Andrews">St Andrews</option>
                <option value="Varroville">Varroville</option>
                <option value="Woodbine">Woodbine</option>
                <option value="Glenfield">Glenfield</option>
                <option value="Casula">Casula</option>
                <option value="Prestons">Prestons</option>
                <option value="Miller">Miller</option>
                <option value="Cartwright">Cartwright</option>
                <option value="Sadleir">Sadleir</option>
                <option value="Heckenberg">Heckenberg</option>
                <option value="Busby">Busby</option>
                <option value="Green Valley">Green Valley</option>
                <option value="Hinchinbrook">Hinchinbrook</option>
                <option value="Hoxton Park">Hoxton Park</option>
                <option value="Len Waters Estate">Len Waters Estate</option>
                <option value="West Hoxton">West Hoxton</option>
                <option value="Carnes Hill">Carnes Hill</option>
                <option value="Edmondson Park">Edmondson Park</option>
                <option value="Denham Court">Denham Court</option>
                <option value="Austral">Austral</option>
                <option value="Lurnea">Lurnea</option>
                <option value="Warwick Farm">Warwick Farm</option>
                <option value="Chipping Norton">Chipping Norton</option>
                <option value="Moorebank">Moorebank</option>
                <option value="Hammondville">Hammondville</option>
                <option value="Holsworthy">Holsworthy</option>
                <option value="Wattle Grove">Wattle Grove</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.remote}
                onChange={(e) => handleInputChange('remote', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Remote position</span>
            </label>
          </div>
        </div>

        {/* Salary Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Salary Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Salary
              </label>
              <input
                type="number"
                value={formData.salaryMin}
                onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Salary
              </label>
              <input
                type="number"
                value={formData.salaryMax}
                onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 150000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="AUD">AUD</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Job Description</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the role, responsibilities, and what makes this position exciting..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="List the required skills, experience, and qualifications (one per line)..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Benefits
              </label>
              <textarea
                value={formData.benefits}
                onChange={(e) => handleInputChange('benefits', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="List the benefits and perks (one per line)..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills & Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Python, Machine Learning, AI, Deep Learning (comma separated)"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h3>
          
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Provide contact information for candidates to reach you. You can provide multiple options.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="jobs@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application URL
              </label>
              <input
                type="url"
                value={formData.contactApplyUrl}
                onChange={(e) => handleInputChange('contactApplyUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://company.com/apply/job-id"
              />
              <p className="text-sm text-gray-500 mt-1">
                Direct link to your application portal or job posting
              </p>
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Job Categories</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories * (Select up to 3)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Administration',
                'Accounting & Finance',
                'Customer Service',
                'Education & Training',
                'Engineering',
                'Healthcare & Medical',
                'Hospitality & Tourism',
                'Human Resources',
                'Information Technology',
                'Legal',
                'Manufacturing',
                'Marketing & Communications',
                'Real Estate',
                'Retail & Sales',
                'Trades & Services',
                'Transport & Logistics'
              ].map((category) => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category as JobCategory)}
                    onChange={(e) => handleCategoryChange(category as JobCategory, e.target.checked)}
                    disabled={!formData.categories.includes(category as JobCategory) && formData.categories.length >= 3}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700">{category}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Selected: {formData.categories.length}/3
            </p>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleNextStep}
            disabled={loading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {editingJob ? 'Saving...' : 'Processing...'}
              </>
            ) : editingJob ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            ) : (
              'Continue to Pricing'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};