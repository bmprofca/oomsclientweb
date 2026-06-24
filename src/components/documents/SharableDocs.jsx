import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Share2, Upload, Trash2, ExternalLink, FileText, Download, Building2, CalendarDays, CheckCircle
} from 'lucide-react';
import SelectField from '../common/SelectField';
import Pagination, { usePagination } from '../common/PaginationComponent';
import { PageContentSkeleton } from '../SkeletonComponent';
import Modal from '../common/Modal';
import { apiCall, uploadFile } from '../../utils/apiCall';
import toast from 'react-hot-toast';

const ALL_FIRMS = { label: 'All Firms', value: '' };

/* ─── Helpers ────────────────────────────────────────────── */
function getFileType(url = '') {
  const ext = url.split('?')[0].split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
}

/* ─── Document Viewer Modal ──────────────────────────────── */
function DocViewerModal({ isOpen, onClose, doc }) {
  if (!doc) return null;
  const fileUrl  = doc.file || doc.url || '';
  const fileType = doc.mime_type?.startsWith('image/') ? 'image' : getFileType(fileUrl);
  const title    = doc.name || 'Document';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={FileText}
      size="4xl"
      contentClassName="p-0 flex flex-col h-[70vh] bg-gray-100 dark:bg-gray-950"
      footer={
        <>
          {fileUrl && (
            <a
              href={fileUrl}
              download
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
            >
              <Download size={16} /> Download
            </a>
          )}
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold transition-colors"
            >
              <ExternalLink size={16} /> Open Tab
            </a>
          )}
        </>
      }
    >
      <div className="flex-1 overflow-auto w-full h-full flex items-center justify-center p-4">
        {!fileUrl ? (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <FileText size={48} className="opacity-30" />
            <p className="text-sm">No file available</p>
          </div>
        ) : fileType === 'image' ? (
          <img
            src={fileUrl}
            alt={title}
            className="max-w-full max-h-full object-contain rounded shadow-md"
          />
        ) : fileType === 'pdf' ? (
          <iframe
            src={fileUrl}
            title={title}
            className="w-full h-full border-0"
          />
        ) : (
          /* Fallback: try object tag, then link */
          <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-slate-400">
            <FileText size={56} className="opacity-20" />
            <p className="text-sm font-medium">Preview not available for this file type.</p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <ExternalLink size={14} /> Open in new tab
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function SharableDocs() {
  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 20);
  
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedFirm, setSelectedFirm] = useState(ALL_FIRMS);
  
  // Firm dropdown state
  const [firmOptions, setFirmOptions] = useState([]);
  const [firmPage, setFirmPage] = useState(1);
  const [firmHasMore, setFirmHasMore] = useState(true);
  const [firmIsLoading, setFirmIsLoading] = useState(false);
  const [firmSearch, setFirmSearch] = useState('');
  
  const firmSearchTimerRef = useRef(null);
  const firmLoadedRef = useRef(false);
  const docsAbortRef = useRef(null);
  const firmAbortRef = useRef(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFirm, setUploadFirm] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadRemark, setUploadRemark] = useState('');
  const [uploadFileObj, setUploadFileObj] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Viewer & Delete State
  const [docToView, setDocToView] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch Firms
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

  // Fetch Documents
  const fetchDocuments = useCallback(async () => {
    if (docsAbortRef.current) docsAbortRef.current.abort();
    const controller = new AbortController();
    docsAbortRef.current = controller;
    setIsLoading(true);
    try {
      const firmId = selectedFirm?.value || '';
      const endpoint = `/document/sharable/list?page_no=${pagination.page}&limit=${pagination.limit}&firm_id=${encodeURIComponent(firmId)}`;
      
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
  }, [pagination.page, pagination.limit, selectedFirm]);

  useEffect(() => {
    const timer = setTimeout(fetchDocuments, 300);
    return () => {
      clearTimeout(timer);
      if (docsAbortRef.current) docsAbortRef.current.abort();
    };
  }, [fetchDocuments]);

  // Upload Document
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

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFirm || !uploadName || !uploadedFileUrl) {
      toast.error('Firm, Document Name, and File are required');
      return;
    }

    setIsUploading(true);
    try {
      // Create sharable doc
      const payload = {
        url: uploadedFileUrl,
        name: uploadName,
        firm_id: uploadFirm.value,
        remark: uploadRemark
      };

      const response = await apiCall('/document/sharable/create', 'POST', payload);
      const data = await response.json();

      if (response.ok && data.success !== false) {
        toast.success(data.message || 'Document uploaded successfully');
        setIsUploadModalOpen(false);
        // reset form
        setUploadFirm(null);
        setUploadName('');
        setUploadRemark('');
        setUploadFileObj(null);
        setUploadedFileUrl(null);
        // refresh list
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

  // Delete Document
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
    } catch (error) {
      toast.error('An error occurred during deletion');
    } finally {
      setIsDeleting(false);
    }
  };

  // UI Helpers
  const handleDownload = (fileUrl) => {
    if (!fileUrl) { toast.error('File URL not available'); return; }
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileUrl.split('/').pop().split('?')[0] || 'document';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-800">
        <div className="flex-1 w-full sm:max-w-sm">
          <SelectField
            options={[ALL_FIRMS, ...firmOptions]}
            value={selectedFirm}
            onChange={val => { setSelectedFirm(val ?? ALL_FIRMS); goToPage(1); }}
            placeholder="Filter by Firm"
            isSearchable
            isLoading={firmIsLoading}
            onMenuOpen={handleFirmMenuOpen}
            onInputChange={handleFirmInputChange}
            onMenuScrollToBottom={handleFirmMenuScrollToBottom}
            filterOption={(opt) => true}
            noOptionsMessage={() => firmIsLoading ? 'Loading...' : 'No firms found'}
          />
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-semibold transition-colors shrink-0 w-full sm:w-auto"
        >
          <Upload size={16} />
          Upload Document
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <PageContentSkeleton viewMode="card" columns={3} rows={4} />
      ) : documents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-14 text-center flex flex-col items-center gap-3">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No sharable documents found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
          {documents.map((doc) => (
            <div key={doc.id || doc.document_id} className="flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow h-64">
              
              {doc.mime_type?.startsWith('image/') || getFileType(doc.file || doc.url) === 'image' ? (
                /* Image Only View */
                <div 
                  className="w-full flex-1 bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center overflow-hidden cursor-pointer group"
                  onClick={() => setDocToView(doc)}
                >
                  <img src={doc.file || doc.url} alt={doc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                /* Details View for non-images */
                <div className="p-4 flex-1 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                      <FileText size={20} />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm line-clamp-2" title={doc.name}>
                      {doc.name || 'Unnamed Document'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Building2 size={12} /> {doc.firm?.name || doc.firm_name || 'Unknown Firm'}
                    </p>
                  </div>
                  
                  {doc.remark && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2 border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                      {doc.remark}
                    </p>
                  )}
                  
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-auto pt-2 flex items-center gap-1">
                    <CalendarDays size={12} /> {doc.create_date ? doc.create_date.split(' ')[0] : '—'}
                  </div>
                </div>
              )}
              
              <div className="flex border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <button
                  onClick={() => setDocToView(doc)}
                  className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <ExternalLink size={14} /> Open
                </button>
                <div className="w-px bg-slate-200 dark:bg-slate-700" />
                <button
                  onClick={() => handleDownload(doc.file || doc.url)}
                  className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <Download size={14} /> Download
                </button>
                <div className="w-px bg-slate-200 dark:bg-slate-700" />
                <button
                  onClick={() => setDocToDelete(doc)}
                  className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={goToPage}
          onLimitChange={changeLimit}
        />
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => !isUploading && setIsUploadModalOpen(false)}
        title="Upload Sharable Document"
        icon={Upload}
        size="2xl"
        footer={
          <>
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUploadSubmit}
              disabled={isUploading || isFileUploading || !uploadFirm || !uploadName || !uploadedFileUrl}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>Loading...</>
              ) : (
                <>Upload & Save</>
              )}
            </button>
          </>
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
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isFileUploading ? (
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Uploading file...</span>
                </div>
              ) : uploadFileObj && uploadedFileUrl ? (
                <div className="flex flex-col items-center">
                  {uploadFileObj.type.startsWith('image/') ? (
                    <img src={uploadedFileUrl} alt={uploadFileObj.name} className="w-auto h-24 object-contain mb-3 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-slate-800" />
                  ) : (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 mb-3 shadow-sm">
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
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Any valid document file
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => handleFileSelect(e.target.files[0] || null)}
              className="hidden"
            />
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
              placeholder="Any additional notes..."
            />
          </div>
        </div>
      </Modal>

      {/* Viewer Modal */}
      <DocViewerModal
        isOpen={!!docToView}
        onClose={() => setDocToView(null)}
        doc={docToView}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!docToDelete}
        onClose={() => !isDeleting && setDocToDelete(null)}
        title="Delete Document"
        icon={Trash2}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDocToDelete(null)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </>
        }
      >
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          Are you sure you want to delete <span className="font-semibold">{docToDelete?.name || 'this document'}</span>? This action cannot be undone.
        </p>
      </Modal>

    </div>
  );
}
