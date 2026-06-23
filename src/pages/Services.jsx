import React, { useState, useEffect, useRef } from 'react';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import { Layers, Eye, Activity, Box, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementFilters from '../components/common/ManagementFilters';
import Pagination, { usePagination } from '../components/common/PaginationComponent';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

export default function Services() {
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
  const [typeFilter, setTypeFilter] = useState(null);

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const abortControllerRef = useRef(null);

  // Fetch Services
  const fetchServices = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    try {
      const typeQuery = typeFilter ? typeFilter.value : '';
      const endpoint = `/service/list?page_no=${pagination.page}&limit=${pagination.limit}&search=${encodeURIComponent(searchQuery)}&type=${encodeURIComponent(typeQuery)}`;

      const response = await apiCall(endpoint, 'GET', null, { signal: abortControllerRef.current.signal });
      const data = await response.json();

      if (response.ok && data.success !== false) {
        setServices(data.data || []);
        if (data.pagination) {
          updatePagination({ total: data.pagination.total });
        }
      } else {
        setServices([]);
        updatePagination({ total: 0 });
      }
      setIsLoading(false);
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Failed to fetch services:', error);
      toast.error('Failed to load services');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServices();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, searchQuery, typeFilter]);

  const handleRefresh = () => {
    fetchServices();
  };

  const handleViewDetails = (item) => {
    navigate(`/service/${item.service_id}`);
  };

  const formatType = (typeStr) => {
    if (!typeStr) return '-';
    return typeStr.charAt(0).toUpperCase() + typeStr.slice(1);
  };

  const tableColumns = [
    { key: 'name', label: 'Service Name', render: (row) => <span className="font-bold text-blue-900 dark:text-blue-200">{row.name}</span> },
    { key: 'sac_code', label: 'SAC Code', render: (row) => <span>{row.sac_code || '-'}</span> },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold ${row.type === 'compliance' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
          {formatType(row.type)}
        </span>
      )
    },
    {
      key: 'charges',
      label: 'Total Charges',
      render: (row) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
          <IndianRupee size={12} />
          {row.charges?.total || 0}
        </span>
      )
    },
  ];

  const getRowActions = (row) => [
    { id: 'view', label: 'View Details', icon: <Eye size={14} />, color: 'green', onClick: () => handleViewDetails(row) },
  ];

  return (
    <ManagementHub
      title="Services Management"
      description="Manage all your available services, pricing, and categories."
      accent="blue"
      onRefresh={handleRefresh}
      actions={null}
      summary={null}
    >
      <div className="mt-4 flex flex-col gap-2">

        <ManagementFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchValue={searchQuery}
          onSearchChange={(val) => { setSearchQuery(val); goToPage(1); }}
          searchPlaceholder="Search services..."
          filters={[
            {
              value: typeFilter,
              onChange: (val) => { setTypeFilter(val); goToPage(1); },
              options: [
                { value: 'compliance', label: 'Compliance' },
                { value: 'general', label: 'General' }
              ],
              placeholder: 'Type',
              isClearable: true
            }
          ]}
        />

        {isLoading ? (
          <PageContentSkeleton viewMode={viewMode} columns={5} rows={6} />
        ) : services.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-10 text-center flex flex-col items-center">
            <Box className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No services found</p>
          </div>
        ) : viewMode === 'table' ? (
          <ManagementTable
            columns={tableColumns}
            rows={services}
            rowKey="service_id"
            accent="blue"
            getActions={getRowActions}
            activeId={activeMenuId}
            onToggleAction={(e, id) => setActiveMenuId(id)}
            onRowClick={(row) => handleViewDetails(row)}
          />
        ) : (
          <ManagementGrid viewMode={viewMode}>
            {services.map((service) => (
              <ManagementCard
                key={service.service_id}
                title={service.name}
                subtitle={`SAC: ${service.sac_code || 'N/A'}`}
                accent="blue"
                icon={<Layers size={16} />}
                badge={
                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold ${service.type === 'compliance' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                    {formatType(service.type)}
                  </span>
                }
                actions={getRowActions(service)}
                menuId={`menu-${service.service_id}`}
                activeId={activeMenuId}
                onToggle={(e, id) => setActiveMenuId(id)}
                onClick={() => handleViewDetails(service)}
              >
                <div className="mt-3 flex justify-between items-center text-xs border-t border-slate-100 dark:border-gray-700 pt-2">
                  <span className="text-slate-500 flex items-center gap-1 font-medium">Charges:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-0.5">
                    <IndianRupee size={12} />{service.charges?.total || 0}
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
