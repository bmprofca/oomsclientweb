import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/apiCall';

const ProfileSelectionModal = () => {
  const { isProfileModalOpen, closeProfileModal, updateProfile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isProfileModalOpen) {
      setLoading(true);
      setError('');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-gray-800 rounded-md shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ animation: 'slideIn 0.3s ease' }}
      >
        <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Switch Profile</h2>
          <button
            onClick={closeProfileModal}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">{error}</div>
          ) : (
            <div className="flex flex-col gap-3">
              {profiles.map((profile, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelect(profile)}
                  className="p-4 border-[1.5px] border-gray-200 dark:border-gray-700 rounded-md cursor-pointer transition-all duration-200 hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-gray-700 dark:hover:border-gray-500 flex flex-col gap-1"
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{profile.name}</span>
                  <span className="text-xs text-slate-500 dark:text-gray-400">Branch: {profile.branch?.name || 'N/A'}</span>
                  <span className="text-[11px] text-slate-400 dark:text-gray-500">{profile.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSelectionModal;
