import React, { useState } from 'react';
import { Search, Menu, X, User, Building, Plus, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onShowLogin: () => void;
  onShowSignup: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentPage, 
  onPageChange, 
  onShowLogin, 
  onShowSignup 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, isAuthenticated, isAdmin } = useAuth();
  const { getActivePlanName } = useSubscription();

  const activePlan = getActivePlanName();

  const navItems = [
    { id: 'jobs', label: 'Jobs', icon: Search },
    { id: 'companies', label: 'Companies', icon: Building },
    { id: 'pricing', label: 'Pricing', icon: Plus },
    { id: 'post', label: 'Post a Job', icon: Plus }
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => {
              onPageChange('jobs');
              setIsMenuOpen(false);
            }}
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg mr-3">
              <Search className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Western Sydney Jobs</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onPageChange(id)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => onPageChange('dashboard')}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onPageChange('admin')}
                    className="text-purple-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-purple-50 hover:bg-purple-100"
                  >
                    Admin Panel
                  </button>
                )}
                {activePlan && (
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {activePlan}
                  </span>
                )}
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{user?.email}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={onShowLogin}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </button>
                <button 
                  onClick={onShowSignup}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    onPageChange(id);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </button>
              ))}
              
              <div className="pt-4 space-y-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => {
                        onPageChange('dashboard');
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Dashboard
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          onPageChange('admin');
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left text-purple-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-purple-50 hover:bg-purple-100"
                      >
                        Admin Panel
                      </button>
                    )}
                    {activePlan && (
                      <div className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-full">
                        {activePlan}
                      </div>
                    )}
                    <div className="px-3 py-2 text-sm text-gray-700">
                      {user?.email}
                    </div>
                    <button
                      onClick={signOut}
                      className="flex items-center w-full text-left text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        onShowLogin();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => {
                        onShowSignup();
                        setIsMenuOpen(false);
                      }}
                      className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};