import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Edit, Trash, Clock, Eye, List, Activity, CheckCircle, Upload, IndianRupee } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementFilters from '../components/common/ManagementFilters';
import Modal from '../components/common/Modal';
import Pagination, { usePagination } from '../components/common/PaginationComponent';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

export default function Task() {
  const location = useLocation();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState('table');
  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 20);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  let activeTab = 'all';
  if (location.pathname.endsWith('/ongoing')) {
    activeTab = 'ongoing';
  } else if (location.pathname.endsWith('/completed')) {
    activeTab = 'completed';
  }

  // Map tabs to API status
  useEffect(() => {
    if (activeTab === 'ongoing') {
      setStatusFilter({ value: 'pending from department', label: 'Pending' });
    } else if (activeTab === 'completed') {
      setStatusFilter({ value: 'complete', label: 'Completed' });
    } else {
      setStatusFilter(null);
    }
    // reset to page 1 when switching tabs
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

  // Fetch Tasks
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const statusValue = statusFilter ? statusFilter.value : '';
      // Build API query
      const endpoint = `/task/list?page_no=${pagination.page}&limit=${pagination.limit}&status=${encodeURIComponent(statusValue)}&firm_id=&search=${encodeURIComponent(searchQuery)}`;
      
      const response = await apiCall(endpoint, 'GET');
      const data = await response.json();
      
      if (response.ok && data.success !== false) {
        setTasks(data.data || []);
        if (data.pagination) {
          updatePagination({ total: data.pagination.total });
        }
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
    const delayDebounceFn = setTimeout(() => {
      fetchTasks();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, searchQuery, statusFilter]);

  const handleRefresh = () => {
    fetchTasks();
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('complete')) return 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800';
    if (s.includes('pending')) return 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800';
    if (s.includes('progress')) return 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800';
    return 'text-slate-700 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
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
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-[11px] uppercase tracking-wide font-bold ${getStatusColor(row.status)}`}>
          {row.status || 'UNKNOWN'}
        </span>
      )
    },
    { key: 'dueDate', label: 'Due Date', render: (row) => <span>{row.dates?.due_date || '-'}</span> },
  ];

  const getRowActions = (row) => [
    { id: 'view', label: 'View Details', icon: <Eye size={14} />, color: 'green', onClick: () => handleViewDetails(row) },
    { id: 'upload', label: 'Upload Documents', icon: <Upload size={14} />, color: 'indigo', onClick: () => navigate(`/tasks/${row.task_id}/documents`) },
    { id: 'edit', label: 'Edit Task', icon: <Edit size={14} />, color: 'blue', onClick: () => console.log('Edit', row.task_id) },
    { id: 'delete', label: 'Delete', icon: <Trash size={14} />, danger: true, onClick: () => console.log('Delete', row.task_id) },
  ];

  return (
    <ManagementHub
      eyebrow="Task Manager"
      title="Tasks & Assignments"
      description="Track and manage all operational tasks and deadlines."
      accent="amber"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onRefresh={handleRefresh}
      actions={
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-amber-600/20">
          <Plus size={16} />
          <span>New Task</span>
        </button>
      }
      summary={null}
    >
      <div className="mt-4 flex flex-col gap-4">
        
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
                { value: 'complete', label: 'Completed' }
              ],
              placeholder: 'Status',
              isClearable: true
            }
          ]}
        />

        {isLoading ? (
          <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center flex flex-col items-center">
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
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${getStatusColor(task.status)}`}>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Task Details"
        icon={CheckSquare}
        size="md"
        confirmText="Edit Task"
        onConfirm={() => console.log('Edit from modal', selectedItem?.task_id)}
      >
        {selectedItem && (
          <div className="space-y-4 text-sm">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Service:</span> 
              <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">{selectedItem.service?.name || '-'}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Firm:</span> 
              <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedItem.firm?.firm_name || '-'}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Charges:</span> 
              <p className="mt-1 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-0.5">
                <IndianRupee size={14} />
                {selectedItem.charges?.total || 0}
              </p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Status:</span> 
              <p className="mt-1">
                <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${getStatusColor(selectedItem.status)}`}>
                  {selectedItem.status || 'UNKNOWN'}
                </span>
              </p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Due Date:</span> 
              <p className="text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                <Clock size={14} />
                {selectedItem.dates?.due_date || '-'}
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700">
               <button 
                 onClick={() => navigate(`/tasks/${selectedItem.task_id}/documents`)}
                 className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg transition-colors font-medium w-full justify-center"
               >
                 <Upload size={16} />
                 Upload Task Documents
               </button>
            </div>
          </div>
        )}
      </Modal>

    </ManagementHub>
  );
}
