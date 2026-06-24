import React, { useState, useEffect, useRef } from 'react';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import { Eye, Activity, Box, IndianRupee, CalendarDays, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementFilters from '../components/common/ManagementFilters';
import Pagination, { usePagination } from '../components/common/PaginationComponent';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

export default function ServiceRequests() {
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'card' : 'table');

  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 20);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const abortControllerRef = useRef(null);

  const fetchRequests = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    try {
      const statusQuery = statusFilter ? statusFilter.value : '';
      const endpoint = `/service/service-request/list?page_no=${pagination.page}&limit=${pagination.limit}&search=${encodeURIComponent(searchQuery)}&status=${encodeURIComponent(statusQuery)}`;

      const response = await apiCall(endpoint, 'GET', null, { signal: abortControllerRef.current.signal });
      const data = await response.json();

      if (response.ok && data.success !== false) {
        setRequests(data.data || []);
        if (data.pagination) {
          updatePagination({ total: data.pagination.total });
        }
      } else {
        setRequests([]);
        updatePagination({ total: 0 });
      }
      setIsLoading(false);
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Failed to fetch service requests:', error);
      toast.error('Failed to load service requests');
      setIsLoading(false);
    }
  };

  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      fetchRequests();
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, searchQuery, statusFilter]);

  const handleRefresh = () => {
    fetchRequests();
  };

  const handleViewDetails = (item) => {
    navigate(`/service-request/${item.request_id}`);
  };

  const formatStatus = (statusStr) => {
    if (!statusStr) return '-';
    return statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      case 'approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800';
      case 'completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

  const tableColumns = [
    { key: 'service_name', label: 'Service Name', render: (row) => <span className="font-bold text-blue-900 dark:text-blue-200">{row.service_name}</span> },
    { key: 'firm_name', label: 'Firm', render: (row) => <span>{row.firm_name || '-'}</span> },
    { key: 'create_date', label: 'Date', render: (row) => <span>{row.create_date ? row.create_date.split(' ')[0] : '-'}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold ${getStatusColor(row.status)}`}>
          {formatStatus(row.status)}
        </span>
      )
    },
    {
      key: 'charges',
      label: 'Amount',
      render: (row) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
          <IndianRupee size={12} />
          {row.charges?.amount || 0}
        </span>
      )
    },
  ];

  const getRowActions = (row) => [
    { id: 'view', label: 'View Details', icon: <Eye size={14} />, color: 'green', onClick: () => handleViewDetails(row) },
  ];

  const tabs = [
    { id: 'services', label: 'Services', icon: Layers },
    { id: 'requests', label: 'Service Requests', icon: Activity }
  ];

  const handleTabChange = (tabId) => {
    if (tabId === 'services') {
      navigate('/services');
    }
  };

  return (
    <ManagementHub
      title="Services & Requests"
      description="Manage all your available services and view client service requests."
      accent="blue"
      onRefresh={handleRefresh}
      tabs={tabs}
      activeTab="requests"
      onTabChange={handleTabChange}
      actions={null}
      summary={null}
    >
      <div className="mt-4 flex flex-col gap-2">

        <ManagementFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchValue={searchQuery}
          onSearchChange={(val) => { setSearchQuery(val); goToPage(1); }}
          searchPlaceholder="Search requests..."
          filters={[
            {
              value: statusFilter,
              onChange: (val) => { setStatusFilter(val); goToPage(1); },
              options: [
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'completed', label: 'Completed' }
              ],
              placeholder: 'Status',
              isClearable: true
            }
          ]}
        />

        {isLoading ? (
          <PageContentSkeleton viewMode={viewMode} columns={5} rows={6} />
        ) : requests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-10 text-center flex flex-col items-center">
            <Box className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No service requests found</p>
          </div>
        ) : viewMode === 'table' ? (
          <ManagementTable
            columns={tableColumns}
            rows={requests}
            rowKey="request_id"
            accent="blue"
            getActions={getRowActions}
            activeId={activeMenuId}
            onToggleAction={(e, id) => setActiveMenuId(id)}
            onRowClick={(row) => handleViewDetails(row)}
          />
        ) : (
          <ManagementGrid viewMode={viewMode}>
            {requests.map((request) => (
              <ManagementCard
                key={request.request_id}
                title={request.service_name}
                subtitle={`Firm: ${request.firm_name || 'N/A'}`}
                accent="blue"
                icon={<Activity size={16} />}
                badge={
                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold ${getStatusColor(request.status)}`}>
                    {formatStatus(request.status)}
                  </span>
                }
                actions={getRowActions(request)}
                menuId={`menu-${request.request_id}`}
                activeId={activeMenuId}
                onToggle={(e, id) => setActiveMenuId(id)}
                onClick={() => handleViewDetails(request)}
              >
                <div className="mt-3 flex justify-between items-center text-xs border-t border-slate-100 dark:border-gray-700 pt-2">
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    <CalendarDays size={12} /> {request.create_date ? request.create_date.split(' ')[0] : '-'}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-0.5">
                    <IndianRupee size={12} />{request.charges?.amount || 0}
                  </span>
                </div>
              </ManagementCard>
            ))}
          </ManagementGrid>
        )}

        <Pagination
          currentPage={pagination.page}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={goToPage}
          onLimitChange={changeLimit}
        />
      </div>

    </ManagementHub>
  );
}
