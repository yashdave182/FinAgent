import React from 'react';
import type { ChatMessage } from '../types';
import Badge from './Badge';
import Button from './Button';

interface ChatBubbleProps {
  message: ChatMessage;
  onQuickReply?: (value: string) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onQuickReply }) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-600 text-xs px-4 py-2 rounded-full">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-3 mb-4 chat-bubble-enter ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-success flex items-center justify-center text-white font-semibold text-sm">
            AI
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-primary-500 text-white rounded-tr-sm'
              : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm shadow-sm'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>

          {/* Loan Summary Card (special message type) */}
          {message.type === 'loan-summary' && message.meta && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
              {message.meta.loanAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Loan Amount:</span>
                  <span className="font-semibold">
                    ₹{message.meta.loanAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {message.meta.tenure && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tenure:</span>
                  <span className="font-semibold">{message.meta.tenure} months</span>
                </div>
              )}
              {message.meta.emi && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">EMI:</span>
                  <span className="font-semibold">
                    ₹{message.meta.emi.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {message.meta.eligibilityStatus && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="success" size="sm">
                    {message.meta.eligibilityStatus}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Reply Buttons */}
        {message.type === 'quick-reply' && message.meta?.buttons && (
          <div className="flex flex-wrap gap-2 mt-3">
            {message.meta.buttons.map((button) => (
              <button
                key={button.id}
                onClick={() => onQuickReply?.(button.value)}
                className="px-4 py-2 text-sm font-medium text-primary-600 bg-white border-2 border-primary-200 rounded-lg hover:bg-primary-50 hover:border-primary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                {button.label}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-gray-500 mt-1.5 px-1">
          {new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </span>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold text-sm">
            U
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
