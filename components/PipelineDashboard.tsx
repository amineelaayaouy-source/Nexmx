import React from 'react';

// Original pipeline steps
const STEPS = [
  { id: 1, name: 'Product Input', status: 'active' },
  { id: 2, name: 'Product Extraction', status: 'pending' },
  { id: 3, name: 'Product Analysis', status: 'pending' },
  { id: 4, name: 'Product Score', status: 'pending' },
  { id: 5, name: 'Angle Generator', status: 'pending' },
  { id: 6, name: 'Angle Ranking', status: 'pending' },
  { id: 7, name: 'Creative Strategy', status: 'pending' },
  { id: 8, name: 'Image Generator', status: 'pending' },
  { id: 9, name: 'Product Page', status: 'pending' },
  { id: 10, name: 'Ads Copy', status: 'pending' },
  { id: 11, name: 'Video Generator', status: 'disabled' },
  { id: 12, name: 'Meta Ads Test', status: 'disabled' },
  { id: 13, name: 'Performance Data', status: 'disabled' },
  { id: 14, name: 'AI Optimization', status: 'disabled' },
  { id: 15, name: 'New Angles', status: 'disabled' },
];

export default function PipelineDashboard() {
  return (
    <div className="w-full overflow-x-auto py-6 mb-4">
      <div className="min-w-max flex items-center justify-between px-4">
        {STEPS.map((step, index) => {
          const isLast = index === STEPS.length - 1;
          
          let circleBg = 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500';
          let textColor = 'text-gray-400 dark:text-gray-500';
          let borderColor = 'border-transparent';

          if (step.status === 'active') {
            circleBg = 'bg-indigo-600 text-white';
            textColor = 'text-gray-900 dark:text-white font-medium';
          } else if (step.status === 'completed') {
            circleBg = 'bg-green-500 text-white';
            textColor = 'text-gray-900 dark:text-white font-medium';
          }
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${circleBg} ${step.status === 'active' ? 'ring-4 ring-indigo-100 dark:ring-indigo-900/50' : ''}`}>
                  {step.status === 'completed' ? '✓' : step.id}
                </div>
                <span className={`text-sm ${textColor}`}>
                  {step.name}
                </span>
              </div>
              
              {!isLast && (
                <div className="w-12 h-px bg-gray-300 dark:bg-gray-700 mx-3"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
