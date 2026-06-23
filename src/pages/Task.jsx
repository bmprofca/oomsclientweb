import React, { useState, useEffect } from 'react';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import { CheckSquare, Clock, Eye, List, Activity, CheckCircle, Upload, IndianRupee } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementFilters from '../components/common/ManagementFilters';
import Pagination, { usePagination } from '../components/common/PaginationComponent';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

export default function Task() {
  const location = useLocation();
  const navigate = useNavigate();

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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  let activeTab = 'all';
  if (location.pathname.endsWith('/ongoing')) activeTab = 'ongoing';
  else if (location.pathname.endsWith('/completed')) activeTab = 'completed';

  useEffect(() => {
    if (activeTab === 'ongoing') {
      setStatusFilter({ value: 'pending from department', label: 'Pending' });
    } else if (activeTab === 'completed') {
      setStatusFilter({ value: 'complete', label: 'Completed' });
    } else {
      setStatusFilter(null);
    }
    goToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleTabChange = (tabId) => {
    if (tabId === 'all') navigate('/tasks');
    else if (tabId === 'ongoing') navigate('/tasks/ongoing');
    else if (tabId === 'completed') navigate('/tasks/completed');
  };

  const tabs = [
    { id: 'all', label: 'All Tasks', icon: List },
    { id: 'ongoing', label: 'Ongoing Tasks', icon: Activity },
    { id: 'completed', label: 'Completed Tasks', icon: CheckCircle },
  ];

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const statusValue = statusFilter ? statusFilter.value : '';
      const endpoint = `/task/list?page_no=${pagination.page}&limit=${pagination.limit}&status=${encodeURIComponent(statusValue)}&firm_id=&search=${encodeURIComponent(searchQuery)}`;
      const response = await apiCall(endpoint, 'GET');
      const data = await response.json();
      if (response.ok && data.success !== false) {
        setTasks(data.data || []);
        if (data.pagination) updatePagination({ total: data.pagination.total });
      } else {
        setTasks([]);
        updatePagination({ total: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchTasks(); }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, searchQuery, statusFilter]);

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('complete')) return 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800';
    if (s.includes('pending')) return 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800';
    if (s.includes('progress')) return 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800';
    return 'text-slate-700 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
  };

  // Navigate to the dedicated details page
  const handleViewDetails = (row) => {
    navigate(`/task/${row.task_id}`);
  };

  const tableColumns = [
    { key: 'title', label: 'Service', render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.service?.name || '-'}</span> },
    { key: 'firm', label: 'Firm', render: (row) => <span>{row.firm?.firm_name || '-'}</span> },
    {
      key: 'charges',
      label: 'Charges',
      render: (row) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
          <IndianRupee size={12} />
          {row.charges?.total || 0}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-[11px] uppercase tracking-wide font-bold ${getStatusColor(row.status)}`}>
          {row.status || 'UNKNOWN'}
        </span>
      ),
    },
    { key: 'dueDate', label: 'Due Date', render: (row) => <span>{row.dates?.due_date || '-'}</span> },
  ];

  const getRowActions = (row) => [
    { id: 'view', label: 'View Details', icon: <Eye size={14} />, color: 'green', onClick: () => handleViewDetails(row) },
  ];

  return (
    <ManagementHub
      title="Tasks & Assignments"
      description="Track and manage all operational tasks and deadlines."
      accent="amber"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onRefresh={fetchTasks}
      actions={null}
      summary={null}
    >
      <div className="mt-4 flex flex-col gap-2">

        <ManagementFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchValue={searchQuery}
          onSearchChange={(val) => { setSearchQuery(val); goToPage(1); }}
          searchPlaceholder="Search tasks..."
          filters={[
            {
              value: statusFilter,
              onChange: (val) => { setStatusFilter(val); goToPage(1); },
              options: [
                { value: 'pending from department', label: 'Pending' },
                { value: 'complete', label: 'Completed' },
              ],
              placeholder: 'Status',
              isClearable: true,
            },
          ]}
        />

        {isLoading ? (
          <PageContentSkeleton viewMode={viewMode} columns={6} rows={6} />
        ) : tasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-10 text-center flex flex-col items-center">
            <List className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No tasks found</p>
          </div>
        ) : viewMode === 'table' ? (
          <ManagementTable
            columns={tableColumns}
            rows={tasks}
            rowKey="task_id"
            accent="amber"
            getActions={getRowActions}
            activeId={activeMenuId}
            onToggleAction={(e, id) => setActiveMenuId(id)}
            onRowClick={(row) => handleViewDetails(row)}
          />
        ) : (
          <ManagementGrid viewMode={viewMode}>
            {tasks.map((task) => (
              <ManagementCard
                key={task.task_id}
                title={task.service?.name || '-'}
                subtitle={`Firm: ${task.firm?.firm_name || '-'}`}
                accent="amber"
                icon={<CheckSquare size={16} />}
                badge={
                  <span className={`px-2 py-0.5 whitespace-nowrap rounded-md text-[10px] uppercase font-bold ${getStatusColor(task.status)}`}>
                    {task.status || 'UNKNOWN'}
                  </span>
                }
                actions={getRowActions(task)}
                menuId={`menu-${task.task_id}`}
                activeId={activeMenuId}
                onToggle={(e, id) => setActiveMenuId(id)}
                onClick={() => handleViewDetails(task)}
              >
                <div className="mt-3 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">Charges:</span>
                    <span className="font-bold flex items-center text-slate-700 dark:text-slate-200">
                      <IndianRupee size={10} className="mr-[1px]" />
                      {task.charges?.total || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Clock size={12} />
                    <span>{task.dates?.due_date || '-'}</span>
                  </div>
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