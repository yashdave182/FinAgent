import React from 'react';
import type { LoanRequestRow } from '../types';
import Badge from './Badge';
import { getStatusColor, getStatusLabel, formatDate } from '../lib/api';

interface DataTableProps {
  data: LoanRequestRow[];
  onRowClick?: (row: LoanRequestRow) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, onRowClick }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-8 text-center">
        <div className="text-gray-400 mb-2">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-banking">
          <thead>
            <tr>
              <th className="text-left">Customer Name</th>
              <th className="text-right">Loan Amount</th>
              <th className="text-center">Status</th>
              <th className="text-center">Application Date</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                      {row.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {row.customerName}
                      </p>
                      {row.emi && (
                        <p className="text-xs text-gray-500">
                          EMI: ₹{row.emi.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="text-right">
                  <p className="font-semibold text-gray-900">
                    ₹{row.loanAmount.toLocaleString('en-IN')}
                  </p>
                  {row.tenure && (
                    <p className="text-xs text-gray-500">
                      {row.tenure} months
                    </p>
                  )}
                </td>
                <td className="text-center">
                  <div className="flex justify-center">
                    <Badge
                      variant={
                        row.status === 'approved'
                          ? 'success'
                          : row.status === 'rejected'
                          ? 'danger'
                          : row.status === 'under-review'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {getStatusLabel(row.status)}
                    </Badge>
                  </div>
                </td>
                <td className="text-center text-gray-600">
                  {formatDate(row.applicationDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
