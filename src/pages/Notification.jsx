import React, { useState, useEffect } from 'react';
import { FileClock, Search, Eye, RefreshCw, Upload, AlertCircle, FileText, CheckCircle, Info, HelpCircle } from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import ManagementFilters from '../components/common/ManagementFilters';
import Modal from '../components/common/Modal';
import Pagination, { usePagination } from '../components/common/PaginationComponent';
import { useToast } from '../contexts/ToastContext';
import { formatDate } from '../utils/helpers';

// Dummy updates activity log data
const DUMMY_UPDATES = Array.from({ length: 50 }, (_, i) => {
  const severities = ['Success', 'Info', 'Warning', 'Action Required'];
  const severity = severities[i % severities.length];

  const tasksRef = `tsk-${(i % 12) + 1}`;
  const firmName = `Global Firm ${(i % 10) + 1}`;

  let title = '';
  let message = '';
  let documentName = null;

  if (severity === 'Success') {
    title = ['GSTR-1 GST Return Submitted', 'Income Tax Return (ITR-6) Filed', 'Aadhaar-PAN Verification Complete', 'Tax Audit Report Issued'][i % 4];
    message = [
      `GSTR-1 filing successfully submitted for ${firmName}. ARN: GST2026849204.`,
      `ITR-6 corporate income tax return successfully submitted for assessment year 2026-27. Acknowledgment Number: ITR984204203.`,
      `Central Board of Direct Taxes (CBDT) verification complete for ${firmName} PAN logs.`,
      `Form 3CD Tax Audit report signed and submitted by auditor CA Suresh Kumar.`
    ][i % 4];
    documentName = ['gstr1_ack.pdf', 'itr6_ack.pdf', 'pan_verification_cert.pdf', 'tax_audit_report_form3cd.pdf'][i % 4];
  } else if (severity === 'Info') {
    title = ['Tax Consultant Assigned', 'Tax Planning Session Scheduled', 'GST Portal Sync Completed', 'Form 26AS Statement Fetched'][i % 4];
    message = [
      `Senior Tax Advisor Suresh Kumar has been assigned to manage ${firmName}'s filings.`,
      `Quarterly tax consultation video call scheduled for ${formatDate(new Date(Date.now() + 172800000))} at 11:00 AM IST.`,
      `GST portal API successfully fetched latest ledger balances.`,
      `Tax Credit Statement (Form 26AS) downloaded from TRACES profile.`
    ][i % 4];
  } else if (severity === 'Warning') {
    title = ['TDS Rate discrepancy Flagged', 'GST ITC Balance Low', 'Corporate ITR Assessment Deadline', 'Form 16 Mismatch Alert'][i % 4];
    message = [
      `Section 194J TDS rate mismatch flagged: deducted at 2% instead of 10% on technical consulting invoices.`,
      `Electronic Credit Ledger balances under CGST/SGST are insufficient to offset current liability. Top-up recommended.`,
      `Filing deadline for Assessment Year 2026-27 is approaching. Pending compliance documents from auditor.`,
      `TDS credits reported by employer on Form 16 differ from Form 26AS records by ₹4,800.`
    ][i % 4];
  } else {
    title = ['Upload Form 16 / TDS Certificate', 'Aadhaar-OTP Verification Pending', 'Corporate Bank Statement Required', 'Submit Rent Agreement for HRA'][i % 4];
    message = [
      `Missing Form 16 document for Director. Upload to complete income tax computation.`,
      `E-filing portal demands Aadhaar-OTP e-verification to complete the validation flow.`,
      `Provide bank statements for April 2025 to March 2026 to complete cash-flow audit reconciliation.`,
      `Rent agreement copies and landlord's PAN required to claim House Rent Allowance (HRA) deductions.`
    ][i % 4];
    documentName = 'Awaiting Upload...';
  }

  return {
    id: `LOG-2026-${String(i + 1).padStart(3, '0')}`,
    taskRef: tasksRef,
    firmName,
    title,
    message,
    severity,
    timestamp: new Date(Date.now() - i * 3600000 * 2.5 - 600000).toISOString(),
    operator: ['CA Suresh Kumar', 'Assistant Tax Executive Ritika S.', 'System Automated sync', 'Audit Auditor CA Ramesh'][i % 4],
    documentName,
    isCompleted: severity !== 'Action Required',
  };
});

export default function Updates() {
  const showToast = useToast();
  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 10);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // File upload state simulation
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);

  // Filter Data
  const filteredData = DUMMY_UPDATES.filter(item => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.firmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter ? item.severity === severityFilter.value : true;
    return matchesSearch && matchesSeverity;
  });

  useEffect(() => {
    updatePagination({ total: filteredData.length });
  }, [filteredData.length, updatePagination]);

  const startIndex = (pagination.page - 1) * pagination.limit;
  const currentData = filteredData.slice(startIndex, startIndex + pagination.limit);

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'Success':
        return {
          icon: <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          badge: 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 border border-emerald-250 dark:border-emerald-800',
          indicator: 'bg-emerald-500 ring-emerald-200 dark:ring-emerald-950',
        };
      case 'Info':
        return {
          icon: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
          badge: 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 border border-blue-250 dark:border-blue-800',
          indicator: 'bg-blue-500 ring-blue-200 dark:ring-blue-950',
        };
      case 'Warning':
        return {
          icon: <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          badge: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 border border-amber-250 dark:border-amber-800',
          indicator: 'bg-amber-500 ring-amber-200 dark:ring-amber-950',
        };
      case 'Action Required':
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />,
          badge: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30 border border-red-250 dark:border-red-800',
          indicator: 'bg-red-500 ring-red-200 dark:ring-red-950',
        };
      default:
        return {
          icon: <HelpCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          badge: 'text-slate-700 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
          indicator: 'bg-slate-500 ring-slate-200 dark:ring-slate-950',
        };
    }
  };

  const handleOpenDetails = (item) => {
    setSelectedItem(item);
    setUploadedFileUrl(null);
    setIsModalOpen(true);
  };

  // Mock Upload Handler
  const handleSimulateUpload = (e) => {
    e.preventDefault();
    setUploadingFile(true);
    setTimeout(() => {
      setUploadingFile(false);
      setUploadedFileUrl('uploaded_document_receipt_v1.pdf');
      showToast.success('Compliance document successfully uploaded!');
      // Update selected item visual mock
      if (selectedItem) {
        selectedItem.documentName = 'uploaded_document_receipt_v1.pdf';
        selectedItem.isCompleted = true;
      }
    }, 1500);
  };

  return (
    <ManagementHub
      title="Task Process Notification"
      description="Real-time log of document clearances, audit validations, GST reconciliations, and tax agent actions."
      accent="indigo"
      onRefresh={() => console.log('Refreshing timeline updates...')}
    >
      <div className="mt-4 flex flex-col gap-2">
        <ManagementFilters
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search processes, logs, firm details..."
          filters={[
            {
              value: severityFilter,
              onChange: setSeverityFilter,
              options: [
                { value: 'Success', label: 'Success' },
                { value: 'Info', label: 'Info' },
                { value: 'Warning', label: 'Warning' },
                { value: 'Action Required', label: 'Action Required' }
              ],
              placeholder: 'Filter Severity',
              isClearable: true
            }
          ]}
        />

        {/* Timeline Layout */}
        {currentData.length > 0 ? (
          <div className="relative border-l border-slate-250 dark:border-gray-700/80 ml-4 md:ml-6 mt-2 space-y-6 pb-4">
            {currentData.map((log, index) => {
              const styles = getSeverityStyles(log.severity);
              return (
                <div key={log.id} className="relative pl-6 md:pl-8 group">
                  {/* Timeline point */}
                  <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-gray-900 ring-4 ${styles.indicator} transition-all duration-300 group-hover:scale-110`} />

                  {/* Card Container */}
                  <div className="bg-white dark:bg-gray-800 rounded-md border border-slate-150 dark:border-gray-700/60 p-4 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${styles.badge}`}>
                          {log.severity}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 dark:text-gray-500">
                          {log.id}
                        </span>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                          Ref: {log.taskRef}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mt-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {log.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {log.message}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-gray-700 flex flex-wrap justify-between items-center text-[11px] gap-2">
                      <span className="text-slate-400">
                        Firm: <span className="font-semibold text-slate-700 dark:text-slate-350">{log.firmName}</span>
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">
                          Operator: <span className="font-medium text-slate-700 dark:text-slate-350">{log.operator}</span>
                        </span>
                        <button
                          onClick={() => handleOpenDetails(log)}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-slate-700 dark:text-gray-200 font-semibold transition-colors"
                        >
                          <Eye size={12} />
                          <span>Audit Log</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-md border border-slate-200 dark:border-gray-700 p-8 text-center text-slate-400">
            No process logs found matching search criteria.
          </div>
        )}

        <Pagination
          currentPage={pagination.page}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={goToPage}
          onLimitChange={changeLimit}
        />
      </div>

      {/* Process Audit Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Process Step Audit Log"
        icon={FileClock}
        size="md"
        confirmText={selectedItem?.severity === 'Action Required' && !uploadedFileUrl ? "Awaiting Upload" : "Okay"}
        onConfirm={() => setIsModalOpen(false)}
      >
        {selectedItem && (
          <div className="space-y-4 text-sm text-slate-700 dark:text-gray-300">
            {/* Header */}
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Activity Subject</p>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">{selectedItem.title}</h3>
              <p className="text-xs text-slate-400 mt-1">Logged on {new Date(selectedItem.timestamp).toLocaleString()}</p>
            </div>

            {/* Severity and Status Tag */}
            <div className="flex gap-4 border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Severity</span>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold ${getSeverityStyles(selectedItem.severity).badge}`}>
                  {selectedItem.severity}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Filing Reference</span>
                <span className="font-bold text-slate-900 dark:text-white mt-1 inline-block">{selectedItem.id}</span>
              </div>
            </div>

            {/* Message */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Process Details</span>
              <p className="bg-slate-50 dark:bg-gray-900/60 p-3 rounded-md border border-slate-100 dark:border-gray-800 text-xs leading-relaxed mt-1">
                {selectedItem.message}
              </p>
            </div>

            {/* Audits Metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block uppercase tracking-wider">Assigned Operator</span>
                <span className="font-semibold text-slate-800 dark:text-gray-200">{selectedItem.operator}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase tracking-wider">Organization Bound</span>
                <span className="font-semibold text-slate-800 dark:text-gray-200">{selectedItem.firmName}</span>
              </div>
            </div>

            {/* Document Attachments / Interactive Upload Mock */}
            <div className="border-t border-slate-200 dark:border-gray-700 pt-3">
              <span className="text-[10px] text-slate-400 uppercase block tracking-wider mb-2">Audit Attachments</span>

              {selectedItem.severity === 'Action Required' && !uploadedFileUrl ? (
                <div className="p-4 border-2 border-dashed border-red-300 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/5 rounded-md text-center">
                  <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
                  <p className="text-xs font-bold text-slate-800 dark:text-gray-200">Compliance Document Required</p>
                  <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1 mb-3">Please upload the requested statement in PDF format (Max 5MB)</p>

                  <button
                    onClick={handleSimulateUpload}
                    disabled={uploadingFile}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-750 text-white rounded-md text-xs font-bold transition-all shadow-sm shadow-red-500/10 active:scale-95 disabled:opacity-50"
                  >
                    <Upload size={12} className={uploadingFile ? "animate-bounce" : ""} />
                    <span>{uploadingFile ? "Uploading File..." : "Simulate File Upload"}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-900/60 rounded-md border border-slate-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-805 dark:text-gray-200 truncate">
                      {uploadedFileUrl || selectedItem.documentName || "No attachments found for this event."}
                    </span>
                  </div>
                  {(uploadedFileUrl || selectedItem.documentName) && (
                    <button
                      onClick={() => showToast.info(`Downloading ${uploadedFileUrl || selectedItem.documentName}...`)}
                      className="px-2.5 py-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-750 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 rounded-md transition-colors"
                    >
                      Download
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </ManagementHub>
  );
}