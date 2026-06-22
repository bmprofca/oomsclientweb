import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Edit, Trash, Clock, Eye } from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import ManagementFilters from '../components/common/ManagementFilters';
import Modal from '../components/common/Modal';
import Pagination, { usePagination } from '../components/common/PaginationComponent';

// Dummy Data
const DUMMY_TASKS = Array.from({ length: 60 }, (_, i) => ({
  id: `tsk-${i + 1}`,
  title: `Task Assignment ${i + 1}`,
  assignee: `User ${Math.floor(Math.random() * 10) + 1}`,
  priority: ['High', 'Medium', 'Low'][i % 3],
  status: ['Pending', 'In Progress', 'Completed'][i % 3],
  dueDate: new Date(Date.now() + Math.floor((Math.random() - 0.5) * 10000000000)).toLocaleDateString(),
}));

export default function Task() {
  const [viewMode, setViewMode] = useState('table');
  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 10);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredData = DUMMY_TASKS.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.assignee.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? item.status === statusFilter.value : true;
    const matchesPriority = priorityFilter ? item.priority === priorityFilter.value : true;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  useEffect(() => {
    updatePagination({ total: filteredData.length });
  }, [filteredData.length, updatePagination]);

  const startIndex = (pagination.page - 1) * pagination.limit;
  const currentData = filteredData.slice(startIndex, startIndex + pagination.limit);

  const handleRefresh = () => {
    console.log('Refreshing tasks...');
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'Medium': return 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30';
      case 'Low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      default: return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-900/30';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800';
      case 'In Progress': return 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800';
      case 'Pending': return 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800';
      default: return 'text-slate-700 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
    }
  };

  const tableColumns = [
    { key: 'title', label: 'Task Title', render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.title}</span> },
    { key: 'assignee', label: 'Assignee' },
    { 
      key: 'priority', 
      label: 'Priority',
      render: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(row.priority)}`}>
          {row.priority}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    { key: 'dueDate', label: 'Due Date' },
  ];

  const getRowActions = (row) => [
    { id: 'view', label: 'View Details', icon: <Eye size={14} />, color: 'green', onClick: () => handleViewDetails(row) },
    { id: 'edit', label: 'Edit Task', icon: <Edit size={14} />, color: 'blue', onClick: () => console.log('Edit', row.id) },
    { id: 'delete', label: 'Delete', icon: <Trash size={14} />, danger: true, onClick: () => console.log('Delete', row.id) },
  ];

  return (
    <ManagementHub
      eyebrow="Task Manager"
      title="Tasks & Assignments"
      description="Track and manage all operational tasks and deadlines."
      accent="amber"
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
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search tasks..."
          filters={[
            {
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'Pending', label: 'Pending' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Completed', label: 'Completed' }
              ],
              placeholder: 'Status',
              isClearable: true
            },
            {
              value: priorityFilter,
              onChange: setPriorityFilter,
              options: [
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' }
              ],
              placeholder: 'Priority',
              isClearable: true
            }
          ]}
        />

        {viewMode === 'table' ? (
          <ManagementTable
            columns={tableColumns}
            rows={currentData}
            rowKey="id"
            accent="amber"
            getActions={getRowActions}
            activeId={activeMenuId}
            onToggleAction={(e, id) => setActiveMenuId(id)}
            onRowClick={(row) => handleViewDetails(row)}
          />
        ) : (
          <ManagementGrid viewMode={viewMode}>
            {currentData.map((task) => (
              <ManagementCard
                key={task.id}
                title={task.title}
                subtitle={`Assigned to: ${task.assignee}`}
                accent="amber"
                icon={<CheckSquare size={16} />}
                badge={
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                }
                actions={getRowActions(task)}
                menuId={`menu-${task.id}`}
                activeId={activeMenuId}
                onToggle={(e, id) => setActiveMenuId(id)}
                onClick={() => handleViewDetails(task)}
              >
                <div className="mt-3 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Priority:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Clock size={12} />
                    <span>{task.dueDate}</span>
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
        onConfirm={() => console.log('Edit from modal', selectedItem?.id)}
      >
        {selectedItem && (
          <div className="space-y-4 text-sm">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Title:</span> 
              <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">{selectedItem.title}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Assignee:</span> 
              <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedItem.assignee}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Priority:</span> 
              <p className="mt-1">
                <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(selectedItem.priority)}`}>
                  {selectedItem.priority}
                </span>
              </p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Status:</span> 
              <p className="mt-1">
                <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(selectedItem.status)}`}>
                  {selectedItem.status}
                </span>
              </p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Due Date:</span> 
              <p className="text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                <Clock size={14} />
                {selectedItem.dueDate}
              </p>
            </div>
          </div>
        )}
      </Modal>

    </ManagementHub>
  );
}
