import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, Trash2, FileText, Download, Building2, User, CheckCircle
} from 'lucide-react';
// file-type icons from react-icons
import { FaFilePdf, FaFileExcel, FaFileWord, FaFileCsv, FaFileAlt } from 'react-icons/fa';
import SelectField from '../common/SelectField';
import Pagination, { usePagination } from '../common/PaginationComponent';
import { PageContentSkeleton } from '../SkeletonComponent';
import Modal from '../common/Modal';
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

function FileTypeIcon({ type, className = '' }) {
  const base = `w-10 h-10 ${className}`;
  if (type === 'pdf')   return <FaFilePdf   className={`${base} text-red-500`} />;
  if (type === 'excel') return <FaFileExcel  className={`${base} text-emerald-600`} />;
  if (type === 'word')  return <FaFileWord   className={`${base} text-blue-600`} />;
  if (type === 'csv')   return <FaFileCsv    className={`${base} text-green-500`} />;
  return                       <FaFileAlt    className={`${base} text-slate-400`} />;
}

/* ─── Direct-download (blob, no new tab) ─────────────────── */
async function triggerDownload(fileUrl, fileName) {
  if (!fileUrl) return;
  try {
    const resp = await fetch(fileUrl);
    const blob = await resp.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = fileName || fileUrl.split('/').pop().split('?')[0] || 'document';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch {
    // fallback: anchor download
    const a    = document.createElement('a');
    a.href     = fileUrl;
    a.download = fileName || 'document';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}


export default function SharableDocs({ refreshTrigger }) {
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
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeleting, setIsDeleting]   = useState(false);
  const [downloading, setDownloading] = useState(null); // document_id being downloaded
  
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
  }, [fetchDocuments, refreshTrigger]);

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
  const handleDownload = async (doc) => {
    const fileUrl  = doc.file || doc.url;
    const fileName = doc.name || 'document';
    if (!fileUrl) { toast.error('File URL not available'); return; }
    setDownloading(doc.document_id);
    await triggerDownload(fileUrl, fileName);
    setDownloading(null);
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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {documents.map((doc) => {
            const fileUrl  = doc.file || doc.url || '';
            const fileType = getFileType(fileUrl, doc.mime_type || '');
            const isImg    = fileType === 'image';
            const isDownloading = downloading === doc.document_id;

            return (
              <div
                key={doc.document_id}
                className="flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* ── Card Header ── */}
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold shrink-0 max-w-[45%] truncate" title={doc.firm?.name}>
                    <Building2 size={9} className="shrink-0" />
                    <span className="truncate">{doc.firm?.name || 'Unknown'}</span>
                  </span>
                  <span className="text-slate-400 dark:text-slate-600 text-xs shrink-0">/</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate" title={doc.name}>
                    {doc.name || 'Unnamed'}
                  </span>
                </div>

                {/* ── File Preview ── */}
                <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-900/50 overflow-hidden" style={{ minHeight: '140px', maxHeight: '180px' }}>
                  {isImg ? (
                    <img
                      src={fileUrl}
                      alt={doc.name}
                      className="w-full h-full object-cover"
                      style={{ minHeight: '140px', maxHeight: '180px' }}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-6">
                      <FileTypeIcon type={fileType} className="w-12 h-12" />
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {fileType === 'pdf' ? 'PDF Document' :
                         fileType === 'excel' ? 'Excel Spreadsheet' :
                         fileType === 'word'  ? 'Word Document' :
                         fileType === 'csv'   ? 'CSV File' : 'File'}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Card Footer ── */}
                <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                  {/* Created by */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                      <User size={10} className="text-indigo-500" />
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={doc.create_by?.name}>
                      {doc.create_by?.name || 'Unknown'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleDownload(doc)}
                      disabled={isDownloading}
                      title="Download"
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
                    >
                      {isDownloading
                        ? <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        : <Download size={13} />}
                    </button>
                    <button
                      onClick={() => setDocToDelete(doc)}
                      title="Delete"
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
