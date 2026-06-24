import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Phone,
  Mail,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

const FAQS = [
  {
    category: 'General',
    questions: [
      {
        q: "What is OOMS Client Portal?",
        a: "OOMS (Office Operations Management System) is an integrated platform designed for managing services, documents, firms, ledger updates, and tasks related to your organization. This portal allows clients to track ongoing projects, check invoicing, upload necessary documentation, and communicate with branch support seamlessly."
      },
      {
        q: "How do I update my profile details?",
        a: "Navigate to 'My Profile' from the user menu (top right) or sidebar. You can view all profile parameters such as phone numbers, billing address, and GST numbers. To update details, please get in touch with the branch administrator using the contact details on this support page."
      },
      {
        q: "How secure is my data on the OOMS platform?",
        a: "Security is our top priority. All data is encrypted in transit and at rest. We follow industry-standard practices including role-based access control, regular security audits, and secure cloud infrastructure to protect your sensitive documents and business information."
      }
    ]
  },
  {
    category: 'Services',
    questions: [
      {
        q: "What is the difference between Compliance and General services?",
        a: "Compliance services are mandatory regulatory/legal procedures (e.g., GST filing, tax audits, corporate filings) that carry fixed schedules and statutory deadlines. General services are operational or custom consultation services requested on-demand."
      },
      {
        q: "How can I request a new service?",
        a: "To request a new service, you can browse through the 'Services' tab to check available offerings and pricing. You can then submit a request directly through the platform or contact your branch manager to initialize a service request."
      },
      {
        q: "Can I track the status of my service requests?",
        a: "Yes, all active service requests are visible on your dashboard under 'Active Services'. You can see real-time status updates, expected completion dates, and any actions required from your side. Notifications are also sent via email for major status changes."
      }
    ]
  },
  {
    category: 'Documents',
    questions: [
      {
        q: "Where can I find output documents?",
        a: "All completed deliverables and certificates are stored under the 'Documents' page. Select the 'Output Docs' tab to view or download completed filings, acknowledgments, and invoices uploaded by our team."
      },
      {
        q: "Is there a limit to the size of files I can upload?",
        a: "You can upload files in common formats (PDF, JPEG, PNG, Excel) up to 10MB per document. If you have larger files, please compress them or share a secure cloud drive link through the Support Query form on this page."
      },
      {
        q: "How do I share documents with my branch securely?",
        a: "Use the built-in file upload feature on the Documents page. Files are encrypted during transfer and stored securely. For bulk or extremely sensitive data, we recommend using the secure link sharing option or contacting your branch support for a dedicated transfer method."
      }
    ]
  },
  {
    category: 'Ledger & Payments',
    questions: [
      {
        q: "How do I view my payment history and invoices?",
        a: "Click on the 'Ledger' page in the sidebar. This page details all transactions, credit/debit records, outstanding dues, and enables you to download invoices and statement reports for your firms."
      },
      {
        q: "What payment methods are accepted?",
        a: "We support multiple payment methods including Bank Transfer (IMPS/NEFT/RTGS), UPI, and net banking. Bank details are typically mentioned on the generated invoices, or you can contact support for payment link queries."
      },
      {
        q: "How can I download my ledger statement?",
        a: "Go to the 'Ledger' section and select the desired date range. You can generate and download a detailed ledger statement in PDF format containing all transactions, opening balances, payments received, invoices, and outstanding dues for your records."
      },
      {
        q: "Why is there an outstanding balance in my ledger?",
        a: "An outstanding balance indicates invoices or service charges that have not yet been fully settled. You can review pending invoices, payment history, and due dates in the Ledger section. If you believe the balance is incorrect, please contact your branch support team for verification."
      }
    ]
  }
];

export default function Support() {
  const [supportData, setSupportData] = useState({ phone: [], email: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [copiedMap, setCopiedMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqKey, setOpenFaqKey] = useState(null);

  const fetchSupportData = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/branch/support', 'GET');
      const result = await response.json();

      if (response.ok && result.success !== false) {
        setSupportData({
          phone: result.data?.phone || ["7364076458", "7002695990"],
          email: result.data?.email || ["souravadhikary1916@gmail.com", "bmprofca@gmail.com"]
        });
      } else {
        throw new Error(result.message || "Failed to load support contact data");
      }
    } catch (error) {
      console.error("Error fetching support details:", error);
      // Populate with default fallback contact data
      setSupportData({
        phone: ["7364076458", "7002695990"],
        email: ["souravadhikary1916@gmail.com", "bmprofca@gmail.com"]
      });
      toast.error("Using offline support contact details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportData();
  }, []);

  const handleCopyToClipboard = (text, key) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMap(prev => ({ ...prev, [key]: true }));
      toast.success("Copied to clipboard!");
      setTimeout(() => {
        setCopiedMap(prev => ({ ...prev, [key]: false }));
      }, 2500);
    } else {
      toast.error("Clipboard copy not supported by browser.");
    }
  };

  // Filter FAQs based on search
  const getFilteredFaqs = () => {
    if (!searchQuery.trim()) return FAQS;
    const query = searchQuery.toLowerCase();

    return FAQS.map(cat => {
      const filteredQuestions = cat.questions.filter(
        item => item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)
      );
      return {
        ...cat,
        questions: filteredQuestions
      };
    }).filter(cat => cat.questions.length > 0);
  };

  const filteredFaqs = getFilteredFaqs();

  return (
    <ManagementHub
      title="Help & Support"
      description="Connect with branch support operatives and find answers to common questions."
      accent="blue"
      onRefresh={fetchSupportData}
      refreshing={isLoading}
      refreshLabel="Refresh Contacts"
    >
      {isLoading ? (
        // Modern skeleton loading
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-8 animate-pulse">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 h-96">
              <div className="h-5 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-full mb-6"></div>
              <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-xl mb-6"></div>
              <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3"></div>
              <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-full mb-3"></div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 h-80">
              <div className="h-5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-full mb-6"></div>
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4"></div>
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
            </div>
            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 h-44">
              <div className="h-5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-8 items-start w-full">

          {/* ================= LEFT SECTION (FAQ) ================= */}
          <div className="lg:col-span-2 space-y-8">

            {/* FAQ Search and Accordions */}
            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md">
              <div className="p-8 border-b border-slate-50 dark:border-slate-800/60 bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-800/40 dark:to-slate-900/80">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                        <Sparkles size={18} className="text-blue-600 dark:text-blue-400" />
                      </span>
                      Frequently Asked Questions
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 ml-12">
                      Quick self-service lookup for portal features
                    </p>
                  </div>

                  {/* Search Box */}
                  <div className="relative w-full md:w-80">
                    <input
                      type="text"
                      placeholder="Search FAQs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-5 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                    />
                    <Search size={16} className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" />
                  </div>
                </div>
              </div>

              <div className="p-8 divide-y divide-slate-50 dark:divide-slate-800/60">
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-5">
                      <AlertCircle className="text-slate-400 dark:text-slate-500" size={28} />
                    </div>
                    <p className="text-base font-medium text-slate-600 dark:text-slate-400">No matching FAQs found</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                      Try resetting your search query or contact your branch directly using the details on the right.
                    </p>
                  </div>
                ) : (
                  filteredFaqs.map((cat, catIdx) => (
                    <div key={cat.category} className={catIdx > 0 ? "pt-8 mt-8" : ""}>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 rounded-full">
                        {cat.category}
                      </span>
                      <div className="mt-5 space-y-4">
                        {cat.questions.map((item, itemIdx) => {
                          const itemKey = `${cat.category}-${itemIdx}`;
                          const isOpen = openFaqKey === itemKey;
                          return (
                            <div
                              key={item.q}
                              className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/30 dark:bg-slate-800/10 transition-all hover:border-blue-100 dark:hover:border-blue-900/30"
                            >
                              <button
                                type="button"
                                onClick={() => setOpenFaqKey(isOpen ? null : itemKey)}
                                className="w-full flex items-center justify-between text-left p-5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors focus:outline-none"
                              >
                                <span>{item.q}</span>
                                {isOpen ? <ChevronUp size={18} className="text-slate-400 shrink-0 ml-3" /> : <ChevronDown size={18} className="text-slate-400 shrink-0 ml-3" />}
                              </button>

                              {isOpen && (
                                <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-800/60 bg-white/50 dark:bg-slate-800/20">
                                  {item.a}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ================= RIGHT SECTION (CONTACT DETAILS) ================= */}
          <div className="space-y-8">

            {/* Direct Contact Cards */}
            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md">
              <div className="p-8 border-b border-slate-50 dark:border-slate-800/60 bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-800/40 dark:to-slate-900/80">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                  <span className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <LifeBuoy size={18} className="text-blue-600 dark:text-blue-400" />
                  </span>
                  Direct Connections
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 ml-12">
                  Talk to branch support agents immediately
                </p>
              </div>

              <div className="p-8 space-y-8">

                {/* Phone Numbers section */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    Phone Support
                  </h3>
                  <div className="space-y-4">
                    {supportData.phone.map((num, idx) => (
                      <div
                        key={`phone-${idx}`}
                        className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-xl p-5 hover:border-blue-200 dark:hover:border-blue-900/40 transition-all duration-200 hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-mono font-bold text-slate-800 dark:text-slate-200">
                            {num.replace(/(\d{5})(\d{5})/, "$1-$2")}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopyToClipboard(num, `phone-${idx}`)}
                            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none"
                            title="Copy number"
                          >
                            {copiedMap[`phone-${idx}`] ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                          </button>
                        </div>

                        <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                          <a
                            href={`tel:${num}`}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm"
                          >
                            <Phone size={14} className="text-blue-500" />
                            Call Now
                          </a>
                          <a
                            href={`https://wa.me/91${num}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-full text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/50 transition-colors shadow-sm"
                          >
                            <MessageSquare size={14} className="text-emerald-500" />
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email Address Section */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    Email Support
                  </h3>
                  <div className="space-y-4">
                    {supportData.email.map((email, idx) => (
                      <div
                        key={`email-${idx}`}
                        className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-xl p-5 hover:border-blue-200 dark:hover:border-blue-900/40 transition-all duration-200 hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-mono font-medium text-slate-800 dark:text-slate-300 truncate">
                            {email}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopyToClipboard(email, `email-${idx}`)}
                            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0 focus:outline-none"
                            title="Copy email"
                          >
                            {copiedMap[`email-${idx}`] ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                          </button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                          <a
                            href={`mailto:${email}?subject=OOMS Support Assistance - Branch Service`}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm"
                          >
                            <Mail size={14} className="text-blue-500" />
                            Send Email
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Support Hours Card */}
            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md">
              <div className="p-8 border-b border-slate-50 dark:border-slate-800/60 bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-800/40 dark:to-slate-900/80">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                  <span className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <Clock size={18} className="text-blue-600 dark:text-blue-400" />
                  </span>
                  Support Hours
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 ml-12">
                  Availability of branch office staff
                </p>
              </div>

              <div className="p-8 space-y-5 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Business Days</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monday to Saturday</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Closed on Sundays & National Holidays</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Office Hours</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">10:00 AM - 07:00 PM IST</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Response turnaround time: &lt; 24 Hours</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl p-5 border border-blue-100 dark:border-blue-900/30">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-medium leading-relaxed">
                    For billing discrepancies or urgent compliance deadlines, we recommend initiating a direct phone call for accelerated turnaround.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </ManagementHub>
  );
}