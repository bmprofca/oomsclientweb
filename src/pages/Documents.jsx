import React, { useState } from 'react';
import ManagementHub from '../components/common/ManagementHub';
import OutputDocs from '../components/documents/OutputDocs';
import SharableDocs from '../components/documents/SharableDocs';

export default function Documents() {
  const [activeTab, setActiveTab] = useState('output');

  return (
    <ManagementHub
      title="Documents Management"
      description="View, manage, and share documents across all firms and services."
      accent="indigo"
      onRefresh={null}
      actions={null}
      summary={null}
    >
      <div className="mt-4">
        {/* Tabs Navigation */}
        <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            onClick={() => setActiveTab('output')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'output'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Output Docs
          </button>
          <button
            onClick={() => setActiveTab('sharable')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sharable'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Sharable Docs
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'output' && <OutputDocs />}
          {activeTab === 'sharable' && <SharableDocs />}
        </div>
      </div>
    </ManagementHub>
  );
}
