import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Upload } from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import OutputDocs from '../components/documents/OutputDocs';
import SharableDocs from '../components/documents/SharableDocs';

export default function Documents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'output';
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [uploadTrigger, setUploadTrigger] = useState(0);

  const handleTabChange = (tab) => {
    setSearchParams(prev => {
      prev.set('tab', tab);
      return prev;
    });
  };

  return (
    <ManagementHub
      title="Documents Management"
      description="View, manage, and share documents across all firms and services."
      accent="indigo"
      onRefresh={() => setRefreshTrigger(prev => prev + 1)}
      actions={
        activeTab === 'sharable' ? (
          <button
            onClick={() => setUploadTrigger(prev => prev + 1)}
            className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-semibold transition-colors shrink-0"
          >
            <Upload size={14} />
            Upload
          </button>
        ) : null
      }
      summary={null}
    >
      <div className="mt-4">
        {/* Tabs Navigation */}
        <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            onClick={() => handleTabChange('output')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'output'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Output Docs
          </button>
          <button
            onClick={() => handleTabChange('sharable')}
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
          {activeTab === 'output' && <OutputDocs refreshTrigger={refreshTrigger} />}
          {activeTab === 'sharable' && <SharableDocs refreshTrigger={refreshTrigger} uploadTrigger={uploadTrigger} />}
        </div>
      </div>
    </ManagementHub>
  );
}
