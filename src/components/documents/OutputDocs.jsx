import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Briefcase, IndianRupee, Users, ClipboardList, House, Download, FileText } from 'lucide-react';
import SelectField from '../common/SelectField';
import ManagementTable from '../common/ManagementTable';
import ManagementCard from '../common/ManagementCard';
import ManagementGrid from '../common/ManagementGrid';
import Pagination, { usePagination } from '../common/PaginationComponent';
import { PageContentSkeleton } from '../SkeletonComponent';
import { apiCall } from '../../utils/apiCall';
import toast from 'react-hot-toast';

const categories = [
  { id: 'gst', label: 'GST', icon: IndianRupee },
  { id: 'mca', label: 'MCA', icon: Users },
  { id: 'task', label: 'Task', icon: ClipboardList },
];

// Generate last 7 financial years: e.g. 2024-25, 2023-24 ...
const currentFY = new Date().getFullYear();
const yearOptions = Array.from({ length: 7 }, (_, i) => {
  const start = currentFY - i;
  const label = `${start}-${String(start + 1).slice(-2)}`;
  return { label, value: label };
});

const monthOptions = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
].map((m) => ({ label: m, value: m }));

export default function OutputDocs() {
  const [activeCategory, setActiveCategory] = useState('gst');
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'card' : 'table');
  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 20);

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Firm dropdown state
  const [firmOptions, setFirmOptions] = useState([]);
  const [firmPage, setFirmPage] = useState(1);
  const [firmHasMore, setFirmHasMore] = useState(true);
  const [firmIsLoading, setFirmIsLoading] = useState(false);
  const [firmSearch, setFirmSearch] = useState('');
  const firmSearchTimerRef = useRef(null);
  const docsAbortRef = useRef(null);  // cancel in-flight document requests
  const firmAbortRef = useRef(null);  // cancel in-flight firm requests
  const typesAbortRef = useRef(null); // cancel in-flight types requests
  const firmLoadedRef = useRef(false);  // true once firms have been fetched at least once
  const typesLoadedRef = useRef(false); // true once types have been fetched at least once

  // Document Types from API
  const [documentTypes, setDocumentTypes] = useState({});

  useEffect(() => {
    const handleResize = () => setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch document types — lazy, called only on first open of types dropdown
  const fetchDocumentTypes = useCallback(async () => {
    if (typesAbortRef.current) typesAbortRef.current.abort();
    const controller = new AbortController();
    typesAbortRef.current = controller;
    try {
      const response = await apiCall('/document/types', 'GET', null, { signal: controller.signal });
      const data = await response.json();
      if (data.success) {
        setDocumentTypes(data.data || {});
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Failed to fetch document types:', error);
    }
  }, []);

  // Open types dropdown → fetch types once
  const handleTypeMenuOpen = () => {
    if (typesLoadedRef.current) return;
    typesLoadedRef.current = true;
    fetchDocumentTypes();
  };

  // Fetch firms for dropdown — lazy, with AbortController to prevent duplicate calls
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
        const options = (data.data || []).map((f) => ({
          label: f.firm_name,
          value: f.firm_id,
        }));
        if (append) {
          setFirmOptions((prev) => {
            const existingIds = new Set(prev.map((o) => o.value));
            return [...prev, ...options.filter((o) => !existingIds.has(o.value))];
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

  // Open firm dropdown → fetch firms once on first open
  const handleFirmMenuOpen = () => {
    if (firmLoadedRef.current) return;
    firmLoadedRef.current = true;
    fetchFirmOptions('', 1, false);
  };

  // Handle firm search with debounce
  // Guard: skip if firms haven't been loaded yet (onMenuOpen owns the first fetch)
  //        or if the input value hasn't actually changed (react-select fires '' on open)
  const handleFirmInputChange = (inputValue, { action } = {}) => {
    // react-select fires onInputChange with action='set-value' or 'input-blur' on select/blur
    // We only want to search on actual typing (action === 'input-change')
    if (action && action !== 'input-change') return;
    if (!firmLoadedRef.current) return; // first load is owned by onMenuOpen
    if (inputValue === firmSearch) return; // no real change

    setFirmSearch(inputValue);
    if (firmSearchTimerRef.current) clearTimeout(firmSearchTimerRef.current);
    firmSearchTimerRef.current = setTimeout(() => {
      setFirmPage(1);
      fetchFirmOptions(inputValue, 1, false);
    }, 300);
  };

  // Handle firm dropdown scroll to bottom → load next page
  const handleFirmMenuScrollToBottom = () => {
    if (!firmHasMore || firmIsLoading) return;
    const nextPage = firmPage + 1;
    setFirmPage(nextPage);
    fetchFirmOptions(firmSearch, nextPage, true);
  };

  // Fetch documents — cancel any previous in-flight request first
  const fetchDocuments = useCallback(async () => {
    // Abort previous request if still running
    if (docsAbortRef.current) {
      docsAbortRef.current.abort();
    }
    const controller = new AbortController();
    docsAbortRef.current = controller;

    setIsLoading(true);
    try {
      let queryParams = `?page_no=${pagination.page}&limit=${pagination.limit}`;
      if (selectedFirm)  queryParams += `&firm_id=${encodeURIComponent(selectedFirm.value)}`;
      if (selectedType)  queryParams += `&type=${encodeURIComponent(selectedType.value)}`;
      if (selectedYear)  queryParams += `&year=${encodeURIComponent(selectedYear.value)}`;
      if (selectedMonth) queryParams += `&month=${encodeURIComponent(selectedMonth.value)}`;

      const endpoint = `/document/list/${activeCategory}${queryParams}`;
      const response = await apiCall(endpoint, 'GET', null, { signal: controller.signal });
      const data = await response.json();

      if (response.ok && data.success !== false) {
        setDocuments(data.data || []);
        if (data.pagination) {
          updatePagination({ total: data.pagination.total });
        }
      } else {
        setDocuments([]);
        updatePagination({ total: 0 });
      }
    } catch (error) {
      if (error.name === 'AbortError') return; // Ignore cancelled requests
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, pagination.page, pagination.limit, selectedFirm, selectedType, selectedYear, selectedMonth]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 300);
    return () => {
      clearTimeout(timer);
      // Abort any in-flight request when dependencies change or component unmounts
      if (docsAbortRef.current) docsAbortRef.current.abort();
    };
  }, [fetchDocuments]);

  // Handle Category Change
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    goToPage(1);
    setSelectedType(null); // Reset type filter on category change
  };

  // Get options for SelectField based on active category
  const getTypeOptions = () => {
    const types = documentTypes[activeCategory] || [];
    return types.map(t => ({ label: t.name, value: t.value }));
  };

  const handleDownload = (fileUrl) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      toast.error('File URL not available');
    }
  };

  const tableColumns = [
    { key: 'firm_name', label: 'Firm Name', render: (row) => <span className="font-medium text-indigo-900 dark:text-indigo-200">{row.firm?.name || '-'}</span> },
    { key: 'f_year', label: 'Fin. Year', render: (row) => <span>{row.f_year || '-'}</span> },
    { key: 'month', label: 'Month', render: (row) => <span className="capitalize">{row.month || '-'}</span> },
    { key: 'type', label: 'Type', render: (row) => <span className="uppercase text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">{row.type || '-'}</span> },
    { key: 'remark', label: 'Remark', render: (row) => <span className="truncate max-w-[150px] inline-block" title={row.remark}>{row.remark || '-'}</span> },
    { key: 'date', label: 'Created At', render: (row) => <span className="text-sm">{row.create_date?.split(' ')[0] || '-'}</span> },
  ];

  const getRowActions = (row) => [
    { id: 'download', label: 'Download', icon: <Download size={14} />, color: 'blue', onClick: () => handleDownload(row.file) },
  ];

  return (
    <div>
      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => {
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

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-800">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Firm</label>
          <SelectField
            options={firmOptions}
            value={selectedFirm}
            onChange={(val) => { setSelectedFirm(val); goToPage(1); }}
            placeholder="Search & select firm..."
            isClearable
            isSearchable
            isLoading={firmIsLoading}
            onMenuOpen={handleFirmMenuOpen}
            onInputChange={handleFirmInputChange}
            onMenuScrollToBottom={handleFirmMenuScrollToBottom}
            filterOption={() => true}
            noOptionsMessage={() => firmIsLoading ? 'Loading...' : 'No firms found'}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Document Type</label>
          <SelectField
            options={getTypeOptions()}
            value={selectedType}
            onChange={(val) => { setSelectedType(val); goToPage(1); }}
            placeholder="Select Type..."
            isClearable
            onMenuOpen={handleTypeMenuOpen}
            isLoading={!typesLoadedRef.current && documentTypes[activeCategory] === undefined}
            noOptionsMessage={() => !typesLoadedRef.current ? 'Open to load types...' : 'No types found'}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
          <SelectField
            options={yearOptions}
            value={selectedYear}
            onChange={(val) => { setSelectedYear(val); goToPage(1); }}
            placeholder="Select year..."
            isClearable
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
          <SelectField
            options={monthOptions}
            value={selectedMonth}
            onChange={(val) => { setSelectedMonth(val); goToPage(1); }}
            placeholder="Select month..."
            isClearable
          />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <PageContentSkeleton viewMode={viewMode} columns={6} rows={6} />
      ) : documents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-10 text-center flex flex-col items-center">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No documents found</p>
        </div>
      ) : viewMode === 'table' ? (
        <ManagementTable
          columns={tableColumns}
          rows={documents}
          rowKey="id" // documents might not have a unique id in the example, we should use index or map them
          accent="emerald"
          getActions={getRowActions}
          onRowClick={(row) => handleDownload(row.file)}
        />
      ) : (
        <ManagementGrid viewMode={viewMode}>
          {documents.map((doc, idx) => (
            <ManagementCard
              key={idx}
              title={doc.firm?.name || 'Unknown Firm'}
              subtitle={doc.type?.toUpperCase()}
              accent="emerald"
              icon={<FileText size={16} />}
              badge={<span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{doc.f_year}</span>}
              actions={getRowActions(doc)}
              onClick={() => handleDownload(doc.file)}
            >
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1">
                <p>Month: <span className="capitalize text-slate-700 dark:text-slate-300">{doc.month || '-'}</span></p>
                <p>Created: <span className="text-slate-700 dark:text-slate-300">{doc.create_date?.split(' ')[0]}</span></p>
              </div>
            </ManagementCard>
          ))}
        </ManagementGrid>
      )}

      {documents.length > 0 && (
        <div className="mt-4">
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
