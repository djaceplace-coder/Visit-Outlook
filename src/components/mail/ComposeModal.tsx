import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Trash2,
  Paperclip,
  AlertCircle,
  Clock,
  Shield,
  Maximize2,
  Minimize2,
  Minus,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Smile,
  FileText,
  FileSpreadsheet,
  FileImage,
  ChevronDown,
  Check,
  Sparkles
} from 'lucide-react';
import { EmailMessage, EmailAttachment } from '../../types/mail';

interface ContactSuggestion {
  name: string;
  email: string;
}

const SUGGESTED_CONTACTS: ContactSuggestion[] = [
  { name: 'Sarah Jenkins', email: 's.jenkins@meridian.io' },
  { name: 'Marcus Chen', email: 'm.chen@meridian.io' },
  { name: 'Elena Rostova', email: 'elena.r@designcraft.co' },
  { name: 'David Kim', email: 'david.kim@vanguard.tech' },
  { name: 'Priya Patel', email: 'priya.p@apexglobal.com' },
  { name: 'Jordan Hayes', email: 'j.hayes@meridian.io' },
  { name: 'Dev Team', email: 'dev-team@meridian.io' }
];

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (messageData: {
    to: Array<{ name: string; email: string }>;
    cc: Array<{ name: string; email: string }>;
    bcc: Array<{ name: string; email: string }>;
    subject: string;
    body: string;
    importance: 'normal' | 'high' | 'low';
    attachments: EmailAttachment[];
  }) => void;
  onSaveDraft?: (draftData: Partial<EmailMessage>) => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
}

export function ComposeModal({
  isOpen,
  onClose,
  onSend,
  onSaveDraft,
  initialTo = '',
  initialSubject = '',
  initialBody = ''
}: ComposeModalProps) {
  // Recipients state
  const [toChips, setToChips] = useState<ContactSuggestion[]>([]);
  const [toInput, setToInput] = useState('');
  const [ccChips, setCcChips] = useState<ContactSuggestion[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [bccChips, setBccChips] = useState<ContactSuggestion[]>([]);
  const [bccInput, setBccInput] = useState('');

  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  // Subject and Body
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);

  // Options
  const [importance, setImportance] = useState<'normal' | 'high' | 'low'>('normal');
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [draftStatus, setDraftStatus] = useState<'saved' | 'saving' | ''>('');

  // Suggestions state
  const [activeInputType, setActiveInputType] = useState<'to' | 'cc' | 'bcc' | null>(null);
  const [suggestions, setSuggestions] = useState<ContactSuggestion[]>([]);

  // Send later dropdown
  const [showSendOptions, setShowSendOptions] = useState(false);

  // Formatting state
  const [fontFamily, setFontFamily] = useState('Segoe UI');
  const [fontSize, setFontSize] = useState('14px');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTo) {
        // Parse initialTo (could be comma separated or single)
        const items = initialTo.split(',').map((t) => t.trim()).filter(Boolean);
        const chips: ContactSuggestion[] = items.map((item) => {
          const matched = SUGGESTED_CONTACTS.find(
            (c) => c.email.toLowerCase() === item.toLowerCase()
          );
          if (matched) return matched;
          return { name: item.split('@')[0], email: item };
        });
        setToChips(chips);
      } else {
        setToChips([]);
      }
      setSubject(initialSubject || '');
      setBody(initialBody || '');
      setDraftStatus('saved');
    }
  }, [isOpen, initialTo, initialSubject, initialBody]);

  // Auto-save draft timer
  useEffect(() => {
    if (!isOpen) return;
    setDraftStatus('saving');
    const timer = setTimeout(() => {
      setDraftStatus('saved');
      onSaveDraft?.({
        subject: subject || 'Draft: (No subject)',
        body,
        to: toChips
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [subject, body, toChips, ccChips, bccChips, isOpen]);

  // Escape key handler
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

  // Filter contact suggestions based on user input
  const handleInputChange = (
    val: string,
    type: 'to' | 'cc' | 'bcc'
  ) => {
    if (type === 'to') setToInput(val);
    if (type === 'cc') setCcInput(val);
    if (type === 'bcc') setBccInput(val);

    setActiveInputType(type);

    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    const filtered = SUGGESTED_CONTACTS.filter(
      (c) =>
        c.name.toLowerCase().includes(val.toLowerCase()) ||
        c.email.toLowerCase().includes(val.toLowerCase())
    );
    setSuggestions(filtered);
  };

  const addChip = (contact: ContactSuggestion, type: 'to' | 'cc' | 'bcc') => {
    if (type === 'to') {
      if (!toChips.some((c) => c.email === contact.email)) {
        setToChips([...toChips, contact]);
      }
      setToInput('');
    } else if (type === 'cc') {
      if (!ccChips.some((c) => c.email === contact.email)) {
        setCcChips([...ccChips, contact]);
      }
      setCcInput('');
    } else if (type === 'bcc') {
      if (!bccChips.some((c) => c.email === contact.email)) {
        setBccChips([...bccChips, contact]);
      }
      setBccInput('');
    }
    setSuggestions([]);
    setActiveInputType(null);
  };

  const removeChip = (email: string, type: 'to' | 'cc' | 'bcc') => {
    if (type === 'to') setToChips(toChips.filter((c) => c.email !== email));
    if (type === 'cc') setCcChips(ccChips.filter((c) => c.email !== email));
    if (type === 'bcc') setBccChips(bccChips.filter((c) => c.email !== email));
  };

  const handleKeyDownInput = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: 'to' | 'cc' | 'bcc'
  ) => {
    const val = type === 'to' ? toInput : type === 'cc' ? ccInput : bccInput;
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (val.trim()) {
        const email = val.replace(',', '').trim();
        const contact: ContactSuggestion = {
          name: email.split('@')[0],
          email
        };
        addChip(contact, type);
      }
    } else if (e.key === 'Backspace' && !val) {
      // Remove last chip
      if (type === 'to' && toChips.length > 0) {
        removeChip(toChips[toChips.length - 1].email, 'to');
      } else if (type === 'cc' && ccChips.length > 0) {
        removeChip(ccChips[ccChips.length - 1].email, 'cc');
      } else if (type === 'bcc' && bccChips.length > 0) {
        removeChip(bccChips[bccChips.length - 1].email, 'bcc');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesList = Array.from(e.target.files) as File[];
    const newFiles: EmailAttachment[] = filesList.map((f: File, i: number) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      let type: 'pdf' | 'sheet' | 'doc' | 'img' = 'doc';
      if (ext === 'pdf') type = 'pdf';
      else if (['xlsx', 'xls', 'csv'].includes(ext || '')) type = 'sheet';
      else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) type = 'img';

      return {
        id: `att-upload-${Date.now()}-${i}`,
        name: f.name,
        size: `${Math.round(f.size / 1024)} KB`,
        type
      };
    });
    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const handleSend = () => {
    // If user typed an email in 'to' without pressing Enter
    let finalTo = [...toChips];
    if (toInput.trim()) {
      finalTo.push({ name: toInput.trim(), email: toInput.trim() });
    }

    if (finalTo.length === 0) {
      alert('Please specify at least one recipient.');
      return;
    }

    onSend({
      to: finalTo,
      cc: ccChips,
      bcc: bccChips,
      subject: subject.trim() || '(No subject)',
      body,
      importance,
      attachments
    });

    onClose();
  };

  if (!isOpen) return null;

  // Minimized dock in bottom right corner (classic Outlook Web behavior)
  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-8 z-50 w-72 bg-brand-cobalt text-white shadow-2xl border-t border-x border-white/20 flex items-center justify-between px-4 py-2.5 cursor-pointer">
        <div
          className="truncate font-semibold text-xs flex-1 mr-2"
          onClick={() => setIsMinimized(false)}
        >
          {subject || 'New message'}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="p-1 hover:bg-white/20"
            title="Restore window"
          >
            <Maximize2 size={13} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/20"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className={`bg-white border border-gray-300 shadow-2xl flex flex-col overflow-hidden transition-all ${
          isMaximized
            ? 'w-full h-full'
            : 'w-full max-w-3xl max-h-[90vh] h-[700px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Top Bar */}
        <div className="px-4 py-2.5 bg-brand-cobalt text-white flex items-center justify-between flex-shrink-0 select-none">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-xs truncate">
              {subject || 'New message'}
            </span>
            {draftStatus && (
              <span className="text-[10px] text-blue-100 bg-white/10 px-2 py-0.5">
                {draftStatus === 'saving' ? 'Saving draft...' : 'Draft saved'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 hover:bg-white/20 text-white/90 hover:text-white"
              title="Minimize"
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className="p-1.5 hover:bg-white/20 text-white/90 hover:text-white"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 text-white/90 hover:text-white"
              title="Discard / Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* 2. Top Action Ribbon */}
        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {/* Split Send Button */}
            <div className="inline-flex shadow-2xs relative">
              <button
                type="button"
                onClick={handleSend}
                className="px-4 py-1.5 bg-brand-cobalt hover:bg-[#004578] text-white font-semibold flex items-center gap-1.5 rounded-none"
              >
                <Send size={13} />
                <span>Send</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSendOptions((prev) => !prev)}
                className="px-1.5 py-1.5 bg-brand-cobalt hover:bg-[#004578] text-white border-l border-white/20 rounded-none"
                title="Send later options"
              >
                <ChevronDown size={13} />
              </button>

              {showSendOptions && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-20 py-1 w-44 text-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSendOptions(false);
                      alert('Scheduled to send tomorrow at 8:00 AM');
                      handleSend();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-xs"
                  >
                    <Clock size={13} className="text-gray-500" />
                    <span>Send tomorrow (8 AM)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSendOptions(false);
                      alert('Scheduled to send Monday at 9:00 AM');
                      handleSend();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-xs"
                  >
                    <Clock size={13} className="text-gray-500" />
                    <span>Send next week (Mon 9 AM)</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-gray-700 hover:bg-gray-200/70 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={13} />
              <span>Discard</span>
            </button>

            <div className="w-px h-4 bg-gray-200 mx-1" />

            {/* Attach button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 text-gray-700 hover:bg-gray-200/70 flex items-center gap-1.5 transition-colors"
              title="Attach files from computer"
            >
              <Paperclip size={13} />
              <span>Attach</span>
            </button>

            {/* Importance toggle */}
            <button
              type="button"
              onClick={() =>
                setImportance((prev) => (prev === 'high' ? 'normal' : 'high'))
              }
              className={`px-2.5 py-1.5 flex items-center gap-1 transition-colors ${
                importance === 'high'
                  ? 'bg-red-50 text-red-700 border border-red-200 font-semibold'
                  : 'text-gray-700 hover:bg-gray-200/70'
              }`}
              title="Set high importance"
            >
              <AlertCircle size={13} />
              <span>High Importance</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-gray-500 text-[11px]">
            <Shield size={13} className="text-emerald-600" />
            <span>Encrypted connection</span>
          </div>
        </div>

        {/* 3. Underlined Recipient & Subject Fields */}
        <div className="p-4 space-y-2 bg-white flex-shrink-0 border-b border-gray-100">
          {/* TO Field */}
          <div className="relative flex items-center border-b border-gray-200 py-1 gap-2 flex-wrap min-h-[36px]">
            <button
              type="button"
              className="font-semibold text-xs text-brand-cobalt hover:underline w-10 text-left flex-shrink-0"
              onClick={() => {
                // Focus input
              }}
            >
              To
            </button>

            {/* To Chips */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {toChips.map((chip) => (
                <span
                  key={chip.email}
                  className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 text-xs px-2 py-0.5 text-gray-800"
                >
                  <span className="font-medium">{chip.name}</span>
                  <button
                    type="button"
                    onClick={() => removeChip(chip.email, 'to')}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={toInput}
                onChange={(e) => handleInputChange(e.target.value, 'to')}
                onKeyDown={(e) => handleKeyDownInput(e, 'to')}
                placeholder={toChips.length === 0 ? 'Type name or email address...' : ''}
                className="flex-1 min-w-[140px] text-xs outline-none text-gray-800 py-1"
              />
            </div>

            {/* Cc / Bcc buttons */}
            <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
              {!showCc && (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="hover:text-brand-cobalt"
                >
                  Cc
                </button>
              )}
              {!showBcc && (
                <button
                  type="button"
                  onClick={() => setShowBcc(true)}
                  className="hover:text-brand-cobalt"
                >
                  Bcc
                </button>
              )}
            </div>

            {/* Auto-suggest dropdown */}
            {activeInputType === 'to' && suggestions.length > 0 && (
              <div className="absolute left-10 top-full mt-1 w-72 bg-white border border-gray-300 shadow-lg z-30 divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {suggestions.map((c) => (
                  <button
                    key={c.email}
                    type="button"
                    onClick={() => addChip(c, 'to')}
                    className="w-full text-left px-3 py-2 hover:bg-brand-ice flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-gray-800">{c.name}</div>
                      <div className="text-[11px] text-gray-500">{c.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CC Field */}
          {showCc && (
            <div className="relative flex items-center border-b border-gray-200 py-1 gap-2 flex-wrap min-h-[36px]">
              <span className="font-semibold text-xs text-gray-500 w-10 text-left flex-shrink-0">
                Cc
              </span>
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                {ccChips.map((chip) => (
                  <span
                    key={chip.email}
                    className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 text-xs px-2 py-0.5 text-gray-800"
                  >
                    <span className="font-medium">{chip.name}</span>
                    <button
                      type="button"
                      onClick={() => removeChip(chip.email, 'cc')}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={ccInput}
                  onChange={(e) => handleInputChange(e.target.value, 'cc')}
                  onKeyDown={(e) => handleKeyDownInput(e, 'cc')}
                  placeholder={ccChips.length === 0 ? 'Add Cc recipients...' : ''}
                  className="flex-1 min-w-[140px] text-xs outline-none text-gray-800 py-1"
                />
              </div>

              {activeInputType === 'cc' && suggestions.length > 0 && (
                <div className="absolute left-10 top-full mt-1 w-72 bg-white border border-gray-300 shadow-lg z-30 divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {suggestions.map((c) => (
                    <button
                      key={c.email}
                      type="button"
                      onClick={() => addChip(c, 'cc')}
                      className="w-full text-left px-3 py-2 hover:bg-brand-ice flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-gray-800">{c.name}</div>
                        <div className="text-[11px] text-gray-500">{c.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BCC Field */}
          {showBcc && (
            <div className="relative flex items-center border-b border-gray-200 py-1 gap-2 flex-wrap min-h-[36px]">
              <span className="font-semibold text-xs text-gray-500 w-10 text-left flex-shrink-0">
                Bcc
              </span>
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                {bccChips.map((chip) => (
                  <span
                    key={chip.email}
                    className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 text-xs px-2 py-0.5 text-gray-800"
                  >
                    <span className="font-medium">{chip.name}</span>
                    <button
                      type="button"
                      onClick={() => removeChip(chip.email, 'bcc')}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={bccInput}
                  onChange={(e) => handleInputChange(e.target.value, 'bcc')}
                  onKeyDown={(e) => handleKeyDownInput(e, 'bcc')}
                  placeholder={bccChips.length === 0 ? 'Add Bcc recipients...' : ''}
                  className="flex-1 min-w-[140px] text-xs outline-none text-gray-800 py-1"
                />
              </div>

              {activeInputType === 'bcc' && suggestions.length > 0 && (
                <div className="absolute left-10 top-full mt-1 w-72 bg-white border border-gray-300 shadow-lg z-30 divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {suggestions.map((c) => (
                    <button
                      key={c.email}
                      type="button"
                      onClick={() => addChip(c, 'bcc')}
                      className="w-full text-left px-3 py-2 hover:bg-brand-ice flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-gray-800">{c.name}</div>
                        <div className="text-[11px] text-gray-500">{c.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subject Field */}
          <div className="border-b border-gray-200 py-1">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Add a subject"
              className="w-full text-sm font-semibold outline-none text-[#1F2937] placeholder-gray-400 py-1"
            />
          </div>
        </div>

        {/* 4. Attachments Chips List if any attached */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mr-1">
              Attached ({attachments.length}):
            </span>
            {attachments.map((att) => (
              <div
                key={att.id}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 px-2.5 py-1 text-xs text-gray-700 shadow-2xs"
              >
                {att.type === 'pdf' && <FileText size={13} className="text-red-600" />}
                {att.type === 'sheet' && (
                  <FileSpreadsheet size={13} className="text-emerald-600" />
                )}
                {att.type === 'img' && <FileImage size={13} className="text-blue-600" />}
                <span className="font-medium max-w-[120px] truncate">{att.name}</span>
                <span className="text-[10px] text-gray-400">({att.size})</span>
                <button
                  type="button"
                  onClick={() =>
                    setAttachments(attachments.filter((a) => a.id !== att.id))
                  }
                  className="text-gray-400 hover:text-red-600 ml-1"
                  title="Remove attachment"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 5. Rich Text Formatting Toolbar */}
        <div className="px-4 py-1.5 bg-white border-b border-gray-200 flex items-center gap-1 text-gray-700 text-xs flex-wrap flex-shrink-0">
          {/* Font selector */}
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="px-2 py-1 bg-white border border-gray-200 text-xs outline-none rounded-none"
          >
            <option value="Segoe UI">Segoe UI</option>
            <option value="Aptos">Aptos</option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier New</option>
          </select>

          {/* Font size */}
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="px-2 py-1 bg-white border border-gray-200 text-xs outline-none rounded-none w-16"
          >
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="20px">20</option>
          </select>

          <div className="w-px h-4 bg-gray-200 mx-1" />

          {/* Formatting buttons */}
          <button
            type="button"
            onClick={() => setIsBold((prev) => !prev)}
            className={`p-1.5 hover:bg-gray-100 rounded-none transition-colors ${
              isBold ? 'bg-gray-200 text-brand-cobalt font-bold' : ''
            }`}
            title="Bold"
          >
            <Bold size={13} />
          </button>
          <button
            type="button"
            onClick={() => setIsItalic((prev) => !prev)}
            className={`p-1.5 hover:bg-gray-100 rounded-none transition-colors ${
              isItalic ? 'bg-gray-200 text-brand-cobalt' : ''
            }`}
            title="Italic"
          >
            <Italic size={13} />
          </button>
          <button
            type="button"
            onClick={() => setIsUnderline((prev) => !prev)}
            className={`p-1.5 hover:bg-gray-100 rounded-none transition-colors ${
              isUnderline ? 'bg-gray-200 text-brand-cobalt' : ''
            }`}
            title="Underline"
          >
            <Underline size={13} />
          </button>

          <div className="w-px h-4 bg-gray-200 mx-1" />

          {/* Alignment */}
          <button
            type="button"
            onClick={() => setTextAlign('left')}
            className={`p-1.5 hover:bg-gray-100 ${textAlign === 'left' ? 'bg-gray-200 text-brand-cobalt' : ''}`}
            title="Align left"
          >
            <AlignLeft size={13} />
          </button>
          <button
            type="button"
            onClick={() => setTextAlign('center')}
            className={`p-1.5 hover:bg-gray-100 ${textAlign === 'center' ? 'bg-gray-200 text-brand-cobalt' : ''}`}
            title="Align center"
          >
            <AlignCenter size={13} />
          </button>
          <button
            type="button"
            onClick={() => setTextAlign('right')}
            className={`p-1.5 hover:bg-gray-100 ${textAlign === 'right' ? 'bg-gray-200 text-brand-cobalt' : ''}`}
            title="Align right"
          >
            <AlignRight size={13} />
          </button>

          <div className="w-px h-4 bg-gray-200 mx-1" />

          {/* Lists */}
          <button
            type="button"
            className="p-1.5 hover:bg-gray-100"
            title="Bulleted list"
            onClick={() => setBody((prev) => prev + '\n• ')}
          >
            <List size={13} />
          </button>
          <button
            type="button"
            className="p-1.5 hover:bg-gray-100"
            title="Numbered list"
            onClick={() => setBody((prev) => prev + '\n1. ')}
          >
            <ListOrdered size={13} />
          </button>
          <button
            type="button"
            className="p-1.5 hover:bg-gray-100"
            title="Insert link"
            onClick={() => {
              const url = prompt('Enter URL:');
              if (url) setBody((prev) => `${prev} [${url}](${url})`);
            }}
          >
            <Link2 size={13} />
          </button>
        </div>

        {/* 6. Message Body Area */}
        <div className="flex-1 p-4 bg-white flex flex-col overflow-hidden">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your email here..."
            style={{
              fontFamily,
              fontSize,
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              textDecoration: isUnderline ? 'underline' : 'none',
              textAlign
            }}
            className="flex-1 w-full outline-none text-[#374151] placeholder-gray-400 resize-none leading-relaxed"
          />
        </div>

        {/* 7. Bottom Status & Discard Bar */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 select-none">
          <div className="flex items-center gap-3">
            <span>Encoding: UTF-8</span>
            <span className="text-gray-300">•</span>
            <span>Outlook Mail for Web</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="px-5 py-1.5 bg-brand-cobalt hover:bg-[#004578] text-white font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Send size={12} />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
