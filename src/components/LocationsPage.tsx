import React, { useState } from 'react';
import { ArrowLeft, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { westernSydneyLocations } from '../data/mockData';

export const LocationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLocationClick = (locationSlug: string) => {
    navigate(`/location/${locationSlug}`);
  };

  const filteredLocations = westernSydneyLocations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </button>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <MapPin className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 px-4">
              All
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 whitespace-nowrap">
                Locations
              </span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore job opportunities across all Western Sydney locations
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search suburbs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* All Locations Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredLocations.map((location) => (
            <button
              key={location.slug}
              onClick={() => handleLocationClick(location.slug)}
              className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-center group"
            >
              <h3 className="font-medium text-sm text-gray-900 group-hover:text-blue-600">
                {location.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {location.description.replace('Jobs in ', '').replace(' - ', '')}
              </p>
            </button>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            Showing {filteredLocations.length} of {westernSydneyLocations.length} locations
          </p>
        </div>
      </div>
    </div>
  );
};