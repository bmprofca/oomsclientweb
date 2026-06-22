import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash, MapPin, Eye } from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import ManagementFilters from '../components/common/ManagementFilters';
import Modal from '../components/common/Modal';
import Pagination, { usePagination } from '../components/common/PaginationComponent';

// Dummy Data
export const DUMMY_FIRMS = Array.from({ length: 35 }, (_, i) => ({
  id: `frm-${i + 1}`,
  name: `Global Firm ${i + 1}`,
  type: ['Corporation', 'LLC', 'Partnership'][i % 3],
  location: ['New York, USA', 'London, UK', 'Tokyo, JP', 'Berlin, DE'][i % 4],
  employees: Math.floor(Math.random() * 500) + 10,
  status: i % 5 === 0 ? 'Inactive' : 'Active',
  contactEmail: `contact@firm${i + 1}.com`,
}));

export default function Firms() {
  const [viewMode, setViewMode] = useState('table');
  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 10);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredData = DUMMY_FIRMS.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? item.status === statusFilter.value : true;
    const matchesType = typeFilter ? item.type === typeFilter.value : true;
    return matchesSearch && matchesStatus && matchesType;
  });

  useEffect(() => {
    updatePagination({ total: filteredData.length });
  }, [filteredData.length, updatePagination]);

  const startIndex = (pagination.page - 1) * pagination.limit;
  const currentData = filteredData.slice(startIndex, startIndex + pagination.limit);

  const handleRefresh = () => {
    console.log('Refreshing firms...');
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const tableColumns = [
    { key: 'name', label: 'Firm Name', render: (row) => <span className="font-bold text-indigo-900 dark:text-indigo-200">{row.name}</span> },
    { key: 'type', label: 'Type' },
    { 
      key: 'location', 
      label: 'Location',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <MapPin size={14} className="text-slate-400" />
          <span>{row.location}</span>
        </div>
      )
    },
    { key: 'employees', label: 'Employees' },
    { 
      key: 'status', 
      label: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold ${row.status === 'Active' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
          {row.status}
        </span>
      )
    },
  ];

  const getRowActions = (row) => [
    { id: 'view', label: 'View Details', icon: <Eye size={14} />, color: 'green', onClick: () => handleViewDetails(row) },
    { id: 'edit', label: 'Edit Firm Details', icon: <Edit size={14} />, color: 'blue', onClick: () => console.log('Edit', row.id) },
    { id: 'delete', label: 'Remove Firm', icon: <Trash size={14} />, danger: true, onClick: () => console.log('Delete', row.id) },
  ];

  return (
    <ManagementHub
      eyebrow="Partner Directory"
      title="Firms & Organizations"
      description="Manage partner firms, client organizations, and their details."
      accent="indigo"
      onRefresh={handleRefresh}
      actions={
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-medium rounded-lg transition-all shadow-md shadow-indigo-600/20">
          <Plus size={16} />
          <span>Register Firm</span>
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
          searchPlaceholder="Search firms by name or location..."
          filters={[
            {
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' }
              ],
              placeholder: 'Status',
              isClearable: true
            },
            {
              value: typeFilter,
              onChange: setTypeFilter,
              options: [
                { value: 'Corporation', label: 'Corporation' },
                { value: 'LLC', label: 'LLC' },
                { value: 'Partnership', label: 'Partnership' }
              ],
              placeholder: 'Firm Type',
              isClearable: true
            }
          ]}
        />

        {viewMode === 'table' ? (
          <ManagementTable
            columns={tableColumns}
            rows={currentData}
            rowKey="id"
            accent="indigo"
            getActions={getRowActions}
            activeId={activeMenuId}
            onToggleAction={(e, id) => setActiveMenuId(id)}
            onRowClick={(row) => handleViewDetails(row)}
          />
        ) : (
          <ManagementGrid viewMode={viewMode}>
            {currentData.map((firm) => (
              <ManagementCard
                key={firm.id}
                title={firm.name}
                subtitle={firm.type}
                accent="indigo"
                icon={<Building2 size={16} />}
                badge={
                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold ${firm.status === 'Active' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {firm.status}
                  </span>
                }
                actions={getRowActions(firm)}
                menuId={`menu-${firm.id}`}
                activeId={activeMenuId}
                onToggle={(e, id) => setActiveMenuId(id)}
                onClick={() => handleViewDetails(firm)}
              >
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  {firm.location}
                </div>
                <div className="mt-3 flex justify-between items-center text-xs border-t border-slate-100 dark:border-gray-700 pt-2">
                  <span className="text-slate-500">Employees: <span className="font-semibold text-slate-900 dark:text-slate-200">{firm.employees}</span></span>
                  <a href={`mailto:${firm.contactEmail}`} className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium truncate max-w-[120px]">
                    {firm.contactEmail}
                  </a>
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
        title="Firm Details"
        icon={Building2}
        size="md"
        confirmText="Edit Firm"
        onConfirm={() => console.log('Edit from modal', selectedItem?.id)}
      >
        {selectedItem && (
          <div className="space-y-4 text-sm">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Name:</span> 
              <p className="text-indigo-900 dark:text-indigo-200 mt-1 font-bold">{selectedItem.name}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Type:</span> 
              <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedItem.type}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Status:</span> 
              <p className="mt-1">
                <span className={`px-2 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold ${selectedItem.status === 'Active' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {selectedItem.status}
                </span>
              </p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Location:</span> 
              <p className="text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <MapPin size={16} />
                {selectedItem.location}
              </p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Employees:</span> 
              <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedItem.employees}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Contact:</span> 
              <p className="mt-1">
                <a href={`mailto:${selectedItem.contactEmail}`} className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
                  {selectedItem.contactEmail}
                </a>
              </p>
            </div>
          </div>
        )}
      </Modal>

    </ManagementHub>
  );
}
