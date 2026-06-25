import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  IndianRupee, Users, ClipboardList,
  Download, FileText, Eye, X, ExternalLink,
  Calendar, Building2, Tag, StickyNote,
  FileSpreadsheet, File as FileIcon, User
} from 'lucide-react';
import SelectField from '../common/SelectField';
import Pagination, { usePagination } from '../common/PaginationComponent';
import { PageContentSkeleton } from '../SkeletonComponent';
import Modal from '../common/Modal';
import { apiCall } from '../../utils/apiCall';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

/* ─── Category tabs ─────────────────────────────────────── */
const categories = [
  { id: 'gst', label: 'GST',  icon: IndianRupee },
  { id: 'mca', label: 'MCA',  icon: Users        },
  { id: 'it', label: 'IT', icon: ClipboardList },
];

/* ─── Year / Month options ───────────────────────────────── */
const currentFY = new Date().getFullYear();
const yearOptions = Array.from({ length: 7 }, (_, i) => {
  const start = currentFY - i;
  const label = `${start}-${String(start + 1).slice(-2)}`;
  return { label, value: label };
});

const monthOptions = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
].map(m => ({ label: m, value: m }));

/* ─── "All" sentinel options (value:null → no filter sent to API) ─── */
const ALL_FIRMS  = { label: 'All Firms',  value: null };
const ALL_TYPES  = { label: 'All Types',  value: null };
const ALL_FY     = { label: 'All FY',     value: null };
const ALL_MONTHS = { label: 'All Months', value: null };

/* ─── Helpers ────────────────────────────────────────────── */
function getFileType(url = '') {
  const ext = url.split('?')[0].split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['xls','xlsx','csv'].includes(ext)) return 'excel';
  if (['doc','docx'].includes(ext)) return 'word';
  return 'other';
}

function accentForCategory(id) {
  if (id === 'gst')  return { tag: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', border: 'border-emerald-400', dot: 'bg-emerald-500' };
  if (id === 'mca')  return { tag: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',     border: 'border-blue-400',    dot: 'bg-blue-500'    };
  return               { tag: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', border: 'border-violet-400', dot: 'bg-violet-500' };
}

/* ─── Document Card ──────────────────────────────────────── */
function DocCard({ doc, activeCategory, onDownload }) {
  const accent = accentForCategory(activeCategory);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.22 }}
      className={`group relative flex flex-col bg-white dark:bg-gray-800 rounded-xl border-l-4 ${accent.border} border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-64`}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start gap-2 bg-white dark:bg-gray-800">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm line-clamp-2 leading-tight" title={doc.firm?.name}>
          {doc.firm?.name || 'Unknown Firm'}
        </h3>
        {doc.type && (
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${accent.tag}`}>
            {doc.type}
          </span>
        )}
      </div>

      {/* Body / File Preview */}
      <div 
        className="w-full flex-1 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center overflow-hidden cursor-pointer group-hover:bg-slate-100 dark:group-hover:bg-slate-900/70 transition-colors relative"
        onClick={() => onDownload(doc.file, doc.firm?.name)}
      >
        {(doc.mime_type?.startsWith('image/') || getFileType(doc.file) === 'image') ? (
          <img src={doc.file} alt={doc.firm?.name || 'Document'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : doc.mime_type?.includes('pdf') || getFileType(doc.file) === 'pdf' ? (
          <div className="flex flex-col items-center justify-center text-red-500 dark:text-red-400 group-hover:scale-110 transition-transform duration-300">
            <FileText size={40} />
          </div>
        ) : doc.mime_type?.includes('spreadsheet') || doc.mime_type?.includes('excel') || ['excel'].includes(getFileType(doc.file)) ? (
          <div className="flex flex-col items-center justify-center text-green-600 dark:text-green-500 group-hover:scale-110 transition-transform duration-300">
            <FileSpreadsheet size={40} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-blue-600 dark:text-blue-500 group-hover:scale-110 transition-transform duration-300">
            <FileIcon size={40} />
          </div>
        )}

        {/* Overlay download icon on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white text-gray-900 rounded-full p-3 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
            <Download size={20} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <User size={14} />
          <span className="truncate max-w-[110px]" title={doc.create_by?.name}>
            {doc.create_by?.name || 'Unknown'}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(doc.file, doc.firm?.name); }}
          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-md text-xs font-semibold transition-colors shadow-sm"
        >
          <Download size={14} /> Download
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function OutputDocs({ refreshTrigger }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'gst';

  const setActiveCategory = (categoryId) => {
    setSearchParams(prev => {
      prev.set('category', categoryId);
      return prev;
    });
  };

  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 20);

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /* Filters — default to the "All …" sentinel so the dropdown shows a label immediately */
  const [selectedFirm,  setSelectedFirm]  = useState(ALL_FIRMS);
  const [selectedType,  setSelectedType]  = useState(ALL_TYPES);
  const [selectedYear,  setSelectedYear]  = useState(ALL_FY);
  const [selectedMonth, setSelectedMonth] = useState(ALL_MONTHS);

  /* Firm dropdown */
  const [firmOptions,   setFirmOptions]   = useState([]);
  const [firmPage,      setFirmPage]      = useState(1);
  const [firmHasMore,   setFirmHasMore]   = useState(true);
  const [firmIsLoading, setFirmIsLoading] = useState(false);
  const [firmSearch,    setFirmSearch]    = useState('');
  const firmSearchTimerRef = useRef(null);

  /* AbortControllers */
  const docsAbortRef  = useRef(null);
  const firmAbortRef  = useRef(null);
  const typesAbortRef = useRef(null);

  /* Lazy-load guards */
  const firmLoadedRef  = useRef(false);
  const typesLoadedRef = useRef(false);

  /* Document types */
  const [documentTypes,   setDocumentTypes]   = useState({});
  const [typesIsLoading,  setTypesIsLoading]  = useState(false);

  /* ── Fetch document types ── */
  const fetchDocumentTypes = useCallback(async () => {
    if (typesAbortRef.current) typesAbortRef.current.abort();
    const controller = new AbortController();
    typesAbortRef.current = controller;
    setTypesIsLoading(true);
    try {
      const response = await apiCall('/document/types', 'GET', null, { signal: controller.signal });
      const data = await response.json();
      if (data.success) setDocumentTypes(data.data || {});
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Failed to fetch document types:', err);
    } finally {
      setTypesIsLoading(false);
    }
  }, []);

  const handleTypeMenuOpen = () => {
    if (typesLoadedRef.current) return;
    typesLoadedRef.current = true;
    fetchDocumentTypes();
  };

  /* ── Fetch firms ── */
  const fetchFirmOptions = useCallback(async (search = '', page = 1, append = false) => {
    if (firmAbortRef.current) firmAbortRef.current.abort();
    const controller = new AbortController();
    firmAbortRef.current = controller;
    setFirmIsLoading(true);
    try {
      const endpoint = `/firm/list?page_no=${page}&limit=20&search=${encodeURIComponent(search)}`;
      const response = await apiCall(endpoint, 'GET', null, { signal: controller.signal });
      const data = await response.json();
      if (response.ok && data.success !== false) {
        const options = (data.data || []).map(f => ({ label: f.firm_name, value: f.firm_id }));
        if (append) {
          setFirmOptions(prev => {
            const ids = new Set(prev.map(o => o.value));
            return [...prev, ...options.filter(o => !ids.has(o.value))];
          });
        } else {
          setFirmOptions(options);
        }
        const total = data.pagination?.total ?? 0;
        setFirmHasMore(page * 20 < total);
      } else {
        if (!append) setFirmOptions([]);
        setFirmHasMore(false);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Failed to load firms:', err);
      if (!append) setFirmOptions([]);
      setFirmHasMore(false);
    } finally {
      setFirmIsLoading(false);
    }
  }, []);

  const handleFirmMenuOpen = () => {
    if (firmLoadedRef.current) return;
    firmLoadedRef.current = true;
    fetchFirmOptions('', 1, false);
  };

  const handleFirmInputChange = (inputValue, { action } = {}) => {
    if (action && action !== 'input-change') return;
    if (!firmLoadedRef.current) return;
    if (inputValue === firmSearch) return;
    setFirmSearch(inputValue);
    if (firmSearchTimerRef.current) clearTimeout(firmSearchTimerRef.current);
    firmSearchTimerRef.current = setTimeout(() => {
      setFirmPage(1);
      fetchFirmOptions(inputValue, 1, false);
    }, 300);
  };

  const handleFirmMenuScrollToBottom = () => {
    if (!firmHasMore || firmIsLoading) return;
    const nextPage = firmPage + 1;
    setFirmPage(nextPage);
    fetchFirmOptions(firmSearch, nextPage, true);
  };

  /* ── Fetch documents ── */
  const fetchDocuments = useCallback(async () => {
    if (docsAbortRef.current) docsAbortRef.current.abort();
    const controller = new AbortController();
    docsAbortRef.current = controller;
    setIsLoading(true);
    try {
      let queryParams = `?page_no=${pagination.page}&limit=${pagination.limit}`;
      if (selectedFirm?.value  != null) queryParams += `&firm_id=${encodeURIComponent(selectedFirm.value)}`;
      if (selectedType?.value  != null) queryParams += `&type=${encodeURIComponent(selectedType.value)}`;
      if (selectedYear?.value  != null) queryParams += `&year=${encodeURIComponent(selectedYear.value)}`;
      if (selectedMonth?.value != null) queryParams += `&month=${encodeURIComponent(selectedMonth.value)}`;

      const endpoint = `/document/list/${activeCategory}${queryParams}`;
      const response = await apiCall(endpoint, 'GET', null, { signal: controller.signal });
      const data = await response.json();

      if (response.ok && data.success !== false) {
        setDocuments(data.data || []);
        if (data.pagination) updatePagination({ total: data.pagination.total });
      } else {
        setDocuments([]);
        updatePagination({ total: 0 });
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, pagination.page, pagination.limit, selectedFirm, selectedType, selectedYear, selectedMonth]);

  useEffect(() => {
    const timer = setTimeout(fetchDocuments, 300);
    return () => {
      clearTimeout(timer);
      if (docsAbortRef.current) docsAbortRef.current.abort();
    };
  }, [fetchDocuments, refreshTrigger]);

  /* ── Handlers ── */
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    goToPage(1);
    setSelectedType(ALL_TYPES); // reset type sentinel on category change
  };

  const handleDownload = async (fileUrl, firmName) => {
    if (!fileUrl) { toast.error('File URL not available'); return; }
    const toastId = toast.loading('Downloading...');
    try {
      const resp = await fetch(fileUrl);
      if (!resp.ok) throw new Error('Network response was not ok');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = fileUrl.split('?')[0].split('.').pop() || 'document';
      a.download = firmName ? `${firmName}.${ext}` : fileUrl.split('/').pop().split('?')[0] || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded successfully', { id: toastId });
    } catch (err) {
      console.error('Direct download failed, falling back:', err);
      toast.dismiss(toastId);
      // Fallback
      const a = document.createElement('a');
      a.href = fileUrl;
      const ext = fileUrl.split('?')[0].split('.').pop() || 'document';
      a.download = firmName ? `${firmName}.${ext}` : fileUrl.split('/').pop().split('?')[0] || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getTypeOptions = () => {
    const types = documentTypes[activeCategory] || [];
    return [ALL_TYPES, ...types.map(t => ({ label: t.name, value: t.value }))];
  };

  /* ── Render ── */
  return (
    <div>
      {/* ── Category Tabs ── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`flex items-center px-4 py-2 rounded-md border transition-all duration-200 ${
                isActive
                  ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-400'
                  : 'border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-500 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-700'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              <span className="font-medium text-sm">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6 p-2.5 sm:p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-800">
        <div>
          <SelectField
            options={[ALL_FIRMS, ...firmOptions]}
            value={selectedFirm}
            onChange={val => { setSelectedFirm(val ?? ALL_FIRMS); goToPage(1); }}
            placeholder="All Firms"
            isSearchable
            isLoading={firmIsLoading}
            onMenuOpen={handleFirmMenuOpen}
            onInputChange={handleFirmInputChange}
            onMenuScrollToBottom={handleFirmMenuScrollToBottom}
            filterOption={(opt, input) => opt.data.value === null || true}
            noOptionsMessage={() => firmIsLoading ? 'Loading...' : 'No firms found'}
          />
        </div>
        <div>
          <SelectField
            options={getTypeOptions()}
            value={selectedType}
            onChange={val => { setSelectedType(val ?? ALL_TYPES); goToPage(1); }}
            placeholder="All Types"
            onMenuOpen={handleTypeMenuOpen}
            isLoading={typesIsLoading}
            noOptionsMessage={() => typesIsLoading ? 'Loading...' : 'No types found'}
          />
        </div>
        <div>
          <SelectField
            options={[ALL_FY, ...yearOptions]}
            value={selectedYear}
            onChange={val => { setSelectedYear(val ?? ALL_FY); goToPage(1); }}
            placeholder="All FY"
          />
        </div>
        <div>
          <SelectField
            options={[ALL_MONTHS, ...monthOptions]}
            value={selectedMonth}
            onChange={val => { setSelectedMonth(val ?? ALL_MONTHS); goToPage(1); }}
            placeholder="All Months"
          />
        </div>
      </div>

      {/* ── Results ── */}
      {isLoading ? (
        <PageContentSkeleton viewMode="card" columns={4} rows={8} />
      ) : documents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-14 text-center flex flex-col items-center gap-3">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No documents found</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm">Try adjusting your filters above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
          <AnimatePresence>
            {documents.map((doc, idx) => (
              <DocCard
                key={doc.id ?? idx}
                doc={doc}
                activeCategory={activeCategory}
                onDownload={handleDownload}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Pagination ── */}
      {documents.length > 0 && (
        <div className="mt-5">
          <Pagination
            currentPage={pagination.page}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={goToPage}
            onLimitChange={changeLimit}
          />
        </div>
      )}

    </div>
  );
}
