import React, { useState, useRef } from 'react';
import { Camera, User, MapPin, Phone, FileText, Save, X, Edit2, CheckCircle, Building2 } from 'lucide-react';
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
    profileImage: null // Would hold image URL or file
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
          <div className="flex gap-3">
            <button 
              onClick={handleCancelClick}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
            <button 
              onClick={handleSaveClick}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-emerald-600/20"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        )
      }
    >
      <div className="mt-6 max-w-4xl mx-auto space-y-6">
        
        {savedMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle size={18} />
            <span className="font-medium">Profile updated successfully!</span>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          
          {/* Header/Cover */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative"></div>
          
          <div className="px-8 pb-8">
            {/* Avatar Section */}
            <div className="relative flex justify-between items-end -mt-16 mb-8">
              <div className="relative group">
                <div 
                  className={`w-32 h-32 rounded-2xl bg-white dark:bg-slate-900 p-1.5 shadow-md ${isEditing ? 'cursor-pointer' : ''}`}
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
                      <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                        {profile.name.charAt(0)}
                      </span>
                    )}
                    
                    {isEditing && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="mb-1" />
                        <span className="text-xs font-medium">Change</span>
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
              
              {!isEditing && (
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.name}</h2>
                  <p className="text-blue-600 dark:text-blue-400 font-medium">{profile.role}</p>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              {/* Personal Details */}
              <div className="space-y-6 md:col-span-2">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                  <User size={18} className="text-blue-500" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="name"
                        value={editForm.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-colors"
                        placeholder="John Doe"
                      />
                    ) : (
                      <p className="text-slate-900 dark:text-white py-2.5">{profile.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input 
                        type="email" 
                        name="email"
                        value={editForm.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-colors"
                      />
                    ) : (
                      <p className="text-slate-900 dark:text-white py-2.5">{profile.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Contact Number
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone size={16} className="text-slate-400" />
                        </div>
                        <input 
                          type="tel" 
                          name="contact"
                          value={editForm.contact}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-colors"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    ) : (
                      <p className="text-slate-900 dark:text-white py-2.5 flex items-center gap-2">
                        <Phone size={16} className="text-slate-400" />
                        {profile.contact || 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div className="space-y-6 md:col-span-2 pt-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                  <MapPin size={18} className="text-blue-500" />
                  Address Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Complete Address
                  </label>
                  {isEditing ? (
                    <textarea 
                      name="address"
                      value={editForm.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-colors resize-none"
                      placeholder="Enter your full address"
                    />
                  ) : (
                    <p className="text-slate-900 dark:text-white py-2.5 whitespace-pre-wrap leading-relaxed">
                      {profile.address || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>

              {/* Business / Legal Details */}
              <div className="space-y-6 md:col-span-2 pt-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                  <Building2 size={18} className="text-blue-500" />
                  Business Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>GST Number</span>
                      {isEditing && !editForm.gstNumber && (
                        <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">Optional</span>
                      )}
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FileText size={16} className="text-slate-400" />
                        </div>
                        <input 
                          type="text" 
                          name="gstNumber"
                          value={editForm.gstNumber}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-colors uppercase"
                          placeholder="22AAAAA0000A1Z5"
                        />
                      </div>
                    ) : (
                      <div className="py-2.5">
                        {profile.gstNumber ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-sm text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            <FileText size={14} className="text-slate-500" />
                            {profile.gstNumber}
                          </div>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 italic">No GST number added</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </ManagementHub>
  );
}
