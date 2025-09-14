import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export const PolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const { policy } = useParams<{ policy: string }>();

  // Get policy from URL path
  const currentPolicy = policy || window.location.pathname.replace('/', '');

  const getPolicyContent = () => {
    switch (currentPolicy) {
      case 'privacy':
        return {
          title: 'Privacy Policy',
          content: `
            Last updated: January 2025

            ## Information We Collect

            We collect information you provide directly to us, such as when you create an account, post a job, or contact us.

            ## How We Use Your Information

            We use the information we collect to provide, maintain, and improve our services.

            ## Information Sharing

            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent.

            ## Data Security

            We implement appropriate security measures to protect your personal information.

            ## Contact Us

            If you have any questions about this Privacy Policy, please contact us at support@westernsydneyjobs.com.au.
          `
        };
      case 'terms':
        return {
          title: 'Terms of Service',
          content: `
            Last updated: January 2025

            ## Acceptance of Terms

            By accessing and using AI Jobs, you accept and agree to be bound by the terms and provision of this agreement.

            ## Use License

            Permission is granted to temporarily use AI Jobs for personal, non-commercial transitory viewing only.

            ## Disclaimer

            The materials on AI Jobs are provided on an 'as is' basis. AI Jobs makes no warranties, expressed or implied.

            ## Limitations

            In no event shall AI Jobs or its suppliers be liable for any damages arising out of the use or inability to use the materials on AI Jobs.

            ## Contact Information

            Questions about the Terms of Service should be sent to us at support@westernsydneyjobs.com.au.
          `
        };
      case 'cookies':
        return {
          title: 'Cookie Policy',
          content: `
            Last updated: January 2025

            ## What Are Cookies

            Cookies are small text files that are placed on your computer by websites that you visit.

            ## How We Use Cookies

            We use cookies to improve your experience on our website and to provide personalized content.

            ## Types of Cookies We Use

            - Essential cookies: Required for the website to function properly
            - Analytics cookies: Help us understand how visitors interact with our website
            - Preference cookies: Remember your settings and preferences

            ## Managing Cookies

            You can control and/or delete cookies as you wish through your browser settings.

            ## Contact Us

            If you have any questions about our use of cookies, please contact us at support@westernsydneyjobs.com.au.
          `
        };
      default:
        return {
          title: 'Policy Not Found',
          content: 'The requested policy page could not be found.'
        };
    }
  };

  const { title, content } = getPolicyContent();

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </button>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{title}</h1>
            
            <div className="prose prose-gray max-w-none">
              {content.split('\n').map((paragraph, index) => {
                if (paragraph.trim().startsWith('##')) {
                  return (
                    <h2 key={index} className="text-xl font-semibold text-gray-900 mt-8 mb-4">
                      {paragraph.replace('##', '').trim()}
                    </h2>
                  );
                } else if (paragraph.trim().startsWith('-')) {
                  return (
                    <li key={index} className="text-gray-700 mb-2">
                      {paragraph.replace('-', '').trim()}
                    </li>
                  );
                } else if (paragraph.trim()) {
                  return (
                    <p key={index} className="text-gray-700 mb-4 leading-relaxed">
                      {paragraph.trim()}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      </div>
  );
};