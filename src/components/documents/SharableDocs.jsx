import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, Trash2, FileText, Download, CheckCircle, User, Building2,
  CheckSquare, Square, X as XIcon,
} from 'lucide-react';
import SelectField from '../common/SelectField';
import Pagination, { usePagination } from '../common/PaginationComponent';
import { PageContentSkeleton } from '../SkeletonComponent';
import Modal from '../common/Modal';
import ManagementCard from '../common/ManagementCard';
import ManagementTable from '../common/ManagementTable';
import ManagementFilters from '../common/ManagementFilters';
import ManagementGrid from '../common/ManagementGrid';
import { apiCall, uploadFile } from '../../utils/apiCall';
import toast from 'react-hot-toast';

const ALL_FIRMS = { label: 'All Firms', value: '' };

/* ─── Helpers ────────────────────────────────────────────── */
function getFileType(url = '', mimeType = '') {
  if (mimeType.startsWith('image/')) return 'image';
  const ext = url.split('?')[0].split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return 'image';
  if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf';
  if (['xls','xlsx'].includes(ext) || mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'excel';
  if (['doc','docx'].includes(ext) || mimeType.includes('wordprocessingml') || mimeType.includes('msword')) return 'word';
  if (ext === 'csv' || mimeType === 'text/csv') return 'csv';
  return 'other';
}


async function triggerDownload(fileUrl, fileName) {
  if (!fileUrl) return;
  try {
    const resp = await fetch(fileUrl);
    const blob = await resp.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = fileName || 'document';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch {
    const a = document.createElement('a');
    a.href = fileUrl; a.download = fileName || 'document';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
}

/* ─── Main Component ─────────────────────────────────────── */
export default function SharableDocs({ refreshTrigger, onUploadClick, uploadTrigger }) {
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

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedFirm, setSelectedFirm] = useState(ALL_FIRMS);

  /* Firm dropdown */
  const [firmOptions,   setFirmOptions]   = useState([]);
  const [firmPage,      setFirmPage]      = useState(1);
  const [firmHasMore,   setFirmHasMore]   = useState(true);
  const [firmIsLoading, setFirmIsLoading] = useState(false);
  const [firmSearch,    setFirmSearch]    = useState('');
  const firmSearchTimerRef = useRef(null);
  const firmLoadedRef      = useRef(false);

  const docsAbortRef = useRef(null);
  const firmAbortRef = useRef(null);

  /* Upload state */
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Open modal when parent header Upload button is clicked
  useEffect(() => {
    if (uploadTrigger > 0) setIsUploadModalOpen(true);
  }, [uploadTrigger]);
  const [uploadFirm,        setUploadFirm]        = useState(null);
  const [uploadName,        setUploadName]        = useState('');
  const [uploadRemark,      setUploadRemark]      = useState('');
  const [uploadFileObj,     setUploadFileObj]     = useState(null);
  const [uploadedFileUrl,   setUploadedFileUrl]   = useState(null);
  const [isFileUploading,   setIsFileUploading]   = useState(false);
  const [isUploading,       setIsUploading]       = useState(false);
  const [isDragging,        setIsDragging]        = useState(false);
  const fileInputRef = useRef(null);

  /* Delete state */
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeleting,  setIsDeleting]  = useState(false);

  /* Download state */
  const [downloading, setDownloading] = useState(null);

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
      const firmId = selectedFirm?.value || '';
      const endpoint = `/document/sharable/list?page_no=${pagination.page}&limit=${pagination.limit}&firm_id=${encodeURIComponent(firmId)}&search=${encodeURIComponent(searchQuery)}`;
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
      toast.error('Failed to load sharable documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, selectedFirm, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(fetchDocuments, 300);
    return () => { clearTimeout(timer); docsAbortRef.current?.abort(); };
  }, [fetchDocuments, refreshTrigger]);

  /* Clear selection when documents change */
  useEffect(() => { setSelectedIds(new Set()); }, [documents]);

  /* ── File upload ── */
  const handleFileSelect = async (file) => {
    if (!file) return;
    setUploadFileObj(file);
    setIsFileUploading(true);
    setUploadedFileUrl(null);
    try {
      const url = await uploadFile(file);
      setUploadedFileUrl(url);
    } catch (e) {
      toast.error(e.message || 'File upload failed');
      setUploadFileObj(null);
    } finally {
      setIsFileUploading(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFirm || !uploadName || !uploadedFileUrl) {
      toast.error('Firm, Document Name, and File are required');
      return;
    }
    setIsUploading(true);
    try {
      const response = await apiCall('/document/sharable/create', 'POST', {
        url: uploadedFileUrl,
        name: uploadName,
        firm_id: uploadFirm.value,
        remark: uploadRemark,
      });
      const data = await response.json();
      if (response.ok && data.success !== false) {
        toast.success(data.message || 'Document uploaded successfully');
        setIsUploadModalOpen(false);
        setUploadFirm(null); setUploadName(''); setUploadRemark('');
        setUploadFileObj(null); setUploadedFileUrl(null);
        fetchDocuments();
      } else {
        toast.error(data.message || 'Failed to create sharable document');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      const response = await apiCall(`/document/sharable/delete/${docToDelete.id || docToDelete.document_id}`, 'DELETE');
      const data = await response.json();
      if (response.ok && data.success !== false) {
        toast.success(data.message || 'Document deleted');
        setDocToDelete(null);
        fetchDocuments();
      } else {
        toast.error(data.message || 'Failed to delete document');
      }
    } catch {
      toast.error('An error occurred during deletion');
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── Download ── */
  const handleDownload = async (doc) => {
    const fileUrl = doc.file || doc.url;
    if (!fileUrl) { toast.error('File URL not available'); return; }
    setDownloading(doc.document_id);
    await triggerDownload(fileUrl, doc.name || 'document');
    setDownloading(null);
  };

  /* ── Bulk selection helpers ── */
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = documents.length > 0 && documents.every(d => selectedIds.has(d.document_id));
  const someSelected = !allSelected && documents.some(d => selectedIds.has(d.document_id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map(d => d.document_id)));
    }
  };

  const handleBulkDownload = async () => {
    const selected = documents.filter(d => selectedIds.has(d.document_id)).filter(d => d.file || d.url);
    if (!selected.length) { toast.error('No downloadable files selected'); return; }
    setIsBulkDownloading(true);
    const toastId = toast.loading(`Downloading 0 / ${selected.length}…`);
    let done = 0;
    for (const doc of selected) {
      await triggerDownload(doc.file || doc.url, doc.name || 'document');
      done++;
      toast.loading(`Downloading ${done} / ${selected.length}…`, { id: toastId });
    }
    toast.success(`Downloaded ${done} file${done !== 1 ? 's' : ''}`, { id: toastId });
    setIsBulkDownloading(false);
    setSelectedIds(new Set());
  };

  /* ── Table columns (checkbox + data) ── */
  const checkboxColumn = {
    key: '__select__',
    label: (
      <button onClick={toggleSelectAll} className="flex items-center justify-center">
        {allSelected
          ? <CheckSquare size={16} className="text-indigo-500" />
          : someSelected
            ? <CheckSquare size={16} className="text-indigo-300" />
            : <Square size={16} className="text-slate-400" />}
      </button>
    ),
    headerClassName: 'w-10 text-center',
    className: 'w-10 text-center',
    render: (row) => (
      <button onClick={(e) => { e.stopPropagation(); toggleSelect(row.document_id); }} className="flex items-center justify-center">
        {selectedIds.has(row.document_id)
          ? <CheckSquare size={16} className="text-indigo-500" />
          : <Square size={16} className="text-slate-300 hover:text-slate-500" />}
      </button>
    ),
  };

  const tableColumns = [
    checkboxColumn,
    {
      key: 'name',
      label: 'Document Name',
      render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.name || '-'}</span>,
    },
    {
      key: 'firm',
      label: 'Firm',
      render: (row) => (
        <span className="flex items-center gap-1">
          <Building2 size={12} className="text-indigo-400 shrink-0" />
          {row.firm?.name || '-'}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => {
        const type = getFileType(row.file || '', row.mime_type || '');
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {type}
          </span>
        );
      },
    },
    {
      key: 'create_by',
      label: 'Uploaded By',
      render: (row) => (
        <span className="flex items-center gap-1">
          <User size={12} className="text-slate-400 shrink-0" />
          {row.create_by?.name || '-'}
        </span>
      ),
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
      label: downloading === row.document_id ? 'Downloading…' : 'Download',
      icon: <Download size={14} />,
      color: 'green',
      onClick: () => handleDownload(row),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 size={14} />,
      color: 'red',
      onClick: () => setDocToDelete(row),
    },
  ];

  return (
    <div className="flex flex-col gap-4">

      {/* ── Filters + Upload button ── */}
      <ManagementFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); goToPage(1); }}
        searchPlaceholder="Search sharable documents..."
        filters={[]}
      />

      {/* ── Bulk Download Bar ── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
          <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            {selectedIds.size} document{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDownload}
              disabled={isBulkDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-md transition-colors"
            >
              {isBulkDownloading
                ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Download size={13} />}
              {isBulkDownloading ? 'Downloading…' : 'Download Selected'}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="flex items-center gap-1 px-2 py-1.5 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-md text-xs transition-colors"
            >
              <XIcon size={13} /> Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <PageContentSkeleton viewMode={viewMode} columns={4} rows={4} />
      ) : documents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-14 text-center flex flex-col items-center gap-3">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No sharable documents found</p>
        </div>
      ) : viewMode === 'table' ? (
        <ManagementTable
          responsive="scroll"
          columns={tableColumns}
          rows={documents}
          rowKey="document_id"
          accent="indigo"
          getActions={getRowActions}
          activeId={activeMenuId}
          onToggleAction={(e, id) => setActiveMenuId(id)}
        />
      ) : (
        <ManagementGrid viewMode={viewMode}>
          {documents.map((doc) => {
            const isSelected = selectedIds.has(doc.document_id);
            return (
              <div key={doc.document_id} className="relative">
                <button
                  onClick={() => toggleSelect(doc.document_id)}
                  className={`absolute top-2 left-2 z-10 rounded-md p-0.5 transition-colors ${
                    isSelected ? 'text-indigo-500' : 'text-slate-300 hover:text-slate-500'
                  }`}
                >
                  {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <ManagementCard
                  title={doc.name || 'Unnamed'}
                  subtitle={doc.firm?.name || ''}
                  accent={isSelected ? 'indigo' : 'indigo'}
                  icon={<FileText size={16} />}
                  badge={null}
                  actions={getRowActions(doc)}
                  menuId={`menu-${doc.document_id}`}
                  activeId={activeMenuId}
                  onToggle={(e, id) => setActiveMenuId(id)}
                >
                  <div className="mt-2 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Firm</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[130px]">{doc.firm?.name || '-'}</span>
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

      {/* ── Upload Modal ── */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => !isUploading && setIsUploadModalOpen(false)}
        title="Upload Sharable Document"
        icon={Upload}
        size="3xl"
        footer={
          <button
            onClick={handleUploadSubmit}
            disabled={isUploading || isFileUploading || !uploadFirm || !uploadName || !uploadedFileUrl}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading…' : 'Upload & Save'}
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Firm <span className="text-red-500">*</span>
            </label>
            <SelectField
              options={firmOptions}
              value={uploadFirm}
              onChange={setUploadFirm}
              placeholder="Search firm..."
              isSearchable
              isLoading={firmIsLoading}
              onMenuOpen={handleFirmMenuOpen}
              onInputChange={handleFirmInputChange}
              onMenuScrollToBottom={handleFirmMenuScrollToBottom}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Document Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={uploadName}
              onChange={e => setUploadName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. OOMS Logo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              File <span className="text-red-500">*</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault(); setIsDragging(false);
                if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {isFileUploading ? (
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Uploading file…</span>
                </div>
              ) : uploadFileObj && uploadedFileUrl ? (
                <div className="flex flex-col items-center">
                  {uploadFileObj.type.startsWith('image/') ? (
                    <img src={uploadedFileUrl} alt={uploadFileObj.name} className="w-auto h-24 object-contain mb-3 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm" />
                  ) : (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 mb-3">
                      <FileText size={32} />
                    </div>
                  )}
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 text-center break-all">{uploadFileObj.name}</span>
                  <span className="text-xs text-emerald-500 font-medium mt-1.5 flex items-center gap-1">
                    <CheckCircle size={12} /> Uploaded successfully
                  </span>
                </div>
              ) : (
                <>
                  <Upload className={`w-10 h-10 mb-3 ${isDragging ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'}`} />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Any valid document file</p>
                </>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={e => handleFileSelect(e.target.files[0] || null)} className="hidden" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Remark (Optional)
            </label>
            <textarea
              value={uploadRemark}
              onChange={e => setUploadRemark(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Any additional notes…"
            />
          </div>
        </div>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal
        isOpen={!!docToDelete}
        onClose={() => !isDeleting && setDocToDelete(null)}
        title="Delete Document"
        icon={Trash2}
        size="sm"
        footer={
          <>
            
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? 'Deleting…' : 'Confirm Delete'}
            </button>
          </>
        }
      >
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          Are you sure you want to delete{' '}
          <span className="font-semibold">{docToDelete?.name || 'this document'}</span>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}