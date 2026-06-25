import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  IndianRupee, Users, ClipboardList,
  Download, FileText, CheckSquare, Square, X as XIcon,
} from 'lucide-react';
import SelectField from '../common/SelectField';
import Pagination, { usePagination } from '../common/PaginationComponent';
import { PageContentSkeleton } from '../SkeletonComponent';
import ManagementCard from '../common/ManagementCard';
import ManagementTable from '../common/ManagementTable';
import ManagementFilters from '../common/ManagementFilters';
import ManagementGrid from '../common/ManagementGrid';
import { apiCall } from '../../utils/apiCall';
import toast from 'react-hot-toast';

/* ─── Category tabs ─────────────────────────────────────── */
const categories = [
  { id: 'gst', label: 'GST', icon: IndianRupee },
  { id: 'mca', label: 'MCA', icon: Users },
  { id: 'it',  label: 'IT',  icon: ClipboardList },
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
  if (id === 'gst') return 'emerald';
  if (id === 'mca') return 'blue';
  return 'violet';
}

/* ─── Main Component ─────────────────────────────────────── */
export default function OutputDocs({ refreshTrigger }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'gst';

  const setActiveCategory = (categoryId) => {
    setSearchParams(prev => { prev.set('category', categoryId); return prev; });
  };

  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'card' : 'table');
  useEffect(() => {
    const onResize = () => setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 20);
  const [activeMenuId, setActiveMenuId] = useState(null);

  /* Bulk selection */
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  const [documents, setDocuments]   = useState([]);
  const [isLoading, setIsLoading]   = useState(true);

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
  const firmLoadedRef      = useRef(false);

  /* Document types */
  const [documentTypes,  setDocumentTypes]  = useState({});
  const [typesIsLoading, setTypesIsLoading] = useState(false);
  const typesLoadedRef = useRef(false);

  /* AbortControllers */
  const docsAbortRef  = useRef(null);
  const firmAbortRef  = useRef(null);
  const typesAbortRef = useRef(null);

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
      const response = await apiCall(`/firm/list?page_no=${page}&limit=20&search=${encodeURIComponent(search)}`, 'GET', null, { signal: controller.signal });
      const data = await response.json();
      if (response.ok && data.success !== false) {
        const options = (data.data || []).map(f => ({ label: f.firm_name, value: f.firm_id }));
        setFirmOptions(prev => append ? [...prev, ...options.filter(o => !prev.find(p => p.value === o.value))] : options);
        setFirmHasMore(page * 20 < (data.pagination?.total ?? 0));
      } else {
        if (!append) setFirmOptions([]);
        setFirmHasMore(false);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (!append) setFirmOptions([]);
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
    if (!firmLoadedRef.current || inputValue === firmSearch) return;
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
      let q = `?page_no=${pagination.page}&limit=${pagination.limit}`;
      if (selectedFirm?.value  != null) q += `&firm_id=${encodeURIComponent(selectedFirm.value)}`;
      if (selectedType?.value  != null) q += `&type=${encodeURIComponent(selectedType.value)}`;
      if (selectedYear?.value  != null) q += `&year=${encodeURIComponent(selectedYear.value)}`;
      if (selectedMonth?.value != null) q += `&month=${encodeURIComponent(selectedMonth.value)}`;

      const response = await apiCall(`/document/list/${activeCategory}${q}`, 'GET', null, { signal: controller.signal });
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
      toast.error('Failed to load documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, pagination.page, pagination.limit, selectedFirm, selectedType, selectedYear, selectedMonth]);

  useEffect(() => {
    const timer = setTimeout(fetchDocuments, 300);
    return () => { clearTimeout(timer); docsAbortRef.current?.abort(); };
  }, [fetchDocuments, refreshTrigger]);

  /* Clear selection when documents change */
  useEffect(() => { setSelectedIds(new Set()); }, [documents]);

  /* ── Download ── */
  const handleDownload = async (fileUrl, firmName) => {
    if (!fileUrl) { toast.error('File URL not available'); return; }
    const toastId = toast.loading('Downloading...');
    try {
      const resp = await fetch(fileUrl);
      if (!resp.ok) throw new Error('Network error');
      const blob = await resp.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      const ext  = fileUrl.split('?')[0].split('.').pop() || 'document';
      a.download = firmName ? `${firmName}.${ext}` : fileUrl.split('/').pop().split('?')[0] || 'document';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded successfully', { id: toastId });
    } catch {
      toast.dismiss(toastId);
      const a = document.createElement('a');
      a.href = fileUrl;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    goToPage(1);
    setSelectedType(ALL_TYPES);
    setSelectedIds(new Set());
  };

  /* ── Bulk selection helpers ── */
  const getDocId = (doc, idx) => doc.id ?? idx;

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = documents.length > 0 && documents.every((d, i) => selectedIds.has(getDocId(d, i)));
  const someSelected = !allSelected && documents.some((d, i) => selectedIds.has(getDocId(d, i)));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map((d, i) => getDocId(d, i))));
    }
  };

  const handleBulkDownload = async () => {
    const selected = documents.filter((d, i) => selectedIds.has(getDocId(d, i))).filter(d => d.file);
    if (!selected.length) { toast.error('No downloadable files selected'); return; }
    setIsBulkDownloading(true);
    const toastId = toast.loading(`Downloading 0 / ${selected.length}…`);
    let done = 0;
    for (const doc of selected) {
      try {
        const resp = await fetch(doc.file);
        if (!resp.ok) throw new Error();
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = doc.file.split('?')[0].split('.').pop() || 'document';
        a.download = doc.firm?.name ? `${doc.firm.name}.${ext}` : doc.file.split('/').pop().split('?')[0] || 'document';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch {
        // silently skip failures
      }
      done++;
      toast.loading(`Downloading ${done} / ${selected.length}…`, { id: toastId });
    }
    toast.success(`Downloaded ${done} file${done !== 1 ? 's' : ''}`, { id: toastId });
    setIsBulkDownloading(false);
    setSelectedIds(new Set());
  };

  const getTypeOptions = () => {
    const types = documentTypes[activeCategory] || [];
    return [ALL_TYPES, ...types.map(t => ({ label: t.name, value: t.value }))];
  };

  const accent = accentForCategory(activeCategory);

  /* ── Table columns (checkbox + data) ── */
  const checkboxColumn = {
    key: '__select__',
    label: (
      <button onClick={toggleSelectAll} className="flex items-center justify-center">
        {allSelected
          ? <CheckSquare size={16} className="text-emerald-500" />
          : someSelected
            ? <CheckSquare size={16} className="text-emerald-300" />
            : <Square size={16} className="text-slate-400" />}
      </button>
    ),
    headerClassName: 'w-10 text-center',
    className: 'w-10 text-center',
    render: (row, idx) => {
      const id = getDocId(row, idx);
      return (
        <button onClick={(e) => { e.stopPropagation(); toggleSelect(id); }} className="flex items-center justify-center">
          {selectedIds.has(id)
            ? <CheckSquare size={16} className="text-emerald-500" />
            : <Square size={16} className="text-slate-300 hover:text-slate-500" />}
        </button>
      );
    },
  };

  const tableColumns = [
    checkboxColumn,
    {
      key: 'firm',
      label: 'Firm',
      render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.firm?.name || '-'}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => row.type
        ? <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{row.type}</span>
        : <span className="text-slate-400">-</span>,
    },
    {
      key: 'f_year',
      label: 'FY',
      render: (row) => <span>{row.f_year || '-'}</span>,
    },
    {
      key: 'month',
      label: 'Month',
      render: (row) => <span className="capitalize">{row.month || '-'}</span>,
    },
    {
      key: 'create_by',
      label: 'Uploaded By',
      render: (row) => <span>{row.create_by?.name || '-'}</span>,
    },
    {
      key: 'create_date',
      label: 'Date',
      render: (row) => <span>{row.create_date ? row.create_date.slice(0, 10) : '-'}</span>,
    },
  ];

  const getRowActions = (row) => [
    {
      id: 'download',
      label: 'Download',
      icon: <Download size={14} />,
      color: 'green',
      onClick: () => handleDownload(row.file, row.firm?.name),
    },
  ];

  /* ── Extra filter selects passed into ManagementFilters ── */
  const extraFilters = [
    {
      value: selectedFirm,
      onChange: (val) => { setSelectedFirm(val ?? ALL_FIRMS); goToPage(1); },
      options: [ALL_FIRMS, ...firmOptions],
      placeholder: 'All Firms',
      isSearchable: true,
      isLoading: firmIsLoading,
      onMenuOpen: handleFirmMenuOpen,
      onInputChange: handleFirmInputChange,
      onMenuScrollToBottom: handleFirmMenuScrollToBottom,
      filterOption: () => true,
      noOptionsMessage: () => firmIsLoading ? 'Loading...' : 'No firms found',
    },
    {
      value: selectedType,
      onChange: (val) => { setSelectedType(val ?? ALL_TYPES); goToPage(1); },
      options: getTypeOptions(),
      placeholder: 'All Types',
      onMenuOpen: handleTypeMenuOpen,
      isLoading: typesIsLoading,
      noOptionsMessage: () => typesIsLoading ? 'Loading...' : 'No types found',
    },
    {
      value: selectedYear,
      onChange: (val) => { setSelectedYear(val ?? ALL_FY); goToPage(1); },
      options: [ALL_FY, ...yearOptions],
      placeholder: 'All FY',
    },
    {
      value: selectedMonth,
      onChange: (val) => { setSelectedMonth(val ?? ALL_MONTHS); goToPage(1); },
      options: [ALL_MONTHS, ...monthOptions],
      placeholder: 'All Months',
    },
  ];

  return (
    <div className="flex flex-col gap-4">

      {/* ── Category Tabs ── */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`flex items-center px-4 py-2 rounded-md border transition-all duration-200 text-sm font-medium ${
                isActive
                  ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-400'
                  : 'border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-500 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Filters + View Switcher ── */}
      <ManagementFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filters={extraFilters}
        searchPlaceholder="Search documents..."
      />

      {/* ── Bulk Download Bar ── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {selectedIds.size} document{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDownload}
              disabled={isBulkDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold rounded-md transition-colors"
            >
              {isBulkDownloading
                ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Download size={13} />}
              {isBulkDownloading ? 'Downloading…' : 'Download Selected'}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="flex items-center gap-1 px-2 py-1.5 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-md text-xs transition-colors"
            >
              <XIcon size={13} /> Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <PageContentSkeleton viewMode={viewMode} columns={4} rows={8} />
      ) : documents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-14 text-center flex flex-col items-center gap-3">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No documents found</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm">Try adjusting your filters above.</p>
        </div>
      ) : viewMode === 'table' ? (
        <ManagementTable
          responsive="scroll"
          columns={tableColumns}
          rows={documents}
          rowKey={(row, idx) => row.id ?? idx}
          accent={accent}
          getActions={getRowActions}
          activeId={activeMenuId}
          onToggleAction={(e, id) => setActiveMenuId(id)}
        />
      ) : (
        <ManagementGrid viewMode={viewMode}>
          {documents.map((doc, idx) => {
            const id = getDocId(doc, idx);
            const isSelected = selectedIds.has(id);
            return (
              <div key={id} className="relative">
                {/* Selection checkbox overlay */}
                <button
                  onClick={() => toggleSelect(id)}
                  className={`absolute top-2 left-2 z-10 rounded-md p-0.5 transition-colors ${
                    isSelected ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-500'
                  }`}
                >
                  {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <ManagementCard
                  title={doc.firm?.name || 'Unknown Firm'}
                  subtitle={doc.f_year ? `FY: ${doc.f_year}` : ''}
                  accent={isSelected ? 'emerald' : accent}
                  icon={<FileText size={16} />}
                  badge={
                    doc.type && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {doc.type}
                      </span>
                    )
                  }
                  actions={getRowActions(doc)}
                  menuId={`menu-${id}`}
                  activeId={activeMenuId}
                  onToggle={(e, mid) => setActiveMenuId(mid)}
                >
                  <div className="mt-2 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Month</span>
                    <span className="capitalize font-semibold text-slate-600 dark:text-slate-300">{doc.month || '-'}</span>
                  </div>
                  <div className="mt-1 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Created By</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[130px]">{doc.create_by?.name || '-'}</span>
                  </div>
                </ManagementCard>
              </div>
            );
          })}
        </ManagementGrid>
      )}

      {/* ── Pagination ── */}
      {documents.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={goToPage}
          onLimitChange={changeLimit}
        />
      )}
    </div>
  );
}