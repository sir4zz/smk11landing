import React from 'react';
import { X, Search } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#FAF6F0] w-full max-w-2xl rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-[#1B2A4A] text-white">
          <h2 className="text-lg font-semibold">Pencarian</h2>
          <button onClick={onClose} className="hover:text-[#C8A951] transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Cari informasi..." 
              className="w-full pl-10 pr-4 py-3 rounded border border-gray-300 focus:outline-none focus:border-[#C8A951] focus:ring-1 focus:ring-[#C8A951]"
              autoFocus
            />
            <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={onClose}
              className="bg-[#1B2A4A] text-white px-6 py-2 rounded hover:bg-opacity-90 transition-colors cursor-pointer"
            >
              Cari
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
