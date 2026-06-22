import React, { useState, useEffect } from 'react';
import { Layers, Plus, MoreVertical, Edit, Trash, Eye } from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import ManagementFilters from '../components/common/ManagementFilters';
import Modal from '../components/common/Modal';
import Pagination, { usePagination } from '../components/common/PaginationComponent';

// Dummy Data
const DUMMY_SERVICES = Array.from({ length: 45 }, (_, i) => ({
  id: `srv-${i + 1}`,
  name: `Service Name ${i + 1}`,
  description: `This is a description for service ${i + 1}.`,
  status: i % 3 === 0 ? 'Inactive' : 'Active',
  category: i % 2 === 0 ? 'Consulting' : 'Development',
  price: `$${(Math.random() * 1000).toFixed(2)}`,
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString(),
}));

export default function Services() {
  const [viewMode, setViewMode] = useState('table');
  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 10);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // New states for Filters & Modal
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Filter Data
  const filteredData = DUMMY_SERVICES.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? item.status === statusFilter.value : true;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  useEffect(() => {
    updatePagination({ total: filteredData.length });
  }, [filteredData.length, updatePagination]);

  const startIndex = (pagination.page - 1) * pagination.limit;
  const currentData = filteredData.slice(startIndex, startIndex + pagination.limit);

  const handleRefresh = () => {
    console.log('Refreshing services...');
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const tableColumns = [
    { key: 'name', label: 'Service Name', render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.name}</span> },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price' },
    { 
      key: 'status', 
      label: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
          {row.status}
        </span>
      )
    },
    { key: 'createdAt', label: 'Created At' },
  ];

  const getRowActions = (row) => [
    { id: 'view', label: 'View Details', icon: <Eye size={14} />, color: 'green', onClick: () => handleViewDetails(row) },
    { id: 'edit', label: 'Edit Service', icon: <Edit size={14} />, color: 'blue', onClick: () => console.log('Edit', row.id) },
    { id: 'delete', label: 'Delete', icon: <Trash size={14} />, danger: true, onClick: () => console.log('Delete', row.id) },
  ];

  return (
    <ManagementHub
      eyebrow="Services Directory"
      title="Services Management"
      description="Manage all your available services, pricing, and categories."
      accent="blue"
      onRefresh={handleRefresh}
      actions={
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={16} />
          <span>Add Service</span>
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
          searchPlaceholder="Search services..."
          filters={[
            {
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' }
              ],
              placeholder: 'Filter by Status',
              isClearable: true
            }
          ]}
        />

        {viewMode === 'table' ? (
          <ManagementTable
            columns={tableColumns}
            rows={currentData}
            rowKey="id"
            accent="blue"
            getActions={getRowActions}
            activeId={activeMenuId}
            onToggleAction={(e, id) => setActiveMenuId(id)}
            onRowClick={(row) => handleViewDetails(row)}
          />
        ) : (
          <ManagementGrid viewMode={viewMode}>
            {currentData.map((service) => (
              <ManagementCard
                key={service.id}
                title={service.name}
                subtitle={service.category}
                accent="blue"
                icon={<Layers size={16} />}
                badge={
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${service.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {service.status}
                  </span>
                }
                actions={getRowActions(service)}
                menuId={`menu-${service.id}`}
                activeId={activeMenuId}
                onToggle={(e, id) => setActiveMenuId(id)}
                onClick={() => handleViewDetails(service)}
              >
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {service.description}
                </div>
                <div className="mt-3 flex justify-between items-center text-xs font-medium">
                  <span className="text-slate-500">Price: <span className="text-slate-900 dark:text-slate-200">{service.price}</span></span>
                  <span className="text-slate-400">{service.createdAt}</span>
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

      {/* View Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Service Details"
        icon={Layers}
        size="md"
        confirmText="Edit Service"
        onConfirm={() => console.log('Edit from modal', selectedItem?.id)}
      >
        {selectedItem && (
          <div className="space-y-4 text-sm">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Name:</span> 
              <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedItem.name}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Category:</span> 
              <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedItem.category}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Status:</span> 
              <p className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedItem.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {selectedItem.status}
                </span>
              </p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Price:</span> 
              <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedItem.price}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Description:</span> 
              <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedItem.description}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Created At:</span> 
              <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedItem.createdAt}</p>
            </div>
          </div>
        )}
      </Modal>

    </ManagementHub>
  );
}
