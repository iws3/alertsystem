// components/GeminiResponseModal.tsx
import React from 'react';
import { X, Lightbulb } from 'lucide-react';

interface GeminiResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  content: string | null;
  isLoading: boolean;
}

const GeminiResponseModal: React.FC<GeminiResponseModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  content, 
  isLoading 
}) => {
  if (!isOpen) return null;

  // Basic markdown-to-HTML conversion (very simplified)
  const formatContent = (text: string | null): string => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>')     // Italics
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-2 rounded text-sm overflow-x-auto"><code>$1</code></pre>') // Code blocks
      .replace(/`([^`]+)`/g, '<code class="bg-gray-200 px-1 rounded text-sm">$1</code>') // Inline code
      .replace(/^- (.*)/gm, '<li class="ml-4 list-disc">$1</li>') // List items (very basic)
      .replace(/\n/g, '<br />'); // Newlines
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <Lightbulb size={24} className="mr-2 text-yellow-500" />
            {title || "Gemini AI Insights"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-3 text-gray-600">Thinking...</p>
            </div>
          ) : (
             <div className="prose max-w-none text-gray-900" dangerouslySetInnerHTML={{ __html: formatContent(content) }} />
          )}
        </div>
        <div className="p-4 border-t text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiResponseModal;