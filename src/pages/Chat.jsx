import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Award, ShieldCheck, Clock, Zap, Bot } from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';

// Initial chat history
const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: 'agent',
    text: 'Hello! I am CA Suresh Kumar, your senior tax consultant. How can I assist you with your tax filing, GST audit, or corporate compliances today?',
    timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 2,
    sender: 'user',
    text: 'Hi Suresh, I received a warning about a TDS Section 194J rate discrepancy on our technical consulting invoices. Can you help clarify this?',
    timestamp: new Date(Date.now() - 1800000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 3,
    sender: 'agent',
    text: 'Yes, absolutely. Under Section 194J, technical services deductions should be done at 10%. If they were deducted at 2% (which is the rate for professional fees or call center operations under certain clauses), it will show as a mismatch in the TRACES portal. We should check your specific invoice classification to see if we need to file a correction statement.',
    timestamp: new Date(Date.now() - 900000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

// Quick suggestion buttons
const QUICK_QUESTIONS = [
  { text: 'Check ITR filing deadline', reply: 'The standard filing deadline for corporate ITR (Form ITR-6) for FY 2025-26 (AY 2026-27) is October 31, 2026, subject to tax audit reports which must be submitted by September 30, 2026. Shall we check your audit progress?' },
  { text: 'GST document checklist', reply: 'For standard GST reconciliations, we need: 1. Sales Register (GSTR-1 data), 2. Purchase Register (GSTR-2B details), 3. Electronic Cash/Credit ledger statements. You can upload these in the Updates section.' },
  { text: 'TDS rate mismatch issue', reply: 'TDS mismatch warnings usually occur when tax deducted by clients (reported in Form 26AS) differs from your internal receipts registry. I can generate a comparison sheet for you if you provide your TRACES login.' },
];

export default function Chat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (text) => {
    if (!text.trim()) return;

    // 1. Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    // 2. Trigger typing simulation
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);

      // Determine reply based on query matching or fallback
      let agentReply = "I've noted your question. Let me fetch your compliance logs so we can review the exact invoices. I will update you here shortly.";

      const textLower = text.toLowerCase();
      if (textLower.includes('itr') || textLower.includes('deadline')) {
        agentReply = "Corporate ITR filings (ITR-6) are due on Oct 31, 2026. We need to submit the CA Audit Report (Form 3CB) by Sept 30. Your audit is currently in progress.";
      } else if (textLower.includes('gst') || textLower.includes('reconciliation') || textLower.includes('gstr')) {
        agentReply = "Understood. The GSTR-1 for Global Firm 5 was successfully submitted. I suggest checking the purchases under GSTR-2B to offset current SGST/CGST liabilities.";
      } else if (textLower.includes('tds') || textLower.includes('mismatch') || textLower.includes('194j')) {
        agentReply = "Section 194J discrepancies require filing a revised TDS return. I've flagged this with Ritika from our audit execution team to reconcile the tax credit certificates.";
      }

      const agentMsg = {
        id: Date.now() + 1,
        sender: 'agent',
        text: agentReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);
    }, 1800);
  };

  const handleQuickQuestionClick = (q) => {
    // Add user message immediately
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: q.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Sim typing response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const agentMsg = {
        id: Date.now() + 1,
        sender: 'agent',
        text: q.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, agentMsg]);
    }, 1200);
  };

  return (
    <ManagementHub
      eyebrow="Consultation Portal"
      title="Consultant Advisory Chat"
      description="Direct secure communication channel with your assigned senior tax consultants and compliance managers."
      accent="blue"
    >
      <div className="flex flex-col lg:flex-row gap-6 mt-4 min-h-[calc(100vh-280px)]">

        {/* Left Side: Advisor Profile Info */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          {/* Main Card */}
          <div className="bg-white dark:bg-gray-800 rounded-md border border-slate-200 dark:border-gray-700 p-5 shadow-sm">
            <div className="text-center pb-4 border-b border-slate-100 dark:border-gray-700">
              <div className="relative w-20 h-20 mx-auto mb-3 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-blue-500/20">
                SK
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white dark:border-gray-800 rounded-full" />
              </div>
              <h3 className="font-extrabold text-slate-800 dark:text-white">CA Suresh Kumar</h3>
              <p className="text-xs text-slate-400 dark:text-gray-400 mt-0.5">Senior Tax Advisor & Auditor</p>
            </div>

            {/* Certifications and details */}
            <div className="py-4 space-y-3.5 text-xs text-slate-600 dark:text-gray-300">
              <div className="flex items-center gap-3">
                <Award size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>ICAI Certified Chartered Accountant (15+ Years)</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Specialized: Corporate Taxation & Audits</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Typical Response: <span className="font-bold text-emerald-600 dark:text-emerald-400">Under 10 Mins</span></span>
              </div>
            </div>

            {/* Expertise Tags */}
            <div className="pt-4 border-t border-slate-100 dark:border-gray-700">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block mb-2">Expertise Fields</span>
              <div className="flex flex-wrap gap-1.5">
                {['Income Tax', 'GST Filings', 'Corporate Audits', 'Compliance'].map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-slate-50 dark:bg-gray-700 text-slate-600 dark:text-gray-300 text-[10px] font-semibold rounded-md border border-slate-100 dark:border-gray-600">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Secure disclaimer info */}
          <div className="bg-slate-50 dark:bg-gray-800/40 p-4 rounded-md border border-slate-100 dark:border-gray-800/50 flex gap-3 text-xs text-slate-500 dark:text-gray-400">
            <Zap size={20} className="text-blue-500 shrink-0" />
            <p className="leading-relaxed">All chats are secured using end-to-end TLS encryption. Advice is based on records uploaded in the Firms section.</p>
          </div>
        </div>

        {/* Right Side: Interactive Chat Panel */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-md border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-5 py-4 bg-gray-50/80 dark:bg-gray-850/60 border-b border-slate-150 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <MessageSquare size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-805 dark:text-white">Assigned Consult Workspace</h4>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Suresh Kumar is online
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-150 dark:bg-gray-700 text-slate-500 dark:text-gray-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
              En-256 Bit
            </span>
          </div>

          {/* Message History Feed */}
          <div className="flex-1 p-5 overflow-y-auto max-h-[480px] custom-scrollbar bg-slate-50/20 dark:bg-gray-900/10 space-y-4">
            {messages.map((msg) => {
              const isAgent = msg.sender === 'agent';
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 max-w-[85%] ${isAgent ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  {/* Avatar wrapper */}
                  <div className={`w-8 h-8 rounded-md shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm ${isAgent ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                    {isAgent ? 'CA' : <User size={14} />}
                  </div>

                  {/* Message body */}
                  <div className="flex flex-col">
                    <div className={`p-3.5 rounded-md text-xs leading-relaxed ${isAgent
                      ? 'bg-white dark:bg-gray-750 text-slate-700 dark:text-gray-250 rounded-bl-none border border-slate-150 dark:border-gray-700/60 shadow-sm'
                      : 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-500/10'
                      }`}>
                      {msg.text}
                    </div>
                    <span className={`text-[9px] text-slate-400 dark:text-gray-500 mt-1 ${isAgent ? 'text-left' : 'text-right'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Agent Typing Indicator */}
            {isTyping && (
              <div className="flex items-end gap-2.5 max-w-[80%] mr-auto">
                <div className="w-8 h-8 rounded-md bg-indigo-600 shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  CA
                </div>
                <div className="p-3 bg-white dark:bg-gray-750 rounded-md rounded-bl-none border border-slate-150 dark:border-gray-700/60 shadow-sm flex items-center gap-1.5 py-4">
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion buttons */}
          <div className="px-5 py-2.5 bg-gray-50/50 dark:bg-gray-800/60 border-t border-slate-100 dark:border-gray-750">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1">
              <Bot size={12} className="text-indigo-500" />
              Quick Inquiries
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q.text}
                  type="button"
                  onClick={() => handleQuickQuestionClick(q)}
                  disabled={isTyping}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-gray-700 dark:hover:bg-gray-650 text-slate-650 dark:text-gray-200 border border-slate-200 dark:border-gray-600 rounded-md text-xs font-semibold shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {q.text}
                </button>
              ))}
            </div>
          </div>

          {/* Message input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
            className="p-4 border-t border-slate-150 dark:border-gray-700 flex gap-2 items-center bg-white dark:bg-gray-800"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask CA Suresh a question..."
              disabled={isTyping}
              className="flex-1 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-gray-200 text-xs sm:text-sm rounded-md px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="w-10 h-10 shrink-0 bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-200 dark:disabled:bg-gray-700 text-white rounded-md flex items-center justify-center transition-all shadow-md shadow-indigo-600/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </ManagementHub>
  );
}
