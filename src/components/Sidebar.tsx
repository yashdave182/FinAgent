import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import type { WorkflowStep, StepStatus } from '../types';

interface SidebarProps {
  steps: WorkflowStep[];
  currentStep?: string;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ steps, currentStep, className = '' }) => {
  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'active':
        return <Circle className="w-5 h-5 text-primary-500 fill-primary-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'skipped':
        return <Circle className="w-5 h-5 text-gray-300" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepStyles = (status: StepStatus, isActive: boolean) => {
    const baseStyles = 'relative flex items-start gap-3 p-4 rounded-lg transition-all';

    if (isActive) {
      return `${baseStyles} bg-primary-50 border-2 border-primary-200`;
    }

    switch (status) {
      case 'completed':
        return `${baseStyles} hover:bg-gray-50`;
      case 'active':
        return `${baseStyles} bg-primary-50`;
      case 'pending':
        return `${baseStyles} hover:bg-gray-50`;
      default:
        return `${baseStyles}`;
    }
  };

  const getTextStyles = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return 'text-gray-900';
      case 'active':
        return 'text-primary-700 font-semibold';
      case 'pending':
        return 'text-gray-500';
      case 'skipped':
        return 'text-gray-400';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <aside className={`bg-white border-r border-gray-200 ${className}`}>
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2 font-display">
          Application Steps
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Track your loan application progress
        </p>

        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={step.id}>
              <div
                className={getStepStyles(
                  step.status,
                  currentStep === step.id
                )}
              >
                {/* Step Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(step.status)}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-medium ${getTextStyles(step.status)}`}>
                      {step.label}
                    </h3>
                    {step.status === 'active' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                        In Progress
                      </span>
                    )}
                    {step.status === 'completed' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Done
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="ml-[30px] h-8 w-0.5 bg-gray-200" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="p-6 border-t border-gray-200">
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Need Help?
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            Our support team is available 24/7 to assist you
          </p>
          <button className="w-full px-4 py-2 bg-white text-primary-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors border border-primary-200">
            Contact Support
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
