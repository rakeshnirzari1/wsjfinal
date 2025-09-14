import React from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import { pricingPlans } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';

interface PricingPageProps {
  onBack: () => void;
  onSelectPlan: (planId: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onBack, onSelectPlan }) => {
  const { isAuthenticated } = useAuth();

  const handleSelectPlan = (planId: string) => {
    if (!isAuthenticated) {
      // Navigate to login page instead of showing alert
      window.location.href = '/login';
      return;
    }
    onSelectPlan(planId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </button>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 px-4">
            Simple
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 whitespace-nowrap">
              Pricing
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan to showcase your job openings to top talent in Western Sydney
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-lg border-2 p-8 relative ${
                plan.highlight 
                  ? 'border-blue-500 transform scale-105' 
                  : 'border-gray-200'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">
                    {plan.currency === 'AUD' ? 'A$' : '$'}{plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-600 ml-2">one-time</span>
                  )}
                </div>
                <p className="text-gray-600">
                  {plan.duration} day listing
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  plan.highlight
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.price === 0 ? 'Post Free Job' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What's the difference between Free and Featured job posts?
              </h3>
              <p className="text-gray-600">
                Free job posts appear in standard search results, while Featured jobs get priority placement, 
                enhanced visibility, and a premium badge to attract more qualified candidates.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How long do job posts stay active?
              </h3>
              <p className="text-gray-600">
                Both Free and Featured job posts remain active for 30 days. You can mark them as filled 
                or delete them at any time through your employer dashboard.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I edit my job post after publishing?
              </h3>
              <p className="text-gray-600">
                Yes! You can edit, mark as filled, or delete your job posts anytime through your 
                employer dashboard after logging in.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you take a commission on applications?
              </h3>
              <p className="text-gray-600">
                No, we don't take any commission. You pay once to post your job, and all applications 
                come directly to you through your preferred contact method.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};