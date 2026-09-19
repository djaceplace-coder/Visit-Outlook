import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, Paperclip, Filter, RotateCcw } from 'lucide-react';
import { FolderItem } from '../../types/mail';

export interface AdvancedSearchFilters {
  keyword: string;
  folder: string;
  from: string;
  to: string;
  subject: string;
  hasAttachment: boolean;
  isUnread: boolean;
  isFlagged: boolean;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
}

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderItem[];
  currentFolderId: string;
  initialFilters?: Partial<AdvancedSearchFilters>;
  onApplyFilters: (filters: AdvancedSearchFilters) => void;
  onResetFilters: () => void;
}

export function AdvancedSearchModal({
  isOpen,
  onClose,
  folders,
  currentFolderId,
  initialFilters,
  onApplyFilters,
  onResetFilters,
}: AdvancedSearchModalProps) {
  const [folder, setFolder] = useState(initialFilters?.folder || currentFolderId || 'all');
  const [from, setFrom] = useState(initialFilters?.from || '');
  const [to, setTo] = useState(initialFilters?.to || '');
  const [subject, setSubject] = useState(initialFilters?.subject || '');
  const [keyword, setKeyword] = useState(initialFilters?.keyword || '');
  const [hasAttachment, setHasAttachment] = useState(initialFilters?.hasAttachment || false);
  const [isUnread, setIsUnread] = useState(initialFilters?.isUnread || false);
  const [isFlagged, setIsFlagged] = useState(initialFilters?.isFlagged || false);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'year'>(
    initialFilters?.dateRange || 'all'
  );

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilters({
      folder,
      from,
      to,
      subject,
      keyword,
      hasAttachment,
      isUnread,
      isFlagged,
      dateRange,
    });
    onClose();
  };

  const handleReset = () => {
    setFolder('all');
    setFrom('');
    setTo('');
    setSubject('');
    setKeyword('');
    setHasAttachment(false);
    setIsUnread(false);
    setIsFlagged(false);
    setDateRange('all');
    onResetFilters();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white border border-gray-300 shadow-2xl rounded-none flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 bg-brand-cobalt text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={16} />
            <span className="font-semibold text-sm">Advanced Search Filters</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSearch} className="p-5 space-y-4 text-xs">
          {/* Scope: Folder dropdown */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Search In</label>
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full border border-gray-300 px-3 py-1.5 rounded-none bg-white text-gray-800 outline-none focus:border-brand-cobalt"
            >
              <option value="all">All Folders</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Keywords</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search across subject, preview, and body text"
              className="w-full border border-gray-300 px-3 py-1.5 rounded-none text-gray-800 outline-none focus:border-brand-cobalt"
            />
          </div>

          {/* From & To grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">From</label>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="Sender name or email"
                className="w-full border border-gray-300 px-3 py-1.5 rounded-none text-gray-800 outline-none focus:border-brand-cobalt"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">To</label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Recipient name or email"
                className="w-full border border-gray-300 px-3 py-1.5 rounded-none text-gray-800 outline-none focus:border-brand-cobalt"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Subject Contains</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Specific terms in subject line"
              className="w-full border border-gray-300 px-3 py-1.5 rounded-none text-gray-800 outline-none focus:border-brand-cobalt"
            />
          </div>

          {/* Date range */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Received Timeframe</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full border border-gray-300 px-3 py-1.5 rounded-none bg-white text-gray-800 outline-none focus:border-brand-cobalt"
            >
              <option value="all">Any time</option>
              <option value="today">Past 24 hours</option>
              <option value="week">Past 7 days</option>
              <option value="month">Past 30 days</option>
              <option value="year">Past 12 months</option>
            </select>
          </div>

          {/* Checkbox Options */}
          <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none text-gray-700">
              <input
                type="checkbox"
                checked={hasAttachment}
                onChange={(e) => setHasAttachment(e.target.checked)}
                className="rounded-none border-gray-300 text-brand-cobalt focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <Paperclip size={12} className="text-gray-500" />
                Has attachment
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-gray-700">
              <input
                type="checkbox"
                checked={isUnread}
                onChange={(e) => setIsUnread(e.target.checked)}
                className="rounded-none border-gray-300 text-brand-cobalt focus:ring-0"
              />
              <span>Unread only</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-gray-700">
              <input
                type="checkbox"
                checked={isFlagged}
                onChange={(e) => setIsFlagged(e.target.checked)}
                className="rounded-none border-gray-300 text-brand-cobalt focus:ring-0"
              />
              <span>Flagged only</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <RotateCcw size={13} />
              <span>Reset filters</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-brand-cobalt hover:bg-[#004578] text-white font-semibold transition-colors flex items-center gap-1.5"
              >
                <Search size={13} />
                <span>Search</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
