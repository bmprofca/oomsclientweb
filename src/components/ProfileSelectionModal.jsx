import React, { useEffect, useState } from 'react';
import { Search, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/apiCall';

const ProfileSelectionModal = () => {
  const { isProfileModalOpen, closeProfileModal, updateProfile, userData } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isProfileModalOpen) {
      setLoading(true);
      setError('');
      setSearchQuery('');
      fetchProfiles();
    }
  }, [isProfileModalOpen]);

  const fetchProfiles = async () => {
    try {
      const response = await apiCall('/profile/list', 'GET');
      const data = await response.json();

      if (response.ok && data.success !== false && data.data && data.data.length > 0) {
        setProfiles(data.data);
        // Auto select if only 1 profile found
        if (data.data.length === 1) {
          handleSelect(data.data[0]);
        }
      } else {
        setError('No profiles found or failed to fetch.');
      }
    } catch (err) {
      setError('Network error while fetching profiles.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (profile) => {
    updateProfile(profile);
    closeProfileModal();
  };

  if (!isProfileModalOpen) return null;

  const filteredProfiles = profiles.filter(p => {
    const query = searchQuery.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(query);
    const branchMatch = p.branch?.name?.toLowerCase().includes(query);
    const emailMatch = p.email?.toLowerCase().includes(query);
    return nameMatch || branchMatch || emailMatch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-md shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ animation: 'slideIn 0.3s ease', maxHeight: '85vh', height: '70vh' }}
      >
        <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 gap-4 shrink-0">
          <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Switch Profile</h2>
            <button
              onClick={closeProfileModal}
              className="sm:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="relative w-full sm:max-w-xs md:max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search profiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>

          <button
            onClick={closeProfileModal}
            className="hidden sm:block text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-gray-800/50">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">{error}</div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-10">
              <Search size={40} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No profiles found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">We couldn't find any profiles matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProfiles.map((profile, idx) => {
                const isActive = userData && (
                  (userData.username && profile.username && userData.username === profile.username) || 
                  (userData.email && profile.email && userData.email === profile.email)
                );
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelect(profile)}
                    className={`p-4 border-[1.5px] rounded-md transition-all duration-200 flex flex-col gap-1.5 relative overflow-hidden group ${
                      isActive 
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-500/70 shadow-sm cursor-default'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer hover:border-slate-800 hover:shadow-md dark:hover:border-gray-500'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-4 right-4 text-indigo-600 dark:text-indigo-400">
                        <CheckCircle2 size={20} />
                      </div>
                    )}
                    <div className="pr-8">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{profile.name}</h3>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                        {profile.branch?.name || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 truncate">{profile.email}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSelectionModal;
