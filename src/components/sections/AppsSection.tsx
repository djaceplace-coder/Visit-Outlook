import { useState } from 'react';
import {
  FileText,
  Folder,
  LayoutGrid,
  Download,
  Eye,
  FileSpreadsheet,
  Presentation,
  CheckCircle,
  HardDrive,
  Clock,
  Search,
  ExternalLink,
  Plus,
  X
} from 'lucide-react';

interface RecentDoc {
  id: string;
  name: string;
  type: 'word' | 'excel' | 'powerpoint' | 'onenote' | 'pdf';
  modified: string;
  size: string;
  sharedWith: string;
  content: string;
}

const RECENT_DOCS: RecentDoc[] = [
  {
    id: 'doc1',
    name: 'Q4_Cloud_Migration_Spec.docx',
    type: 'word',
    modified: '2 hours ago',
    size: '142 KB',
    sharedWith: 'Architecture Team',
    content: 'Microsoft Word Document\nTitle: Q4 Cloud Migration Specification\nAuthors: Alex Bennett, David Chen\nStatus: Final Review\n\nExecutive Summary:\nThis document specifies the migration plan to containerized cloud runtimes with zero-downtime cutover.'
  },
  {
    id: 'doc2',
    name: 'FY27_Product_Roadmap_Budget.xlsx',
    type: 'excel',
    modified: 'Yesterday, 4:15 PM',
    size: '1.2 MB',
    sharedWith: 'Finance & Leadership',
    content: 'Microsoft Excel Spreadsheet\nSheet: Budget Summary\n\nQ1 Allocation: $450,000\nQ2 Allocation: $520,000\nQ3 Allocation: $610,000\nQ4 Allocation: $700,000\nTotal CapEx: $2,280,000'
  },
  {
    id: 'doc3',
    name: 'Outlook_Fluent_Redesign_Deck.pptx',
    type: 'powerpoint',
    modified: 'Sep 14, 2026',
    size: '8.4 MB',
    sharedWith: 'Design Council',
    content: 'Microsoft PowerPoint Presentation\nDeck: Modern Outlook Web Experience\nSlide 1: Vision & Typography Hierarchy\nSlide 2: Density Modes & Accessibility\nSlide 3: Universal Keyboard Accelerators'
  },
  {
    id: 'doc4',
    name: 'Engineering_AllHands_Notes.one',
    type: 'onenote',
    modified: 'Sep 12, 2026',
    size: '68 KB',
    sharedWith: 'Only you',
    content: 'OneNote Notebook: Engineering Sync\n- Discussed React 18 concurrent features\n- Vite build optimization completed\n- Toast feedback verified across all modules'
  },
  {
    id: 'doc5',
    name: 'Vendor_Master_Service_Agreement.pdf',
    type: 'pdf',
    modified: 'Sep 10, 2026',
    size: '340 KB',
    sharedWith: 'Legal & Procurement',
    content: 'PDF Contract: Master Service Agreement (MSA)\nTerm: 24 Months\nGoverning Law: Washington State\nSignatures: Executed via DocuSign'
  }
];

export interface AppsSectionProps {
  searchQuery?: string;
}

export function AppsSection({ searchQuery: globalSearchQuery = '' }: AppsSectionProps = {}) {
  const [docs, setDocs] = useState<RecentDoc[]>(RECENT_DOCS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<RecentDoc | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const apps = [
    { id: 'word', label: 'Word', desc: 'Documents and formatting', iconLetter: 'W', color: 'bg-[#185ABD]', ext: '.docx' },
    { id: 'excel', label: 'Excel', desc: 'Spreadsheets and data analysis', iconLetter: 'X', color: 'bg-[#107C41]', ext: '.xlsx' },
    { id: 'powerpoint', label: 'PowerPoint', desc: 'Presentations and slide decks', iconLetter: 'P', color: 'bg-[#C43E1C]', ext: '.pptx' },
    { id: 'onenote', label: 'OneNote', desc: 'Digital notebooks and notes', iconLetter: 'N', color: 'bg-[#7719AA]', ext: '.one' },
    { id: 'onedrive', label: 'OneDrive', desc: 'Cloud file sync and storage', iconLetter: 'D', color: 'bg-[#0078D4]', ext: '' },
    { id: 'teams', label: 'Teams', desc: 'Channels and collaboration', iconLetter: 'T', color: 'bg-[#464EB8]', ext: '' },
    { id: 'forms', label: 'Forms', desc: 'Surveys, polls, and quizzes', iconLetter: 'F', color: 'bg-[#008272]', ext: '' },
    { id: 'lists', label: 'Lists', desc: 'Work tracking and inventories', iconLetter: 'L', color: 'bg-[#91167B]', ext: '' }
  ];

  const filteredDocs = docs.filter(d => {
    if (selectedType !== 'all' && d.type !== selectedType) return false;
    const activeSearch = (globalSearchQuery || searchQuery).trim().toLowerCase();
    if (activeSearch) {
      return d.name.toLowerCase().includes(activeSearch) || d.sharedWith.toLowerCase().includes(activeSearch);
    }
    return true;
  });

  const handleDownload = (doc: RecentDoc) => {
    const blob = new Blob([doc.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${doc.name}`);
  };

  const handleCreateNew = (app: typeof apps[0]) => {
    const newDoc: RecentDoc = {
      id: `doc_${Date.now()}`,
      name: `Untitled_${app.label}_Document${app.ext}`,
      type: app.id as any,
      modified: 'Just now',
      size: '12 KB',
      sharedWith: 'Only you',
      content: `New ${app.label} Document created on ${new Date().toLocaleDateString()}`
    };
    setDocs([newDoc, ...docs]);
    showToast(`Created new ${app.label} document`);
  };

  const getTypeIcon = (type: RecentDoc['type']) => {
    switch (type) {
      case 'word': return <span className="w-6 h-6 bg-[#185ABD] text-white font-bold text-[10px] flex items-center justify-center rounded-xs">W</span>;
      case 'excel': return <span className="w-6 h-6 bg-[#107C41] text-white font-bold text-[10px] flex items-center justify-center rounded-xs">X</span>;
      case 'powerpoint': return <span className="w-6 h-6 bg-[#C43E1C] text-white font-bold text-[10px] flex items-center justify-center rounded-xs">P</span>;
      case 'onenote': return <span className="w-6 h-6 bg-[#7719AA] text-white font-bold text-[10px] flex items-center justify-center rounded-xs">N</span>;
      case 'pdf': return <span className="w-6 h-6 bg-red-600 text-white font-bold text-[9px] flex items-center justify-center rounded-xs">PDF</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] text-[#242424] overflow-y-auto select-none">
      <div className="max-w-5xl mx-auto w-full px-8 py-8 space-y-8">
        {/* Header & Storage */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutGrid size={22} className="text-[#0078D4]" />
              <h1 className="text-2xl font-bold text-gray-900">Microsoft 365 Apps &amp; Files</h1>
            </div>
            <p className="text-xs text-gray-500">
              Access your connected enterprise productivity tools, shared cloud documents, and notebooks.
            </p>
          </div>

          <div className="p-3 bg-white border border-gray-200 rounded-xs flex items-center gap-3 shadow-2xs">
            <HardDrive size={18} className="text-[#0078D4]" />
            <div className="text-xs">
              <div className="font-semibold text-gray-800">OneDrive Cloud Storage</div>
              <div className="text-[11px] text-gray-500 font-mono">4.8 GB of 50.0 GB (9.6%)</div>
            </div>
          </div>
        </div>

        {/* 1. App Launcher Grid */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Office Applications
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {apps.map(app => (
              <button
                key={app.id}
                type="button"
                onClick={() => handleCreateNew(app)}
                className="p-3.5 bg-white border border-gray-200 hover:border-[#0078D4] hover:shadow-xs rounded-xs flex items-start gap-3 transition-all text-left group"
              >
                <div className={`w-8 h-8 rounded-xs ${app.color} text-white flex items-center justify-center font-bold text-sm shadow-2xs group-hover:scale-105 transition-transform flex-shrink-0`}>
                  {app.iconLetter}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-900 group-hover:text-[#0078D4] transition-colors">
                    {app.label}
                  </div>
                  <div className="text-[11px] text-gray-400 truncate">{app.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Recent Documents Stream */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Recent Documents &amp; Cloud Files
            </h2>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-3 py-1.5 text-xs bg-white border border-gray-200 focus:border-[#0078D4] focus:outline-hidden rounded-xs"
                />
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 focus:border-[#0078D4] focus:outline-hidden rounded-xs"
              >
                <option value="all">All Types</option>
                <option value="word">Word</option>
                <option value="excel">Excel</option>
                <option value="powerpoint">PowerPoint</option>
                <option value="onenote">OneNote</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xs divide-y divide-gray-100 shadow-2xs">
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                className="p-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getTypeIcon(doc.type)}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-900 hover:text-[#0078D4] truncate cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                      {doc.name}
                    </div>
                    <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                      <span>{doc.modified}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{doc.sharedWith}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="p-1.5 text-gray-500 hover:text-[#0078D4] hover:bg-gray-100 rounded-xs transition-colors"
                    title="Quick Preview"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    className="p-1.5 text-gray-500 hover:text-[#0078D4] hover:bg-gray-100 rounded-xs transition-colors"
                    title="Download Document"
                  >
                    <Download size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-300 rounded-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-[#0078D4] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <FileText size={16} />
                <span className="font-semibold text-xs truncate">{previewDoc.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 hover:bg-white/20 text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-6 bg-gray-50 font-mono text-xs text-gray-800 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-[60vh]">
              {previewDoc.content}
            </div>

            <div className="p-3 bg-white border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <span>Size: {previewDoc.size} • Shared with: {previewDoc.sharedWith}</span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E1E1E] text-white text-xs px-4 py-2.5 shadow-xl border border-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
