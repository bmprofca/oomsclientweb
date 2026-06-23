import React, { useState, useEffect } from 'react';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import { Building2, Eye, Activity, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementFilters from '../components/common/ManagementFilters';
import Modal from '../components/common/Modal';
import Pagination, { usePagination } from '../components/common/PaginationComponent';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

export default function Firms() {
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

  const [firms, setFirms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Firms
  const fetchFirms = async () => {
    setIsLoading(true);
    try {
      // Map frontend status label to backend boolean string if needed, or send as is
      let statusQuery = '';
      if (statusFilter) {
        if (statusFilter.value === 'true') statusQuery = 'true';
        if (statusFilter.value === 'false') statusQuery = 'false';
      }

      const endpoint = `/firm/list?page_no=${pagination.page}&limit=${pagination.limit}&status=${statusQuery}&search=${encodeURIComponent(searchQuery)}`;

      const response = await apiCall(endpoint, 'GET');
      const data = await response.json();

      if (response.ok && data.success !== false) {
        setFirms(data.data || []);
        if (data.pagination) {
          updatePagination({ total: data.pagination.total });
        }
      } else {
        setFirms([]);
        updatePagination({ total: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch firms:', error);
      toast.error('Failed to load firms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFirms();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, searchQuery, statusFilter]);

  const handleRefresh = () => {
    fetchFirms();
  };

  const handleViewDetails = (item) => {
    navigate(`/firm/${item.firm_id}`);
  };

  const formatType = (typeStr) => {
    if (!typeStr) return '-';
    // e.g. "private_limited" -> "Private Limited"
    return typeStr.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const tableColumns = [
    { key: 'firm_name', label: 'Firm Name', render: (row) => <span className="font-bold text-indigo-900 dark:text-indigo-200">{row.firm_name}</span> },
    { key: 'firm_type', label: 'Type', render: (row) => <span>{formatType(row.firm_type)}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold ${row.status ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
          {row.status ? 'Active' : 'Inactive'}
        </span>
      )
    },
  ];

  const getRowActions = (row) => [
    { id: 'view', label: 'View Details', icon: <Eye size={14} />, color: 'green', onClick: () => handleViewDetails(row) },
  ];

  return (
    <ManagementHub
      title="Firms & Organizations"
      description="Manage partner firms, client organizations, and their details."
      accent="indigo"
      onRefresh={handleRefresh}
      actions={null}
      summary={null}
    >
      < div className="mt-4 flex flex-col gap-2" >

        <ManagementFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchValue={searchQuery}
          onSearchChange={(val) => { setSearchQuery(val); goToPage(1); }}
          searchPlaceholder="Search firms by name..."
          filters={[
            {
              value: statusFilter,
              onChange: (val) => { setStatusFilter(val); goToPage(1); },
              options: [
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' }
              ],
              placeholder: 'Status',
              isClearable: true
            }
          ]}
        />

        {
          isLoading ? (
            <PageContentSkeleton viewMode={viewMode} columns={4} rows={6} />
          ) : firms.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-10 text-center flex flex-col items-center">
              <Building className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No firms found</p>
            </div>
          ) : viewMode === 'table' ? (
            <ManagementTable
              columns={tableColumns}
              rows={firms}
              rowKey="firm_id"
              accent="indigo"
              getActions={getRowActions}
              activeId={activeMenuId}
              onToggleAction={(e, id) => setActiveMenuId(id)}
              onRowClick={(row) => handleViewDetails(row)}
            />
          ) : (
            <ManagementGrid viewMode={viewMode}>
              {firms.map((firm) => (
                <ManagementCard
                  key={firm.firm_id}
                  title={firm.firm_name}
                  subtitle={formatType(firm.firm_type)}
                  accent="indigo"
                  icon={<Building2 size={16} />}
                  badge={
                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold ${firm.status ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                      {firm.status ? 'Active' : 'Inactive'}
                    </span>
                  }
                  actions={getRowActions(firm)}
                  menuId={`menu-${firm.firm_id}`}
                  activeId={activeMenuId}
                  onToggle={(e, id) => setActiveMenuId(id)}
                  onClick={() => handleViewDetails(firm)}
                >
                  <div className="mt-3 flex justify-between items-center text-xs border-t border-slate-100 dark:border-gray-700 pt-2">
                    <span className="text-slate-500 flex items-center gap-1"><Activity size={12} /> Profile: {firm.status ? 'Active' : 'Disabled'}</span>
                  </div>
                </ManagementCard>
              ))}
            </ManagementGrid>
          )
        }

        <Pagination
          currentPage={pagination.page}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={goToPage}
          onLimitChange={changeLimit}
        />
      </div >
    </ManagementHub >
  );
}
