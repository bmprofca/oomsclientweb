import React, { useState, useEffect } from 'react';
import {
  User, MapPin, Phone, FileText,
  Building2, Mail
} from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
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
        address: userData.address || prev.address,
        gstNumber: userData.gstNumber || prev.gstNumber,
        profileImage: userData.profileImage || prev.profileImage,
      }));
    }
  }, [userData]);

  /* ---------- Section header ---------- */
  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/30">
      <Icon size={17} className="text-blue-500 shrink-0" />
      <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{title}</h3>
    </div>
  );

  /* ---------- Field label ---------- */
  const FieldLabel = ({ children }) => (
    <div className="flex items-center justify-between mb-1.5">
      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
        {children}
      </label>
    </div>
  );

  /* ---------- Read-only field value ---------- */
  const FieldValue = ({ children }) => (
    <p className="text-sm text-slate-900 dark:text-white font-medium">{children || '-'}</p>
  );

  return (
    <ManagementHub
      title="Employee Profile"
      description="View your personal information, address, and business details."
      accent="blue"
    >
      {/* ===== MAIN GRID ===== */}
      <div className="mt-4 flex flex-col lg:flex-row gap-5 items-start w-full">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col gap-4">

          {/* Profile card */}
          <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden w-full">
            {/* Cover strip */}
            <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600 w-full" />

            {/* Avatar + info */}
            <div className="flex flex-col items-center px-5 pb-5 -mt-10">
              <div className="relative w-20 h-20 rounded-md ring-4 ring-white dark:ring-slate-900 shadow-md mb-3">
                <div className="w-full h-full rounded-md bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 overflow-hidden flex items-center justify-center">
                  {profile.profileImage ? (
                    <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {profile.name.charAt(0)}
                    </span>
                  )}
                </div>
              </div>

              <h2 className="text-base font-bold text-slate-900 dark:text-white text-center leading-tight">{profile.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-0.5 truncate w-full">{profile.email}</p>
              <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {profile.role}
              </span>

              {/* Quick info chips */}
              <div className="mt-4 w-full space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-md px-3 py-2 w-full">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
                {profile.contact && (
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-md px-3 py-2 w-full">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span>{profile.contact}</span>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-md px-3 py-2 w-full">
                    <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{profile.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* ── RIGHT CONTENT ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 w-full">

          {/* Personal Details */}
          <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden w-full">
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
          <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden w-full">
            <SectionHeader icon={MapPin} title="Address Information" />
            <div className="p-5">
              <FieldLabel>Complete Address</FieldLabel>
              <FieldValue>{profile.address || 'No address provided'}</FieldValue>
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden w-full">
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

        </div>
      </div>
    </ManagementHub>
  );
}
