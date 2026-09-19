import { useState, useMemo, useEffect, type FormEvent } from 'react';
import {
  Users,
  Star,
  Plus,
  Search,
  Mail,
  Calendar,
  Phone,
  Building,
  MapPin,
  Trash2,
  Edit2,
  X,
  Check,
  Briefcase,
  UserCheck,
  Filter,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { Contact } from '../../types/contacts';
import { INITIAL_CONTACTS } from '../../data/initialContactsData';
import {
  fetchContacts,
  insertContact,
  updateContact,
  deleteContact
} from '../../lib/contactService';

interface PeopleSectionProps {
  onSendEmailTo?: (email: string, name: string) => void;
  onScheduleMeetingWith?: (contact: Contact) => void;
  searchQuery?: string;
}

export function PeopleSection({ onSendEmailTo, onScheduleMeetingWith, searchQuery: globalSearchQuery = '' }: PeopleSectionProps) {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [selectedContactId, setSelectedContactId] = useState<string>(INITIAL_CONTACTS[0]?.id || '');
  const [activeFolder, setActiveFolder] = useState<'all' | 'favorites' | 'work' | 'personal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isViewingMobileDetails, setIsViewingMobileDetails] = useState(false);

  // Load contacts on mount
  useEffect(() => {
    fetchContacts()
      .then(loadedContacts => {
        if (loadedContacts && loadedContacts.length > 0) {
          setContacts(loadedContacts);
          if (!loadedContacts.some(c => c.id === selectedContactId)) {
            setSelectedContactId(loadedContacts[0].id);
          }
        }
      })
      .catch(err => {
        console.error('Failed to fetch contacts:', err);
      });
  }, []);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formJobTitle, setFormJobTitle] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formOffice, setFormOffice] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formCategory, setFormCategory] = useState<'Work' | 'Personal' | 'Client' | 'Vendor'>('Work');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      // Folder filter
      if (activeFolder === 'favorites' && !c.isFavorite) return false;
      if (activeFolder === 'work' && c.category !== 'Work') return false;
      if (activeFolder === 'personal' && c.category !== 'Personal') return false;

      // Letter filter
      if (selectedLetter && !c.lastName.toUpperCase().startsWith(selectedLetter) && !c.firstName.toUpperCase().startsWith(selectedLetter)) {
        return false;
      }

      // Search query (from global search or local input)
      const activeSearch = (globalSearchQuery || searchQuery).trim().toLowerCase();
      if (activeSearch) {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        return (
          fullName.includes(activeSearch) ||
          c.email.toLowerCase().includes(activeSearch) ||
          c.company.toLowerCase().includes(activeSearch) ||
          c.jobTitle.toLowerCase().includes(activeSearch)
        );
      }

      return true;
    }).sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [contacts, activeFolder, selectedLetter, searchQuery, globalSearchQuery]);

  const selectedContact = useMemo(() => {
    return contacts.find(c => c.id === selectedContactId) || filteredContacts[0] || null;
  }, [contacts, selectedContactId, filteredContacts]);

  const openNewContactModal = () => {
    setEditingContactId(null);
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormJobTitle('');
    setFormDepartment('');
    setFormCompany('Acme Corporation');
    setFormPhone('');
    setFormMobile('');
    setFormOffice('');
    setFormNotes('');
    setFormCategory('Work');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Contact) => {
    setEditingContactId(c.id);
    setFormFirstName(c.firstName);
    setFormLastName(c.lastName);
    setFormEmail(c.email);
    setFormJobTitle(c.jobTitle);
    setFormDepartment(c.department);
    setFormCompany(c.company);
    setFormPhone(c.phone);
    setFormMobile(c.mobile || '');
    setFormOffice(c.officeLocation || '');
    setFormNotes(c.notes || '');
    setFormCategory(c.category || 'Work');
    setIsModalOpen(true);
  };

  const handleSaveContact = (e: FormEvent) => {
    e.preventDefault();
    if (!formFirstName.trim() || !formLastName.trim() || !formEmail.trim()) {
      showToast('First name, last name, and email are required');
      return;
    }

    if (editingContactId) {
      const existing = contacts.find(c => c.id === editingContactId);
      const updatedContact: Contact = {
        ...existing,
        id: editingContactId,
        firstName: formFirstName.trim(),
        lastName: formLastName.trim(),
        email: formEmail.trim(),
        jobTitle: formJobTitle.trim(),
        department: formDepartment.trim(),
        company: formCompany.trim(),
        phone: formPhone.trim(),
        mobile: formMobile.trim(),
        officeLocation: formOffice.trim(),
        notes: formNotes.trim(),
        category: formCategory,
        avatarColor: existing?.avatarColor || 'bg-[#0078D4]',
        isFavorite: existing?.isFavorite || false
      };
      setContacts(prev => prev.map(c => c.id === editingContactId ? updatedContact : c));
      updateContact(updatedContact).catch(console.error);
      showToast(`Contact ${formFirstName} ${formLastName} updated`);
    } else {
      const newContact: Contact = {
        id: `c_${Date.now()}`,
        firstName: formFirstName.trim(),
        lastName: formLastName.trim(),
        email: formEmail.trim(),
        jobTitle: formJobTitle.trim(),
        department: formDepartment.trim(),
        company: formCompany.trim(),
        phone: formPhone.trim(),
        mobile: formMobile.trim(),
        officeLocation: formOffice.trim(),
        notes: formNotes.trim(),
        category: formCategory,
        avatarColor: 'bg-[#0078D4]',
        isFavorite: false
      };
      setContacts(prev => [newContact, ...prev]);
      setSelectedContactId(newContact.id);
      insertContact(newContact).then(inserted => {
        if (inserted && inserted.id !== newContact.id) {
          setContacts(prev => prev.map(c => c.id === newContact.id ? inserted : c));
          if (selectedContactId === newContact.id) setSelectedContactId(inserted.id);
        }
      }).catch(console.error);
      showToast(`Contact ${newContact.firstName} ${newContact.lastName} created`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteContact = (id: string) => {
    const target = contacts.find(c => c.id === id);
    setContacts(prev => prev.filter(c => c.id !== id));
    deleteContact(id).catch(console.error);
    if (selectedContactId === id) {
      const next = contacts.find(c => c.id !== id);
      if (next) setSelectedContactId(next.id);
    }
    setIsViewingMobileDetails(false);
    showToast(`Deleted ${target?.firstName || 'contact'} from address book`);
  };

  const toggleFavorite = (id: string) => {
    const target = contacts.find(c => c.id === id);
    if (!target) return;
    const updated = { ...target, isFavorite: !target.isFavorite };
    setContacts(prev => prev.map(c => c.id === id ? updated : c));
    updateContact(updated).catch(console.error);
  };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="flex h-full bg-[#FAFAFA] text-gray-800 overflow-hidden select-none relative">
      {/* Mobile backdrop for folder sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 1. Left Folder Navigation (drawer on mobile) */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-64 md:w-56 border-r border-gray-200 bg-white flex flex-col flex-shrink-0 shadow-xl md:shadow-none transition-transform duration-200 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              openNewContactModal();
              setIsSidebarOpen(false);
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-[#0078D4] hover:bg-[#005A9E] text-white py-1.5 px-3 rounded-xs text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus size={15} />
            <span>New contact</span>
          </button>
          <button 
            type="button" 
            onClick={() => setIsSidebarOpen(false)}
            className="ml-2 p-1 text-gray-400 hover:text-gray-700 rounded-xs md:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-2 space-y-0.5">
          <button
            type="button"
            onClick={() => { setActiveFolder('all'); setSelectedLetter(null); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xs font-medium transition-colors ${
              activeFolder === 'all' && !selectedLetter ? 'bg-blue-50 text-[#0078D4] font-semibold' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Users size={15} className="text-gray-500" />
              All contacts
            </span>
            <span className="text-[11px] text-gray-400 font-mono">{contacts.length}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveFolder('favorites'); setSelectedLetter(null); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xs font-medium transition-colors ${
              activeFolder === 'favorites' ? 'bg-blue-50 text-[#0078D4] font-semibold' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Star size={15} className="text-amber-500 fill-amber-500" />
              Favorites
            </span>
            <span className="text-[11px] text-gray-400 font-mono">
              {contacts.filter(c => c.isFavorite).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveFolder('work'); setSelectedLetter(null); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xs font-medium transition-colors ${
              activeFolder === 'work' ? 'bg-blue-50 text-[#0078D4] font-semibold' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Briefcase size={15} className="text-gray-500" />
              Company Directory
            </span>
            <span className="text-[11px] text-gray-400 font-mono">
              {contacts.filter(c => c.category === 'Work').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveFolder('personal'); setSelectedLetter(null); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xs font-medium transition-colors ${
              activeFolder === 'personal' ? 'bg-blue-50 text-[#0078D4] font-semibold' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <UserCheck size={15} className="text-gray-500" />
              Personal Contacts
            </span>
            <span className="text-[11px] text-gray-400 font-mono">
              {contacts.filter(c => c.category === 'Personal').length}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Middle Contacts List */}
      <div className={`w-full md:w-80 border-r border-gray-200 bg-white flex flex-col flex-shrink-0 ${
        isViewingMobileDetails ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Search header with mobile menu button */}
        <div className="p-3 border-b border-gray-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="p-1 text-gray-500 hover:text-gray-900 rounded-xs md:hidden"
            title="Open folders menu"
          >
            <Menu size={18} />
          </button>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#0078D4] focus:outline-hidden rounded-xs transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Alphabet jump bar */}
        <div className="px-2 py-1 bg-gray-50 border-b border-gray-200 flex items-center justify-between overflow-x-auto text-[10px] font-semibold text-gray-500 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedLetter(null)}
            className={`px-1 py-0.5 rounded-xs transition-colors ${
              !selectedLetter ? 'bg-[#0078D4] text-white' : 'hover:text-[#0078D4]'
            }`}
          >
            All
          </button>
          {alphabet.map(letter => {
            const hasContacts = contacts.some(c => c.lastName.toUpperCase().startsWith(letter) || c.firstName.toUpperCase().startsWith(letter));
            return (
              <button
                key={letter}
                type="button"
                disabled={!hasContacts}
                onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                className={`px-1 py-0.5 rounded-xs transition-colors ${
                  selectedLetter === letter
                    ? 'bg-[#0078D4] text-white'
                    : hasContacts
                    ? 'hover:text-[#0078D4]'
                    : 'text-gray-300 cursor-default'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>

        {/* Contact list items */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No contacts found matching your criteria.
            </div>
          ) : (
            filteredContacts.map(contact => {
              const isSelected = selectedContact?.id === contact.id;
              const initials = `${contact.firstName[0] || ''}${contact.lastName[0] || ''}`.toUpperCase();

              return (
                <div
                  key={contact.id}
                  onClick={() => {
                    setSelectedContactId(contact.id);
                    setIsViewingMobileDetails(true);
                  }}
                  className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/80 border-l-4 border-l-[#0078D4]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full ${contact.avatarColor || 'bg-[#0078D4]'} text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-gray-900 truncate">
                        {contact.firstName} {contact.lastName}
                      </div>
                      {contact.isFavorite && (
                        <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0 ml-1" />
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">{contact.jobTitle || contact.company}</div>
                    <div className="text-[11px] text-gray-400 truncate">{contact.email}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Right Contact Details Pane */}
      <div className={`flex-1 flex flex-col bg-white overflow-y-auto ${
        isViewingMobileDetails ? 'flex' : 'hidden md:flex'
      }`}>
        {/* Mobile back bar */}
        <div className="md:hidden p-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
          <button
            type="button"
            onClick={() => setIsViewingMobileDetails(false)}
            className="flex items-center gap-1 text-xs font-semibold text-[#0078D4]"
          >
            <ChevronLeft size={16} />
            <span>Contacts</span>
          </button>
        </div>
        {selectedContact ? (
          <div className="max-w-3xl w-full mx-auto p-8 space-y-6">
            {/* Header / Hero */}
            <div className="flex items-start justify-between pb-6 border-b border-gray-200">
              <div className="flex items-center gap-5">
                <div className={`w-18 h-18 rounded-full ${selectedContact.avatarColor || 'bg-[#0078D4]'} text-white flex items-center justify-center font-bold text-2xl shadow-sm`}>
                  {`${selectedContact.firstName[0] || ''}${selectedContact.lastName[0] || ''}`.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedContact.firstName} {selectedContact.lastName}
                    </h2>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(selectedContact.id)}
                      className="p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                      title={selectedContact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star
                        size={17}
                        className={selectedContact.isFavorite ? 'text-amber-500 fill-amber-500' : 'hover:text-amber-500'}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">
                    {selectedContact.jobTitle} • {selectedContact.company}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedContact.department}</p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedContact)}
                  className="p-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-xs flex items-center gap-1.5 transition-colors"
                  title="Edit contact"
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteContact(selectedContact.id)}
                  className="p-2 border border-gray-300 hover:bg-red-50 text-red-600 text-xs font-medium rounded-xs flex items-center gap-1.5 transition-colors"
                  title="Delete contact"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (onSendEmailTo) {
                    onSendEmailTo(selectedContact.email, `${selectedContact.firstName} ${selectedContact.lastName}`);
                  } else {
                    showToast(`Starting email compose to ${selectedContact.email}`);
                  }
                }}
                className="p-3 bg-blue-50 border border-blue-200 hover:bg-blue-100/80 rounded-xs flex items-center gap-3 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-[#0078D4] text-white flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0078D4]">Send Email</div>
                  <div className="text-[11px] text-gray-600 truncate max-w-[200px]">{selectedContact.email}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onScheduleMeetingWith) {
                    onScheduleMeetingWith(selectedContact);
                  } else {
                    showToast(`Drafting meeting on calendar with ${selectedContact.firstName}`);
                  }
                }}
                className="p-3 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/80 rounded-xs flex items-center gap-3 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-[#107C41] text-white flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#107C41]">Schedule Meeting</div>
                  <div className="text-[11px] text-gray-600">Send calendar invitation</div>
                </div>
              </button>
            </div>

            {/* Detail sections */}
            <div className="space-y-6 pt-2">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Contact Information
                </h3>
                <div className="space-y-3 bg-gray-50/60 p-4 border border-gray-200 rounded-xs">
                  <div className="flex items-center gap-3 text-xs">
                    <Mail size={15} className="text-gray-400" />
                    <div className="flex-1">
                      <span className="text-gray-500 mr-2">Email:</span>
                      <a href={`mailto:${selectedContact.email}`} className="text-[#0078D4] hover:underline font-mono">
                        {selectedContact.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <Phone size={15} className="text-gray-400" />
                    <div className="flex-1">
                      <span className="text-gray-500 mr-2">Work Phone:</span>
                      <span className="text-gray-800 font-mono">{selectedContact.phone}</span>
                    </div>
                  </div>

                  {selectedContact.mobile && (
                    <div className="flex items-center gap-3 text-xs">
                      <Phone size={15} className="text-gray-400" />
                      <div className="flex-1">
                        <span className="text-gray-500 mr-2">Mobile:</span>
                        <span className="text-gray-800 font-mono">{selectedContact.mobile}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs">
                    <Building size={15} className="text-gray-400" />
                    <div className="flex-1">
                      <span className="text-gray-500 mr-2">Organization:</span>
                      <span className="text-gray-800">{selectedContact.company} • {selectedContact.department}</span>
                    </div>
                  </div>

                  {selectedContact.officeLocation && (
                    <div className="flex items-center gap-3 text-xs">
                      <MapPin size={15} className="text-gray-400" />
                      <div className="flex-1">
                        <span className="text-gray-500 mr-2">Office Location:</span>
                        <span className="text-gray-800">{selectedContact.officeLocation}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedContact.notes && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Notes
                  </h3>
                  <div className="p-4 bg-gray-50 border border-gray-200 text-xs text-gray-700 leading-relaxed rounded-xs">
                    {selectedContact.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <Users size={48} strokeWidth={1.5} className="mb-3 text-gray-300" />
            <p className="text-sm font-semibold text-gray-600">Select a contact</p>
            <p className="text-xs mt-1">Choose someone from the list or create a new contact card.</p>
          </div>
        )}
      </div>

      {/* New / Edit Contact Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-300 rounded-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#0078D4] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} />
                <span className="font-semibold text-sm">
                  {editingContactId ? 'Edit Contact' : 'New Contact Card'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/20 text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">First name *</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Last name *</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email address *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Job title</label>
                  <input
                    type="text"
                    value={formJobTitle}
                    onChange={(e) => setFormJobTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                  >
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Client">Client</option>
                    <option value="Vendor">Vendor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Work phone</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile</label>
                  <input
                    type="tel"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Office location</label>
                <input
                  type="text"
                  value={formOffice}
                  onChange={(e) => setFormOffice(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                  placeholder="e.g. Building 3, Room 402"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                  placeholder="Additional background or contact notes..."
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Save Contact</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E1E1E] text-white text-xs px-4 py-2.5 shadow-xl border border-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
