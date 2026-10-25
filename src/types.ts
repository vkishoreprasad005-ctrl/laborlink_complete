export type UserRole = 'worker' | 'recruiter' | 'admin';

export interface UserProfile {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dob: string;
  gender: string;
  nationality: string;
  emergencyContact: string;
  skills: string[];
  yearsOfExperience: number;
  description?: string;
  profilePhoto?: string;
  onboarded: boolean;
  lat?: number;
  lng?: number;
  lastLogin?: string;
  // Recruiter specific fields
  organizationName?: string;
  organizationDescription?: string;
  additionalRequirements?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile?: UserProfile;
  isSuspended?: boolean;
}

export interface Job {
  id: string;
  recruiterId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  yearsOfExperienceRequired: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  salary: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Daily Wage';
  createdAt: string;
  status?: 'Applicable' | 'Not Applicable';
  adminStatus: 'pending' | 'approved' | 'rejected';
  bannerImage?: string;
  applicantCount?: number;
}

export interface Application {
  id: string;
  jobId: string;
  workerId: string;
  recruiterId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  workerProfile?: UserProfile;
  jobTitle?: string;
}

export interface Transaction {
  id: string;
  jobId: string;
  workerId: string;
  recruiterId: string;
  amount: number;
  status: 'pending' | 'completed';
  timestamp: string;
  type: 'application_fee' | 'platform_fee';
  description: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  senderName?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'application' | 'message' | 'system';
}

export interface AuthResponse {
  user: User;
  token: string;
}
