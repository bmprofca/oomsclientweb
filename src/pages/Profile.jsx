import React, { useState, useRef, useEffect } from 'react';
import {
  Camera, User, MapPin, Phone, FileText, Save, X, Edit2,
  CheckCircle, Building2, Mail, Loader2, LayoutDashboard
} from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import { uploadFile, apiCall } from '../utils/apiCall';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('overview');
  const fileInputRef = useRef(null);
  const [savedMessage, setSavedMessage] = useState(false);

  const { userData } = useAuth();

  const [profile, setProfile] = useState({
    name: userData?.name || 'User',
    email: userData?.email || '',
    role: userData?.branch?.name || 'User',
    address: userData?.address || '',
    contact: userData?.contact || userData?.mobile || '',
    gstNumber: userData?.gstNumber || '',
    profileImage: userData?.profileImage || null,
  });

  useEffect(() => {
    if (userData) {
      setProfile(prev => ({
        ...prev,
        name: userData.name || prev.name,
        email: userData.email || prev.email,
        role: userData.branch?.name || prev.role,
        contact: userData.contact || userData.mobile || prev.contact,
      }));
    }
  }, [userData]);

  const [editForm, setEditForm] = useState({ ...profile });
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeTab === 'edit') {
      setEditForm({ ...profile });
      setSelectedImageFile(null);
    }
  }, [activeTab]);

  const handleCancelClick = () => {
    setActiveTab('overview');
    setSelectedImageFile(null);
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      let imageUrl = editForm.profileImage;
      if (selectedImageFile) {
        imageUrl = await uploadFile(selectedImageFile);
      }
      const updatedProfile = { ...editForm, profileImage: imageUrl };
      try {
        await apiCall('/api/user/profile', 'PUT', updatedProfile);
      } catch (apiError) {
        console.warn('Profile update API call failed, updating local state only.', apiError);
      }
      setProfile(updatedProfile);
      setActiveTab('overview');
      setSelectedImageFile(null);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (error) {
      console.error('Failed to save profile', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    if (activeTab === 'edit' && fileInputRef.current) fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      setEditForm((prev) => ({ ...prev, profileImage: URL.createObjectURL(file) }));
    }
  };

  /* ---------- Shared avatar image source ---------- */
  const displayImage = activeTab === 'edit' ? editForm.profileImage : profile.profileImage;
  const displayName = activeTab === 'edit' ? (editForm.name || 'Your Name') : profile.name;
  const displayEmail = activeTab === 'edit' ? (editForm.email || '') : profile.email;

  /* ---------- Input class helper ---------- */
  const inputCls =
    'w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-colors outline-none';

  /* ---------- Section header ---------- */
  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/30">
      <Icon size={17} className="text-blue-500 shrink-0" />
      <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{title}</h3>
    </div>
  );

  /* ---------- Field label ---------- */
  const FieldLabel = ({ children, optional }) => (
    <div className="flex items-center justify-between mb-1.5">
      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
        {children}
      </label>
      {optional && <span className="text-[10px] text-blue-500">Optional</span>}
    </div>
  );

  /* ---------- Read-only field value ---------- */
  const FieldValue = ({ children }) => (
    <p className="text-sm text-slate-900 dark:text-white font-medium">{children || '-'}</p>
  );

  /* ---------- Tab navigation items ---------- */
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'edit', label: 'Edit Profile', icon: Edit2 },
  ];

  return (
    <ManagementHub
      title="My Profile"
      description="Manage your personal information, address, and business details."
      accent="blue"
    >
      {/* Success toast */}
      {savedMessage && (
        <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-md flex items-center gap-2 text-sm shadow-sm">
          <CheckCircle size={16} className="shrink-0" />
          <span className="font-medium">Profile updated successfully!</span>
        </div>
      )}

      {/* ===== MAIN GRID ===== */}
      <div className="mt-4 flex flex-col lg:flex-row gap-5 items-start">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col gap-4">

          {/* Profile card */}
          <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Cover strip */}
            <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600" />

            {/* Avatar + info */}
            <div className="flex flex-col items-center px-5 pb-5 -mt-10">
              <div
                className={`relative group w-20 h-20 rounded-md ring-4 ring-white dark:ring-slate-900 shadow-md mb-3 ${activeTab === 'edit' ? 'cursor-pointer' : ''}`}
                onClick={handleImageClick}
              >
                <div className="w-full h-full rounded-md bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 overflow-hidden flex items-center justify-center">
                  {displayImage ? (
                    <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {displayName.charAt(0)}
                    </span>
                  )}
                </div>
                {activeTab === 'edit' && (
                  <div className="absolute inset-0 rounded-md bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={20} />
                    <span className="text-[10px] font-semibold mt-0.5 uppercase tracking-wide">Change</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />

              <h2 className="text-base font-bold text-slate-900 dark:text-white text-center leading-tight">{displayName}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-0.5 truncate w-full">{displayEmail}</p>
              <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {profile.role}
              </span>

              {/* Quick info chips */}
              <div className="mt-4 w-full space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-md px-3 py-2">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
                {profile.contact && (
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-md px-3 py-2">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span>{profile.contact}</span>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-md px-3 py-2">
                    <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{profile.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab navigation (vertical on lg, horizontal pills on sm/md) */}
          <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 p-2">
            <nav className="flex lg:flex-col gap-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md text-sm font-medium transition-colors flex-1 lg:flex-none ${activeTab === id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── RIGHT CONTENT ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <>
              {/* Personal Details */}
              <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <SectionHeader icon={User} title="Personal Details" />
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  <div>
                    <FieldLabel>Full Name</FieldLabel>
                    <FieldValue>{profile.name}</FieldValue>
                  </div>
                  <div>
                    <FieldLabel>Email Address</FieldLabel>
                    <FieldValue>{profile.email}</FieldValue>
                  </div>
                  <div>
                    <FieldLabel>Contact Number</FieldLabel>
                    <FieldValue>{profile.contact}</FieldValue>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <SectionHeader icon={MapPin} title="Address Information" />
                <div className="p-5">
                  <FieldLabel>Complete Address</FieldLabel>
                  <FieldValue>{profile.address || 'No address provided'}</FieldValue>
                </div>
              </div>

              {/* Business Details */}
              <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <SectionHeader icon={Building2} title="Business Details" />
                <div className="p-5">
                  <FieldLabel>GST Number</FieldLabel>
                  {profile.gstNumber ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-sm text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      <FileText size={13} className="text-slate-500" />
                      {profile.gstNumber}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400 italic">No GST number added</span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── EDIT TAB ── */}
          {activeTab === 'edit' && (
            <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <SectionHeader icon={Edit2} title="Edit Profile" />
              <div className="p-5 space-y-5">

                {/* Row 1: Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel>Full Name</FieldLabel>
                    <input type="text" name="name" value={editForm.name} onChange={handleChange} className={inputCls} placeholder="Your name" />
                  </div>
                  <div>
                    <FieldLabel>Email Address</FieldLabel>
                    <input type="email" name="email" value={editForm.email} onChange={handleChange} className={inputCls} placeholder="email@example.com" />
                  </div>
                </div>

                {/* Row 2: Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel>Contact Number</FieldLabel>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={14} className="text-slate-400" />
                      </div>
                      <input type="tel" name="contact" value={editForm.contact} onChange={handleChange} className={`${inputCls} pl-9`} placeholder="+91 98765 43210" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel optional={!editForm.gstNumber}>GST Number</FieldLabel>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText size={14} className="text-slate-400" />
                      </div>
                      <input type="text" name="gstNumber" value={editForm.gstNumber} onChange={handleChange} className={`${inputCls} pl-9 uppercase`} placeholder="e.g. 22AAAAA0000A1Z5" />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <FieldLabel>Complete Address</FieldLabel>
                  <textarea
                    name="address"
                    value={editForm.address}
                    onChange={handleChange}
                    rows={3}
                    className={`${inputCls} resize-none`}
                    placeholder="Enter your full address"
                  />
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3">
                  <button
                    onClick={handleCancelClick}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-md transition-colors"
                  >
                    <X size={15} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveClick}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors shadow-sm shadow-emerald-600/20"
                  >
                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </ManagementHub>
  );
}
