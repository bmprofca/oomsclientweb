import React from 'react';
import { Share2 } from 'lucide-react';

export default function SharableDocs() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-10 text-center flex flex-col items-center">
      <Share2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
      <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Sharable Documents</h3>
      <p className="text-slate-500 dark:text-slate-400">
        This section is coming soon. Here you will be able to manage documents that can be shared externally.
      </p>
    </div>
  );
}
