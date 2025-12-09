import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, ArrowLeft, Mail, Printer, CheckCircle } from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import type { LoanApplication } from "../types";
import {
  getLoanApplication,
  downloadPDF,
  formatCurrency,
  formatDate,
} from "../lib/api";

const PdfPage: React.FC = () => {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const [loanData, setLoanData] = useState<LoanApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchLoanData = async () => {
      if (!loanId) return;

      setIsLoading(true);
      try {
        const response = await getLoanApplication(loanId);
        if (response.success && response.data) {
          setLoanData(response.data);
        }
      } catch (error) {
        console.error("Error fetching loan data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoanData();
  }, [loanId]);

  const handleDownloadPDF = async () => {
    if (!loanId) return;

    setIsDownloading(true);
    try {
      await downloadPDF(loanId);
      // Show success message
      alert("PDF download initiated successfully!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBackToChat = () => {
    navigate("/chat");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading sanction letter...</p>
        </div>
      </div>
    );
  }

  if (!loanData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md text-center" padding="lg">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Sanction Letter Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The requested sanction letter could not be found.
          </p>
          <Button variant="primary" onClick={handleBackToChat}>
            Back to Chat
          </Button>
        </Card>
      </div>
    );
  }

  const sanctionDate = loanData.sanctionDate
    ? new Date(loanData.sanctionDate)
    : new Date();
  const validTillDate = loanData.validTill
    ? new Date(loanData.validTill)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm print:hidden sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-display">
                Sanction Letter – Preview
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Loan Reference: <span className="font-semibold">{loanId}</span>
              </p>
            </div>
            <Button
              variant="ghost"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={handleBackToChat}
            >
              Back
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Alert */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3 print:hidden">
          <svg
            className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> In production, this will trigger server-side
            PDF generation with real customer data and digital signatures.
          </p>
        </div>

        {/* Success Banner */}
        <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl print:hidden">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Your Loan Has Been Sanctioned!
              </h2>
              <p className="text-gray-700">
                Please review the key details of your approved loan below. You
                can download the official document or have it sent to your
                registered email.
              </p>
            </div>
          </div>
        </div>

        {/* Sanction Letter Card */}
        <Card className="mb-8 print:shadow-none print:border-2">
          {/* Header with Logo/Icon */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-gradient-success flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 font-display">
                    Sanction Letter
                  </h3>
                  <p className="text-sm text-gray-500">FinAgent Platform</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Reference ID</p>
              <p className="text-sm font-semibold text-gray-900">
                {loanData.approvalId ||
                  `LN-APV-${loanId?.slice(-8).toUpperCase()}`}
              </p>
            </div>
          </div>

          {/* Intro Text */}
          <div className="mb-8">
            <p className="text-gray-700 leading-relaxed">
              Please review the key details of your approved loan below. You can
              download the official document or have it sent to your registered
              email.
            </p>
          </div>

          {/* Loan Details Grid */}
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Applicant Name</p>
                <p className="text-lg font-bold text-gray-900">
                  {loanData.customerName}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Email Address</p>
                <p className="text-base font-medium text-gray-900">
                  {loanData.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 bg-primary-50 border-2 border-primary-200 rounded-lg">
                <p className="text-sm text-primary-700 mb-1 font-medium">
                  Loan Amount Approved
                </p>
                <p className="text-3xl font-bold text-primary-900">
                  {formatCurrency(loanData.amount)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Loan Tenure</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loanData.tenure} Months
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Monthly EMI</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(loanData.emi)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Interest Rate</p>
                <p className="text-xl font-bold text-gray-900">
                  {loanData.interestRate}% p.a.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Processing Fee</p>
                <p className="text-xl font-bold text-gray-900">₹0</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Sanction Date</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatDate(sanctionDate.toISOString())}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Valid Till</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatDate(validTillDate.toISOString())}
                </p>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
              Terms & Conditions
            </h4>
            <div className="text-xs text-gray-700 space-y-2 leading-relaxed">
              <p>
                This is a mock-up of the letter's main body text using
                placeholder text to give an authentic document feel. The full
                terms and conditions, repayment schedule, and other important
                details are available in the complete PDF document.
              </p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. The
                loan is subject to the terms and conditions mentioned in the
                loan agreement. The borrower is required to repay the loan
                amount along with interest as per the agreed schedule.
              </p>
              <p>
                In case of default, the lender reserves the right to take
                appropriate legal action. All disputes are subject to the
                jurisdiction of courts in Mumbai, India. This sanction letter is
                valid for 30 days from the date of issue.
              </p>
            </div>
          </div>

          {/* System Generated Stamp */}
          <div className="pt-6 border-t border-gray-200 text-center">
            <div className="inline-block px-6 py-3 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                System Generated – No Signature Required
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This is a digitally generated document
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Important:</strong> This sanction letter is subject to
              verification of all documents and information provided. The loan
              will be disbursed only after successful completion of all
              formalities.
            </p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 print:hidden">
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Download className="w-5 h-5" />}
            onClick={handleDownloadPDF}
            isLoading={isDownloading}
            className="flex-1"
          >
            Download PDF
          </Button>

          <Button
            variant="outline"
            size="lg"
            leftIcon={<Mail className="w-5 h-5" />}
            className="flex-1"
          >
            Send to Email
          </Button>

          <Button
            variant="outline"
            size="lg"
            leftIcon={<Printer className="w-5 h-5" />}
            onClick={handlePrint}
            className="flex-1"
          >
            Print
          </Button>
        </div>

        {/* Back to Chat Button */}
        <div className="text-center print:hidden">
          <Button
            variant="ghost"
            size="lg"
            leftIcon={<ArrowLeft className="w-5 h-5" />}
            onClick={handleBackToChat}
          >
            Back to Chat
          </Button>
        </div>

        {/* Demo Notice */}
        <div className="mt-8 text-center print:hidden">
          <p className="text-sm text-gray-500">
            This is a system-generated letter and is valid for demonstration
            purposes only.
          </p>
        </div>
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-2 {
            border-width: 2px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PdfPage;
