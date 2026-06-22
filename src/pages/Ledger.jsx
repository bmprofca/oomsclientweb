import React, { useState, useEffect } from 'react';
import { Receipt, Eye, FileText } from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementFilters from '../components/common/ManagementFilters';
import Modal from '../components/common/Modal';
import Pagination, { usePagination } from '../components/common/PaginationComponent';
import { formatAmount, formatDate } from '../utils/helpers';

// Dummy Ledger Data
const DUMMY_LEDGER = Array.from({ length: 40 }, (_, i) => {
  const baseAmounts = [5000, 12000, 25000, 8500, 45000, 15000];
  const baseAmount = baseAmounts[i % baseAmounts.length];
  const gstAmount = Math.round(baseAmount * 0.18);
  const totalAmount = baseAmount + gstAmount;
  const status = ['Paid', 'Pending', 'Overdue'][i % 3];
  
  return {
    id: `INV-2026-${String(i + 1).padStart(3, '0')}`,
    firmName: `Global Firm ${(i % 10) + 1}`,
    description: [
      'GST Quarterly Filing & Reconciliation',
      'Corporate Income Tax Returns (ITR-6)',
      'Tax Audit & Compliance Certification',
      'TDS Assessment & Filing',
      'Transfer Pricing Advisory Services',
      'Startup Tax Advisory & Registration'
    ][i % 6],
    baseAmount,
    gstAmount,
    totalAmount,
    status,
    issueDate: new Date(Date.now() - Math.floor(Math.random() * 8000000000) - 1000000000).toLocaleDateString('en-CA'),
    paymentMode: status === 'Paid' ? ['UPI / Net Banking', 'Credit/Debit Card', 'Bank Transfer'][i % 3] : '—',
    paymentRef: status === 'Paid' ? `TXN${1000000000 + i * 297493}` : '—',
  };
});

export default function Ledger() {
  const [viewMode, setViewMode] = useState('table');
  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 10);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Stats calculation
  const totalBilled = DUMMY_LEDGER.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalPaid = DUMMY_LEDGER.filter(item => item.status === 'Paid').reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalOutstanding = DUMMY_LEDGER.filter(item => item.status !== 'Paid').reduce((acc, curr) => acc + curr.totalAmount, 0);
  const pendingCount = DUMMY_LEDGER.filter(item => item.status !== 'Paid').length;

  // Filter Data
  const filteredData = DUMMY_LEDGER.filter(item => {
    const matchesSearch = 
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.firmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? item.status === statusFilter.value : true;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    updatePagination({ total: filteredData.length });
  }, [filteredData.length, updatePagination]);

  const startIndex = (pagination.page - 1) * pagination.limit;
  const currentData = filteredData.slice(startIndex, startIndex + pagination.limit);

  const handleRefresh = () => {
    console.log('Refreshing ledger entries...');
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800';
      case 'Pending':
        return 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800';
      case 'Overdue':
        return 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30 border border-red-200 dark:border-red-800';
      default:
        return 'text-slate-700 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
    }
  };

  const tableColumns = [
    { key: 'id', label: 'Invoice ID', render: (row) => <span className="font-bold text-slate-800 dark:text-gray-100">{row.id}</span> },
    { key: 'firmName', label: 'Firm Name' },
    { key: 'description', label: 'Description', className: 'w-[250px]' },
    { 
      key: 'totalAmount', 
      label: 'Amount (INR)', 
      render: (row) => <span className="font-bold text-slate-900 dark:text-white">{formatAmount(row.totalAmount)}</span> 
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
    { key: 'issueDate', label: 'Issue Date', render: (row) => formatDate(row.issueDate) },
  ];

  const getRowActions = (row) => [
    { id: 'view', label: 'View Tax Receipt', icon: <Eye size={14} />, color: 'green', onClick: () => handleViewDetails(row) },
    { id: 'download', label: 'Download PDF', icon: <FileText size={14} />, color: 'blue', onClick: () => console.log('Download', row.id) },
  ];

  // Visual summary cards
  const summary = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mb-2">
      <div className="p-3 bg-slate-50 dark:bg-gray-800/50 rounded-xl border border-slate-100 dark:border-gray-800 flex flex-col justify-between">
        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-500 tracking-wider">Total Billed</span>
        <span className="text-sm md:text-base font-extrabold text-slate-850 dark:text-gray-100 mt-1">{formatAmount(totalBilled)}</span>
      </div>
      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20 flex flex-col justify-between">
        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-500 tracking-wider">Total Received</span>
        <span className="text-sm md:text-base font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">{formatAmount(totalPaid)}</span>
      </div>
      <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 rounded-xl border border-amber-100/50 dark:border-amber-900/20 flex flex-col justify-between">
        <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-500 tracking-wider">Outstanding Dues</span>
        <span className="text-sm md:text-base font-extrabold text-amber-700 dark:text-amber-400 mt-1">{formatAmount(totalOutstanding)}</span>
      </div>
      <div className="p-3 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-100/50 dark:border-red-900/20 flex flex-col justify-between">
        <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-500 tracking-wider">Unpaid Invoices</span>
        <span className="text-sm md:text-base font-extrabold text-red-700 dark:text-red-400 mt-1">{pendingCount} pending</span>
      </div>
    </div>
  );

  return (
    <ManagementHub
      eyebrow="Financial ledger"
      title="Tax Invoicing & Receipts"
      description="Track consultant service fees, tax return billings, and transaction collections."
      accent="emerald"
      onRefresh={handleRefresh}
      summary={summary}
      actions={null}
    >
      <div className="mt-4 flex flex-col gap-4">
        
        <ManagementFilters 
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search invoices by ID, description, or firm..."
          filters={[
            {
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'Paid', label: 'Paid' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Overdue', label: 'Overdue' }
              ],
              placeholder: 'Filter Status',
              isClearable: true
            }
          ]}
        />

        {viewMode === 'table' ? (
          <ManagementTable
            columns={tableColumns}
            rows={currentData}
            rowKey="id"
            accent="emerald"
            getActions={getRowActions}
            activeId={activeMenuId}
            onToggleAction={(e, id) => setActiveMenuId(id)}
            onRowClick={(row) => handleViewDetails(row)}
          />
        ) : (
          <ManagementGrid viewMode={viewMode}>
            {currentData.map((invoice) => (
              <ManagementCard
                key={invoice.id}
                title={invoice.id}
                subtitle={invoice.firmName}
                accent="emerald"
                icon={<Receipt size={16} />}
                badge={
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                }
                actions={getRowActions(invoice)}
                menuId={`menu-${invoice.id}`}
                activeId={activeMenuId}
                onToggle={(e, id) => setActiveMenuId(id)}
                onClick={() => handleViewDetails(invoice)}
              >
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {invoice.description}
                </div>
                <div className="mt-3 flex justify-between items-center text-xs border-t border-slate-100 dark:border-gray-700 pt-2 font-medium">
                  <span className="text-slate-500">Total: <span className="text-slate-900 dark:text-slate-200 font-bold">{formatAmount(invoice.totalAmount)}</span></span>
                  <span className="text-slate-400">{formatDate(invoice.issueDate)}</span>
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

      {/* Invoice Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tax Invoice Breakdown"
        icon={Receipt}
        size="md"
        confirmText="Download Invoice"
        onConfirm={() => console.log('Download invoice PDF from modal', selectedItem?.id)}
      >
        {selectedItem && (
          <div className="space-y-4 text-sm text-slate-700 dark:text-gray-300">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Invoice ID</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedItem.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Status</p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold ${getStatusColor(selectedItem.status)}`}>
                  {selectedItem.status}
                </span>
              </div>
            </div>

            {/* Bill details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400 block uppercase tracking-wider">Billed To</span>
                <span className="font-bold text-slate-800 dark:text-gray-200">{selectedItem.firmName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block uppercase tracking-wider">Date of Issue</span>
                <span>{formatDate(selectedItem.issueDate)}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block uppercase tracking-wider">Services Description</span>
              <span className="font-medium text-slate-800 dark:text-gray-200">{selectedItem.description}</span>
            </div>

            {/* Price Calculations */}
            <div className="bg-slate-50 dark:bg-gray-900/60 p-4 rounded-xl border border-slate-100 dark:border-gray-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Base Consulting Charges:</span>
                <span className="font-medium">{formatAmount(selectedItem.baseAmount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Integrated GST (IGST @ 18%):</span>
                <span className="font-medium">{formatAmount(selectedItem.gstAmount)}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-gray-700 my-2 pt-2 flex justify-between text-base font-extrabold text-slate-900 dark:text-white">
                <span>Total Payable (incl. taxes):</span>
                <span>{formatAmount(selectedItem.totalAmount)}</span>
              </div>
            </div>

            {/* Payment Audit */}
            {selectedItem.status === 'Paid' ? (
              <div className="border-t border-gray-150 dark:border-gray-700 pt-3 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider">Payment Mode</span>
                  <span className="font-semibold text-slate-750 dark:text-gray-250">{selectedItem.paymentMode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider">Transaction Ref ID</span>
                  <span className="font-semibold text-slate-750 dark:text-gray-250">{selectedItem.paymentRef}</span>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-150 dark:border-gray-700 pt-3 text-xs text-center text-red-500 font-semibold bg-red-50/50 dark:bg-red-950/10 p-2.5 rounded-lg border border-red-150 dark:border-red-900/20">
                ⚠️ Account outstanding balance is due. Please clear invoice prompt to avoid penalties.
              </div>
            )}
          </div>
        )}
      </Modal>
    </ManagementHub>
  );
}
