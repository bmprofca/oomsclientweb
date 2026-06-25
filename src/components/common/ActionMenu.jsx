import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { FaEllipsisV } from 'react-icons/fa';

/**
 * Standardized Action Menu component — renders via a Portal (fixed positioning).
 * AnimatePresence is intentionally omitted: it injects a ref through the portal
 * boundary which triggers a React "ref is not a prop" warning.
 *
 * @param {Array}    actions  - [{ label, icon, onClick, className, disabled, title }]
 * @param {String}   activeId - Current active menu ID (external control)
 * @param {Function} onToggle - (e, menuId) => void
 * @param {any}      menuId   - Unique id for this menu instance
 * @param {ReactNode}trigger  - Optional custom trigger element
 */
const ActionMenu = ({ actions = [], activeId, onToggle, menuId, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  // coords: viewport-relative (for position:fixed)
  // triggerTop = top of trigger button, triggerBottom = bottom of trigger button
  const [coords, setCoords] = useState({ triggerTop: 0, triggerBottom: 0, triggerRight: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const isMenuOpen = activeId !== undefined ? activeId === menuId : isOpen;

  const captureCoords = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        triggerTop: rect.top,
        triggerBottom: rect.bottom,
        triggerRight: rect.right,
      });
    }
  }, []);

  const closeMenu = useCallback(() => {
    if (onToggle) {
      onToggle(null, null);
    } else {
      setIsOpen(false);
    }
  }, [onToggle]);

  const toggleMenu = (e) => {
    e.stopPropagation();
    captureCoords();
    if (onToggle) {
      onToggle(e, menuId);
    } else {
      setIsOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        closeMenu();
      }
    };

    const handleScroll = () => captureCoords();
    const handleEscape = (e) => { if (e.key === 'Escape') closeMenu(); };

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isMenuOpen, captureCoords, closeMenu]);

  // ── Position (all viewport-relative for position:fixed) ──────────────────────
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const menuWidth = isMobile ? 120 : 192;
  const itemHeight = isMobile ? 28 : 44;
  const menuHeight = actions.length * itemHeight + 12;

  // Default: open below-right of trigger, aligned to right edge of trigger
  let top = coords.triggerBottom + 6;
  let left = coords.triggerRight - menuWidth;

  // Clamp horizontally
  if (left < 8) left = 8;
  if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;

  // Flip above if not enough room below
  if (top + menuHeight > window.innerHeight - 8) {
    top = coords.triggerTop - menuHeight - 6;
  }

  // Only portal-render when open (avoids constant re-animation / freezing)
  const menuPortal = isMenuOpen ? createPortal(
    <motion.div
      ref={menuRef}
      key={`action-menu-${String(menuId ?? 'default')}`}
      initial={{ opacity: 0, scale: 0.95, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.13, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 9999,
        width: `${menuWidth}px`,
      }}
      className="overflow-hidden rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 sm:p-1.5 shadow-xl shadow-slate-200/70 dark:shadow-gray-950/60 backdrop-blur-xl ring-1 ring-slate-900/5 dark:ring-white/10"
    >
      {actions.map((action, index) => (
        <button
          key={index}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!action.disabled) { action.onClick(); closeMenu(); }
          }}
          disabled={action.disabled}
          title={action.title || ''}
          className={`
            flex w-full items-center gap-1 sm:gap-3 rounded px-1.5 sm:px-3 py-1 sm:py-2.5 text-left text-[10px] sm:text-sm font-semibold
            transition-all duration-150
            ${action.disabled
              ? 'cursor-not-allowed opacity-50 text-gray-400 dark:text-gray-500'
              : action.className ||
              (action.danger || action.color === 'red'
                ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:pl-2 sm:hover:pl-4 hover:text-red-700 dark:hover:text-red-300'
                : action.color === 'green'
                  ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:pl-2 sm:hover:pl-4 hover:text-emerald-700 dark:hover:text-emerald-300'
                  : action.color === 'blue'
                    ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:pl-2 sm:hover:pl-4 hover:text-blue-700 dark:hover:text-blue-300'
                    : 'text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-800 hover:pl-2 sm:hover:pl-4 hover:text-indigo-600 dark:hover:text-indigo-300')
            }
          `}
        >
          {action.icon && <span className="flex-shrink-0 opacity-80">{action.icon}</span>}
          <span className="truncate">{action.label}</span>
        </button>
      ))}
    </motion.div>,
    document.body
  ) : null;

  return (
    <div className="relative inline-block text-left">
      <div ref={triggerRef} onClick={toggleMenu} className="cursor-pointer">
        {trigger || (
          <button
            type="button"
            className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md border border-slate-200 dark:border-gray-700
                       bg-white text-slate-500 dark:bg-gray-900 dark:text-gray-400 transition-all hover:border-indigo-300 dark:hover:border-indigo-600
                       hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300 hover:shadow-sm active:scale-95"
          >
            <FaEllipsisV className="h-3 w-3 sm:h-[14px] sm:w-[14px]" />
          </button>
        )}
      </div>

      {menuPortal}
    </div>
  );
};

export default ActionMenu;
