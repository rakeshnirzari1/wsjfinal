import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Edit, Trash2, Eye, Users, Briefcase, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Job } from '../types';

interface AdminPanelProps {
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'jobs' | 'users'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'jobs') {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const transformedJobs = data.map(job => ({
          id: job.id,
          title: job.title,
          company: job.company_name,
          location: job.location,
          type: job.job_type,
          remote: job.is_remote,
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
      } else {
        const { data, error } = await supabase
          .from('employers')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);
      
      if (error) throw error;
      setJobs(prev => prev.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job');
    }
  };

  const handleToggleJobStatus = async (jobId: string, isFilled: boolean) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_filled: isFilled })
        .eq('id', jobId);
      
      if (error) throw error;
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, isFilled } : job
      ));
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status');
    }
  };

  const handleToggleFeatured = async (jobId: string, isFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_featured: isFeatured })
        .eq('id', jobId);
      
      if (error) throw error;
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, featured: isFeatured } : job
      ));
    } catch (error) {
      console.error('Error updating featured status:', error);
      alert('Failed to update featured status');
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job.id);
    setEditForm({
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : job.requirements,
      benefits: Array.isArray(job.benefits) ? job.benefits.join('\n') : job.benefits,
      tags: Array.isArray(job.tags) ? job.tags.join(', ') : job.tags,
      salary_min: job.salary?.min || '',
      salary_max: job.salary?.max || '',
      salary_currency: job.salary?.currency || 'AUD',
      is_remote: job.remote,
      job_type: job.type.toLowerCase().replace('-', '_'),
      contact_email: job.contactEmail || '',
      contact_phone: job.contactPhone || '',
      apply_url: job.contactApplyUrl || ''
    });
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      const updateData = {
        title: editForm.title,
        company_name: editForm.company,
        location: editForm.location,
        description: editForm.description,
        requirements: editForm.requirements.split('\n').filter((r: string) => r.trim()),
        benefits: editForm.benefits.split('\n').filter((b: string) => b.trim()),
        tags: editForm.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t),
        salary_min: editForm.salary_min ? parseInt(editForm.salary_min) : null,
        salary_max: editForm.salary_max ? parseInt(editForm.salary_max) : null,
        salary_currency: editForm.salary_currency,
        is_remote: editForm.is_remote,
        job_type: editForm.job_type,
        contact_email: editForm.contact_email || null,
        contact_phone: editForm.contact_phone || null,
        apply_url: editForm.apply_url || null
      };

      const { error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', jobId);
      
      if (error) throw error;
      
      // Update local state
      setJobs(prev => prev.map(job => {
        if (job.id === jobId) {
          return {
            ...job,
            title: editForm.title,
            company: editForm.company,
            location: editForm.location,
            description: editForm.description,
            requirements: editForm.requirements.split('\n').filter((r: string) => r.trim()),
            benefits: editForm.benefits.split('\n').filter((b: string) => b.trim()),
            tags: editForm.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t),
            salary: editForm.salary_min && editForm.salary_max ? {
              min: parseInt(editForm.salary_min),
              max: parseInt(editForm.salary_max),
              currency: editForm.salary_currency
            } : undefined,
            remote: editForm.is_remote,
            type: editForm.job_type.replace('_', '-').replace(/\b\w/g, (l: string) => l.toUpperCase()) as any,
            contactEmail: editForm.contact_email,
            contactPhone: editForm.contact_phone,
            contactApplyUrl: editForm.apply_url
          };
        }
        return job;
      }));
      
      setEditingJob(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Failed to update job');
    }
  };

  const handleCancelEdit = () => {
    setEditingJob(null);
    setEditForm({});
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage jobs and users across the platform</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center px-6 py-3 font-medium ${
                activeTab === 'jobs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Jobs ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center px-6 py-3 font-medium ${
                activeTab === 'users'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Users ({users.length})
            </button>
          </div>

          {/* Search */}
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'jobs' && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Posted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredJobs.map((job) => (
                        <React.Fragment key={job.id}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              {editingJob === job.id ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Job Title"
                                  />
                                  <input
                                    type="text"
                                    value={editForm.location}
                                    onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Location"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <div className="font-medium text-gray-900">{job.title}</div>
                                  <div className="text-sm text-gray-500">{job.location}</div>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {editingJob === job.id ? (
                                <input
                                  type="text"
                                  value={editForm.company}
                                  onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="Company"
                                />
                              ) : (
                                job.company
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                job.isFilled
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {job.isFilled ? 'Filled' : 'Active'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(job.postedDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">
                              {editingJob === job.id ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleSaveJob(job.id)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-gray-600 hover:text-gray-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditJob(job)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleFeatured(job.id, !job.featured)}
                                    className={`${
                                      job.featured
                                        ? 'text-orange-600 hover:text-orange-700'
                                        : 'text-purple-600 hover:text-purple-700'
                                    }`}
                                    title={job.featured ? 'Remove Featured' : 'Make Featured'}
                                  >
                                    {job.featured ? '★' : '☆'}
                                  </button>
                                  <button
                                    onClick={() => handleToggleJobStatus(job.id, !job.isFilled)}
                                    className={`${
                                      job.isFilled
                                        ? 'text-green-600 hover:text-green-700'
                                        : 'text-orange-600 hover:text-orange-700'
                                    }`}
                                  >
                                    {job.isFilled ? 'Activate' : 'Fill'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteJob(job.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                          {editingJob === job.id && (
                            <tr>
                              <td colSpan={5} className="px-6 py-4 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                      value={editForm.description}
                                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      rows={3}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (one per line)</label>
                                    <textarea
                                      value={editForm.requirements}
                                      onChange={(e) => setEditForm({...editForm, requirements: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      rows={3}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Benefits (one per line)</label>
                                    <textarea
                                      value={editForm.benefits}
                                      onChange={(e) => setEditForm({...editForm, benefits: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      rows={3}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                                    <input
                                      type="text"
                                      value={editForm.tags}
                                      onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary</label>
                                      <input
                                        type="number"
                                        value={editForm.salary_min}
                                        onChange={(e) => setEditForm({...editForm, salary_min: e.target.value})}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary</label>
                                      <input
                                        type="number"
                                        value={editForm.salary_max}
                                        onChange={(e) => setEditForm({...editForm, salary_max: e.target.value})}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                      <select
                                        value={editForm.salary_currency}
                                        onChange={(e) => setEditForm({...editForm, salary_currency: e.target.value})}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      >
                                        <option value="AUD">AUD</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                                      <select
                                        value={editForm.job_type}
                                        onChange={(e) => setEditForm({...editForm, job_type: e.target.value})}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      >
                                        <option value="full_time">Full-time</option>
                                        <option value="part_time">Part-time</option>
                                        <option value="contract">Contract</option>
                                        <option value="internship">Internship</option>
                                      </select>
                                    </div>
                                    <div className="flex items-center">
                                      <label className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={editForm.is_remote}
                                          onChange={(e) => setEditForm({...editForm, is_remote: e.target.checked})}
                                          className="mr-2"
                                        />
                                        Remote Position
                                      </label>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                    <input
                                      type="email"
                                      value={editForm.contact_email}
                                      onChange={(e) => setEditForm({...editForm, contact_email: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                                    <input
                                      type="tel"
                                      value={editForm.contact_phone}
                                      onChange={(e) => setEditForm({...editForm, contact_phone: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apply URL</label>
                                    <input
                                      type="url"
                                      value={editForm.apply_url}
                                      onChange={(e) => setEditForm({...editForm, apply_url: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{user.contact_person}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {user.company_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {user.phone || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};