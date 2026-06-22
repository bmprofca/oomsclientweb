import React, { useState, useRef } from 'react';
import { Camera, User, MapPin, Phone, FileText, Save, X, Edit2, CheckCircle, Building2, Mail } from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  const [savedMessage, setSavedMessage] = useState(false);

  // Profile State
  const [profile, setProfile] = useState({
    name: 'Admin User',
    email: 'admin@oomsadmin.com',
    role: 'Administrator',
    address: '123 Business Avenue, Tech District, Mumbai, Maharashtra 400001',
    contact: '+91 98765 43210',
    gstNumber: '',
    profileImage: null 
  });

  // Edit State
  const [editForm, setEditForm] = useState({ ...profile });

  const handleEditClick = () => {
    setEditForm({ ...profile });
    setIsEditing(true);
    setSavedMessage(false);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleSaveClick = () => {
    setProfile({ ...editForm });
    setIsEditing(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setEditForm(prev => ({ ...prev, profileImage: imageUrl }));
    }
  };

  return (
    <ManagementHub
      eyebrow="Settings"
      title="My Profile"
      description="Manage your personal information, address, and business details."
      accent="blue"
      actions={
        !isEditing ? (
          <button 
            onClick={handleEditClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-blue-600/20"
          >
            <Edit2 size={16} />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={handleCancelClick}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
            <button 
              onClick={handleSaveClick}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-emerald-600/20"
            >
              <Save size={16} />
              Save
            </button>
          </div>
        )
      }
    >
      <div className="mt-4 flex flex-col lg:flex-row gap-6">
        
        {/* Left Panel: Avatar & Quick Info */}
        <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            
            <div className="px-6 pb-6 relative flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative group -mt-12 mb-4">
                <div 
                  className={`w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 p-1 shadow-md ${isEditing ? 'cursor-pointer' : ''}`}
                  onClick={handleImageClick}
                >
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 overflow-hidden flex items-center justify-center relative">
                    {(isEditing ? editForm.profileImage : profile.profileImage) ? (
                      <img 
                        src={isEditing ? editForm.profileImage : profile.profileImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {(isEditing ? editForm.name : profile.name).charAt(0)}
                      </span>
                    )}
                    
                    {isEditing && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={20} className="mb-0.5" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Upload</span>
                      </div>
                    )}
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {/* Name & Role */}
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                {isEditing ? editForm.name || 'Your Name' : profile.name}
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {profile.role}
              </span>
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <Mail size={16} className="text-slate-400" />
                <span className="truncate">{isEditing ? editForm.email || 'Email' : profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <Phone size={16} className="text-slate-400" />
                <span>{isEditing ? editForm.contact || 'Contact Number' : profile.contact || 'No contact'}</span>
              </div>
            </div>
          </div>
          
          {savedMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 text-sm shadow-sm">
              <CheckCircle size={16} className="shrink-0" />
              <span className="font-medium">Profile updated!</span>
            </div>
          )}
        </div>

        {/* Right Panel: Form Fields */}
        <div className="w-full lg:w-2/3 xl:w-3/4 flex flex-col gap-4">
          
          {/* Section 1: Personal Info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/30">
              <User size={16} className="text-blue-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Personal Details</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  {isEditing ? (
                    <input type="text" name="name" value={editForm.name} onChange={handleChange}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-colors" />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-white font-medium py-1">{profile.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  {isEditing ? (
                    <input type="email" name="email" value={editForm.email} onChange={handleChange}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-colors" />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-white font-medium py-1">{profile.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Contact Number</label>
                  {isEditing ? (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={14} className="text-slate-400" />
                      </div>
                      <input type="tel" name="contact" value={editForm.contact} onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-colors" />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-white font-medium py-1">{profile.contact || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Address */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/30">
              <MapPin size={16} className="text-blue-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Address Information</h3>
            </div>
            <div className="p-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Complete Address</label>
              {isEditing ? (
                <textarea name="address" value={editForm.address} onChange={handleChange} rows={2}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-colors resize-none" />
              ) : (
                <p className="text-sm text-slate-900 dark:text-white font-medium py-1 whitespace-pre-wrap">{profile.address || 'No address provided'}</p>
              )}
            </div>
          </div>

          {/* Section 3: Business Details */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/30">
              <Building2 size={16} className="text-blue-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Business Details</h3>
            </div>
            <div className="p-5">
              <div className="max-w-md">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>GST Number</span>
                  {isEditing && !editForm.gstNumber && <span className="text-blue-500 lowercase normal-case text-[10px]">Optional</span>}
                </label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText size={14} className="text-slate-400" />
                    </div>
                    <input type="text" name="gstNumber" value={editForm.gstNumber} onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-colors uppercase" placeholder="e.g. 22AAAAA0000A1Z5" />
                  </div>
                ) : (
                  <div className="py-1">
                    {profile.gstNumber ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-sm text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        <FileText size={14} className="text-slate-500" />
                        {profile.gstNumber}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500 dark:text-slate-400 italic">No GST number added</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </ManagementHub>
  );
}
