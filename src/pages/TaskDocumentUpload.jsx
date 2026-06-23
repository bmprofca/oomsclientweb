import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UploadCloud, File, X, CheckCircle, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';

export default function TaskDocumentUpload() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

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
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles) => {
    const formattedFiles = newFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      status: 'pending', // pending, uploading, success, error
      progress: 0
    }));

    setFiles(prev => [...prev, ...formattedFiles]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const simulateUpload = async () => {
    setUploading(true);

    // Simulate upload for each pending file
    const pendingFiles = files.filter(f => f.status === 'pending');

    for (const f of pendingFiles) {
      // Mark as uploading
      setFiles(prev => prev.map(item =>
        item.id === f.id ? { ...item, status: 'uploading' } : item
      ));

      // Simulate progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setFiles(prev => prev.map(item =>
          item.id === f.id ? { ...item, progress: i } : item
        ));
      }

      // Mark as success (or occasionally error for demo purposes, but let's stick to success)
      setFiles(prev => prev.map(item =>
        item.id === f.id ? { ...item, status: 'success', progress: 100 } : item
      ));
    }

    setUploading(false);
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;

  return (
    <ManagementHub
      title={`Upload Documents`}
      description={`Add reference documents, deliverables, or attachments for task ${taskId}.`}
      accent="indigo"
      actions={
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-md transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Tasks</span>
        </button>
      }
    >
      <div className="mt-6 max-w-4xl mx-auto space-y-6">

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-md p-10 transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center ${isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-400'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileInput}
          />

          <div className="w-16 h-16 mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <UploadCloud size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Drag & Drop files here
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
            Supported files: PDF, DOCX, XLSX, JPG, PNG up to 50MB each.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors shadow-sm shadow-indigo-600/20"
          >
            Browse Files
          </button>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <File size={18} className="text-indigo-500" />
                Selected Files ({files.length})
              </h4>

              {pendingCount > 0 && (
                <button
                  onClick={simulateUpload}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 text-white text-sm font-medium rounded-md transition-colors"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} />
                      Upload {pendingCount} File{pendingCount !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              )}
            </div>

            <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {files.map((file) => (
                <li key={file.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-md bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 flex-shrink-0">
                      <File size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate pr-4">
                          {file.name}
                        </p>
                        {file.status === 'pending' && (
                          <button
                            onClick={() => removeFile(file.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                        {file.status === 'success' && (
                          <CheckCircle size={18} className="text-emerald-500" />
                        )}
                        {file.status === 'error' && (
                          <AlertCircle size={18} className="text-red-500" />
                        )}
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                        <span>{file.size}</span>
                        {file.status === 'uploading' && <span>{file.progress}%</span>}
                        {file.status === 'success' && <span className="text-emerald-600 dark:text-emerald-400 font-medium">Uploaded</span>}
                      </div>

                      {/* Progress Bar */}
                      {(file.status === 'uploading' || file.status === 'success') && (
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ease-out ${file.status === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'
                              }`}
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ManagementHub>
  );
}
