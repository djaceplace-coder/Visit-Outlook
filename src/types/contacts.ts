export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  company: string;
  phone: string;
  mobile?: string;
  officeLocation?: string;
  notes?: string;
  avatarColor?: string;
  isFavorite?: boolean;
  category?: 'Work' | 'Personal' | 'Client' | 'Vendor';
}
