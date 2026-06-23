import React, { useState, useEffect } from 'react';
import { Briefcase, IndianRupee, Users, ClipboardList, House, Download, FileText } from 'lucide-react';
import SelectField from '../common/SelectField';
import ManagementTable from '../common/ManagementTable';
import ManagementCard from '../common/ManagementCard';
import ManagementGrid from '../common/ManagementGrid';
import Pagination, { usePagination } from '../common/PaginationComponent';
import { apiCall } from '../../utils/apiCall';
import toast from 'react-hot-toast';

const categories = [
  { id: 'gst', label: 'GST', icon: IndianRupee },
  { id: 'mca', label: 'MCA', icon: Users },
  { id: 'task', label: 'Task', icon: ClipboardList },
];

export default function OutputDocs() {
  const [activeCategory, setActiveCategory] = useState('gst');
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'card' : 'table');
  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 20);

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [firmId, setFirmId] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');

  // Document Types from API
  const [documentTypes, setDocumentTypes] = useState({});

  useEffect(() => {
    const handleResize = () => setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch document types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await apiCall('/document/types', 'GET');
        const data = await response.json();
        if (data.success) {
          setDocumentTypes(data.data || {});
        }
      } catch (error) {
        console.error('Failed to fetch document types:', error);
      }
    };
    fetchTypes();
  }, []);

  // Fetch documents
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      let queryParams = `?page_no=${pagination.page}&limit=${pagination.limit}`;
      if (firmId) queryParams += `&firm_id=${encodeURIComponent(firmId)}`;
      if (selectedType) queryParams += `&type=${encodeURIComponent(selectedType.value)}`;
      if (year) queryParams += `&year=${encodeURIComponent(year)}`;
      if (month) queryParams += `&month=${encodeURIComponent(month)}`;

      const endpoint = `/document/list/${activeCategory}${queryParams}`;
      const response = await apiCall(endpoint, 'GET');
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
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, pagination.page, pagination.limit, firmId, selectedType, year, month]);

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
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Firm ID</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            placeholder="Enter Firm ID"
            value={firmId}
            onChange={(e) => { setFirmId(e.target.value); goToPage(1); }}
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
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            placeholder="e.g. 2024-25"
            value={year}
            onChange={(e) => { setYear(e.target.value); goToPage(1); }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            placeholder="e.g. April"
            value={month}
            onChange={(e) => { setMonth(e.target.value); goToPage(1); }}
          />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
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
