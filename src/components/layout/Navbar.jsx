import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  User,
  ChevronDown,
  Settings,
  LogOut,
  Sun,
  Moon,
  Bell,
  Users,
  LifeBuoy
} from 'lucide-react';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = ({
  toggleSidebar,
  isMobile,
  sidebarOpen,
  isDesktopSidebarExpanded,
}) => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { userData, logout, openProfileModal } = useAuth();

  const handleLogout = async () => {
    logout();
  };

  const isSidebarOpen = isMobile ? sidebarOpen : isDesktopSidebarExpanded;

  return (
    <>
      <nav className="sticky top-0 z-40 h-16 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-950/50 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="px-2 sm:px-4 h-full">
          <div className="flex items-center justify-between h-full">

            {/* Left section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={toggleSidebar}
                className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-md transition-all duration-200 focus:outline-none flex-shrink-0
                  ${isSidebarOpen ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                aria-label="Toggle menu"
              >
                {isSidebarOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 sm:gap-2 rounded-md transition-opacity duration-200 hover:opacity-90 focus:outline-none"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-md flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-xs sm:text-sm">O</span>
                </div>
                <div>
                  <span className="text-base sm:text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                    OOMS<span className="font-light text-gray-600 dark:text-gray-400">Client</span>
                  </span>
                </div>
              </button>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              
              {/* Notification Button */}
              <button
                onClick={() => navigate('/notification')}
                className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-md transition-all duration-300 focus:outline-none
                  bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/40
                  text-indigo-600 dark:text-indigo-400 font-medium text-sm
                  border border-indigo-100 dark:border-indigo-800/50 active:scale-95"
                aria-label="View notifications"
                title="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-slate-600 dark:text-slate-200 transition-colors duration-200" />
                <span className="sr-only">Notifications</span>
              </button>



              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-md transition-all duration-300 group focus:outline-none
                  bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/40
                  text-indigo-600 dark:text-indigo-400 font-medium text-sm
                  border border-indigo-100 dark:border-indigo-800/50 active:scale-95"
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                id="theme-toggle-btn"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-amber-400 group-hover:text-amber-300 transition-colors duration-200" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-slate-600 group-hover:text-indigo-600 transition-colors duration-200" />
                )}
              </button>

              {/* Desktop Switch Profile Button */}
              <button
                onClick={openProfileModal}
                className="hidden md:flex items-center gap-2 px-3 h-10 rounded-md transition-all duration-300 group focus:outline-none
                  bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/40
                  text-indigo-600 dark:text-indigo-400 font-medium text-sm
                  border border-indigo-100 dark:border-indigo-800/50"
                aria-label="Switch Profile"
              >
                <Users className="w-4 h-4" />
                Switch Profile
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(!openDropdown)}
                  className="flex items-center space-x-1.5 sm:space-x-3 p-1.5 sm:p-1.5 sm:pr-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md overflow-hidden flex items-center justify-center shadow-md bg-gradient-to-br from-blue-500 to-indigo-600">
                      <span className="text-white font-bold text-xs sm:text-sm">
                        {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    {/* Online dot */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-3 sm:h-3 bg-emerald-400 border-2 border-white dark:border-gray-900 rounded-full"></div>
                  </div>

                  <div className="hidden md:block text-left max-w-[120px]">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {userData?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {userData?.branch?.name || userData?.email || 'No Branch'}
                    </p>
                  </div>

                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors hidden md:block" />
                </button>

                {/* Dropdown Menu */}
                {openDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(false)} />
                    <div className="absolute right-0 mt-1 sm:mt-2 w-44 sm:w-56 bg-white dark:bg-gray-800 rounded-md shadow-xl dark:shadow-gray-950/50 border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                      {/* Mobile user info */}
                      <div className="md:hidden p-2.5 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-100 truncate">{userData?.name || 'User'}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{userData?.branch?.name || userData?.email || 'No Branch'}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => { setOpenDropdown(false); openProfileModal(); }}
                        className="md:hidden w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center gap-2 sm:gap-3"
                      >
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Switch Profile
                      </button>

                      <button
                        onClick={() => { setOpenDropdown(false); navigate('/profile'); }}
                        className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 sm:gap-3"
                      >
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                        My Profile
                      </button>

                      <button
                        onClick={() => { setOpenDropdown(false); navigate('/support'); }}
                        className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 sm:gap-3"
                      >
                        <LifeBuoy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                        Help & Support
                      </button>

                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 sm:gap-3"
                      >
                        <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;