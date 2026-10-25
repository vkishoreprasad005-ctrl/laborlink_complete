import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Briefcase, 
  Map as MapIcon, 
  User as UserIcon, 
  PlusCircle, 
  LayoutDashboard, 
  LogOut, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Users,
  DollarSign,
  Filter,
  Download,
  MapPin,
  ChevronRight,
  X,
  CreditCard,
  Camera,
  Upload,
  Sparkles,
  MessageSquare as MessageIcon,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { User, Job, Transaction, UserRole, Application, Message } from './types';
import { cn } from './lib/utils';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area 
} from 'recharts';

// Fix Leaflet marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- API Service ---
const API = {
  login: async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },
  adminLogin: async (email: string, password: string) => {
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },
  register: async (email: string, password: string, role: UserRole) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    return res.json();
  },
  updateUser: async (id: string, data: Partial<User>) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getJobs: async (workerId?: string, recruiterId?: string, filters?: any) => {
    let url = '/api/jobs?';
    if (workerId) url += `workerId=${workerId}&`;
    if (recruiterId) url += `recruiterId=${recruiterId}&`;
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) url += `${key}=${filters[key]}&`;
      });
    }
    const res = await fetch(url);
    return res.json();
  },
  postJob: async (job: Partial<Job>) => {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job)
    });
    return res.json();
  },
  getApplications: async (params: { workerId?: string, jobId?: string, recruiterId?: string }) => {
    let url = '/api/applications?';
    Object.keys(params).forEach(key => {
      if ((params as any)[key]) url += `${key}=${(params as any)[key]}&`;
    });
    const res = await fetch(url);
    return res.json();
  },
  applyForJob: async (jobId: string, workerId: string) => {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, workerId })
    });
    return res.json();
  },
  updateApplicationStatus: async (id: string, status: string) => {
    const res = await fetch(`/api/applications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },
  getAdminStats: async () => {
    const res = await fetch('/api/admin/stats');
    return res.json();
  },
  updateJob: async (id: string, data: Partial<Job>) => {
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteJob: async (id: string) => {
    const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    return res.json();
  },
  updateJobAdminStatus: async (id: string, status: string) => {
    const res = await fetch(`/api/admin/jobs/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },
  suspendUser: async (id: string, suspended: boolean) => {
    const res = await fetch(`/api/admin/users/${id}/suspend`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suspended })
    });
    return res.json();
  },
  resetPassword: async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}/reset-password`, { method: 'POST' });
    return res.json();
  },
  getMessages: async (userId: string) => {
    const res = await fetch(`/api/messages/${userId}`);
    return res.json();
  },
  sendMessage: async (senderId: string, receiverId: string, content: string) => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, receiverId, content })
    });
    return res.json();
  },
  getNotifications: async (userId: string) => {
    const res = await fetch(`/api/notifications/${userId}`);
    return res.json();
  },
  markNotificationRead: async (id: string) => {
    const res = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    return res.json();
  },
  getWorkers: async () => {
    const res = await fetch('/api/workers');
    return res.json();
  },
  getJobApplicants: async (jobId: string) => {
    const res = await fetch(`/api/jobs/${jobId}/applicants`);
    return res.json();
  },
  getTransactions: async (userId: string) => {
    const res = await fetch(`/api/transactions/${userId}`);
    return res.json();
  }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d.toFixed(1);
};

// --- Components ---

const Sidebar = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => {
  const location = useLocation();
  
  if (!user) return null;

  const navItems = [
    { label: 'Dashboard', path: user.role === 'admin' ? '/admin' : '/', icon: LayoutDashboard, roles: ['worker', 'admin'] },
    { label: 'Profile', path: '/profile', icon: UserIcon, roles: ['worker', 'recruiter'] },
    { label: 'Job Feed', path: '/jobs', icon: Briefcase, roles: ['worker'] },
    { label: 'My Applications', path: '/applications', icon: CheckCircle, roles: ['worker'] },
    { label: 'Map View', path: '/map', icon: MapIcon, roles: ['worker'] },
    { label: 'Recruiter Portal', path: '/recruiter', icon: PlusCircle, roles: ['recruiter'] },
    { label: 'Messages', path: '/messages', icon: MessageIcon, roles: ['worker', 'recruiter'] },
    { label: 'Notifications', path: '/notifications', icon: Bell, roles: ['worker', 'recruiter'] },
    { label: 'Transactions', path: '/transactions', icon: CreditCard, roles: ['worker', 'recruiter'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-white border-r border-gray-100 h-screen sticky top-0 flex flex-col">
      <div className="p-6">
        <Link to={user.role === 'recruiter' ? '/recruiter' : '/'} className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Briefcase className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">LaborLink</span>
        </Link>
      </div>

      <nav className="flex-grow px-4 space-y-1">
        {filteredNav.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              location.pathname === item.path 
                ? "bg-blue-50 text-blue-600" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="bg-gray-100 p-2 rounded-full">
            <UserIcon className="w-5 h-5 text-gray-500" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-gray-900 truncate">{user.profile?.name || user.email}</p>
            <p className="text-[10px] text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

const AuthPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('worker');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = isLogin ? await API.login(email, password) : await API.register(email, password, role);
      if (data.error) throw new Error(data.error);
      onLogin(data.user);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Auth failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 w-full">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-2xl shadow-blue-500/5 w-full max-w-md border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
            <Briefcase className="text-white w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{isLogin ? 'Welcome Back' : 'Join LaborLink'}</h2>
          <p className="text-gray-500 mt-2">Connecting skills with opportunities</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('worker')}
                  className={cn(
                    "py-3 rounded-xl border text-sm font-bold transition-all",
                    role === 'worker' ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20" : "bg-white text-gray-500 border-gray-200 hover:border-blue-200"
                  )}
                >
                  Worker
                </button>
                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={cn(
                    "py-3 rounded-xl border text-sm font-bold transition-all",
                    role === 'recruiter' ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20" : "bg-white text-gray-500 border-gray-200 hover:border-blue-200"
                  )}
                >
                  Recruiter
                </button>
              </div>
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 mt-4"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-2">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-blue-600 hover:text-blue-700 block w-full"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
          <Link 
            to="/admin-login"
            className="text-xs font-bold text-gray-400 hover:text-gray-600 block w-full"
          >
            Admin Access
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

const AdminLoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await API.adminLogin(email, password);
      if (data.error) throw new Error(data.error);
      onLogin(data.user);
      navigate('/admin');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="bg-gray-900 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <TrendingUp className="text-white w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Portal</h2>
          <p className="text-gray-500 mt-2">Secure access for platform administrators</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Admin Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none"
              placeholder="admin@laborlink.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Admin Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg disabled:opacity-50 mt-4"
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link 
            to="/"
            className="text-sm font-bold text-gray-500 hover:text-gray-700"
          >
            Back to User Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

const COMMON_SKILLS = ["Plumbing", "Electrical", "Painting", "Carpentry", "Masonry", "Welding", "Cleaning", "Gardening", "Driving", "Security", "Tailoring", "Cooking", "Housekeeping", "Construction", "Mechanic"];

const INDIAN_CITIES = [
  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { name: "Delhi", lat: 28.6139, lng: 77.2090 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Vellore", lat: 12.9165, lng: 79.1325 }
];

const Onboarding = ({ user, onComplete }: { user: User, onComplete: (user: User) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: 'Bangalore',
    state: '',
    zip: '',
    dob: '',
    gender: 'Male',
    nationality: '',
    emergencyContact: '',
    skills: [] as string[],
    yearsOfExperience: 0,
    description: '',
    profilePhoto: '',
    lat: 12.9716,
    lng: 77.5946,
    // Recruiter specific
    organizationName: '',
    organizationDescription: '',
    additionalRequirements: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = await API.updateUser(user.id, {
      ...formData,
      yearsOfExperience: Number(formData.yearsOfExperience),
      lat: Number(formData.lat),
      lng: Number(formData.lng)
    });
    onComplete(updatedUser);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'city') {
      const cityData = INDIAN_CITIES.find(c => c.name === value);
      if (cityData) {
        setFormData(prev => ({ ...prev, city: value, lat: cityData.lat, lng: cityData.lng }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Complete Your Profile</h2>
          <p className="text-gray-500 mt-2">We need a few more details to get you started on LaborLink.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-32 h-32 bg-gray-100 rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                {formData.profilePhoto ? (
                  <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-12 h-12 text-gray-300" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-xl cursor-pointer shadow-lg hover:bg-blue-700 transition-all">
                <Upload className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase mt-4">Profile Photo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Full Name</label>
              <input name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Phone Number</label>
              <input name="phone" required value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {user.role === 'recruiter' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Organization Name</label>
                  <input name="organizationName" required value={formData.organizationName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Organization Description</label>
                  <textarea name="organizationDescription" required value={formData.organizationDescription} onChange={handleChange} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Tell us about your company..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Additional Requirements/Details</label>
                  <textarea name="additionalRequirements" value={formData.additionalRequirements} onChange={handleChange} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Any specific requirements for workers?" />
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{user.role === 'worker' ? 'About You (Description)' : 'Personal Bio'}</label>
              <textarea name="description" required value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Tell us about yourself..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Address</label>
              <input name="address" required value={formData.address} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">City</label>
              <select name="city" required value={formData.city} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none">
                {INDIAN_CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">State</label>
              <input name="state" required value={formData.state} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Zip Code</label>
              <input name="zip" required value={formData.zip} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Date of Birth</label>
              <input name="dob" type="date" required value={formData.dob} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nationality</label>
              <input name="nationality" required value={formData.nationality} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Emergency Contact</label>
              <input name="emergencyContact" required value={formData.emergencyContact} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Years of Experience</label>
              <input name="yearsOfExperience" type="number" required value={formData.yearsOfExperience} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            {user.role === 'worker' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select Your Skills</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 max-h-48 overflow-y-auto">
                  {COMMON_SKILLS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                        formData.skills.includes(skill)
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"
                      )}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
            Create Profile & Continue
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ user }: { user: User }) => {
  const [stats, setStats] = useState<any>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [adminView, setAdminView] = useState<'summary' | 'pending' | 'accepted'>('summary');
  const [workerStats, setWorkerStats] = useState<any>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);

  useEffect(() => {
    if (user.role === 'admin') {
      API.getAdminStats().then(setStats);
    }
    API.getJobs(user.id).then(jobs => setRecentJobs(jobs.slice(0, 3)));
    
    if (user.role === 'worker') {
      fetch(`/api/worker/stats/${user.id}`).then(res => res.json()).then(setWorkerStats);
      fetch(`/api/jobs/recommendations/${user.id}`).then(res => res.json()).then(setRecommendedJobs);
    }
  }, [user]);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Calculate data for admin dashboard
  const jobsByType = stats?.allJobs?.reduce((acc: any, j: any) => {
    acc[j.type] = (acc[j.type] || 0) + 1;
    return acc;
  }, {}) || {};

  const pieData = Object.entries(jobsByType).map(([name, value]) => ({ name, value }));

  const jobsByArea = stats?.allJobs?.reduce((acc: any, j: any) => {
    const parts = j.location.address.split(',');
    const city = parts[parts.length - 1]?.trim() || 'Other';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {}) || {};

  const areaData = Object.entries(jobsByArea)
    .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))
    .slice(0, 5);

  const pendingJobs = stats?.allJobs?.filter((j: any) => j.adminStatus === 'pending') || [];
  // For "accepted jobs", we'll show jobs that have at least one accepted application
  // This might require more data from the backend, but we can approximate or just show jobs with applicants for now
  // Actually, the stats object has allJobs. Let's assume jobs with adminStatus 'approved' are what the user might mean, 
  // or specifically those with accepted applicants.
  const approvedJobs = stats?.allJobs?.filter((j: any) => j.adminStatus === 'approved') || [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.profile?.name || 'User'}!</h1>
          <p className="text-gray-500 mt-1">Here's what's happening on LaborLink today.</p>
        </div>
        {user.role === 'admin' && adminView !== 'summary' && (
          <button 
            onClick={() => setAdminView('summary')}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
          >
            Back to Summary
          </button>
        )}
      </div>

      {user.role === 'admin' ? (
        <div className="space-y-8">
          {adminView === 'summary' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-900 p-6 rounded-3xl shadow-xl shadow-blue-900/20 text-left">
                  <div className="bg-blue-800 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                    <DollarSign className="text-white w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-blue-200 uppercase tracking-wider">Total Earnings</p>
                  <p className="text-3xl font-bold text-white mt-1">₹{stats?.totalRevenue || 0}</p>
                </div>
                
                <button 
                  onClick={() => setAdminView('pending')}
                  className="bg-orange-50 p-6 rounded-3xl border border-orange-100 shadow-sm hover:shadow-md transition-all text-left"
                >
                  <div className="bg-orange-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                    <Filter className="text-orange-600 w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-orange-700 uppercase tracking-wider">Pending Review</p>
                  <p className="text-3xl font-bold text-orange-900 mt-1">{stats?.pendingJobsCount || 0}</p>
                </button>

                <button 
                  onClick={() => setAdminView('accepted')}
                  className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm hover:shadow-md transition-all text-left"
                >
                  <div className="bg-green-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                    <CheckCircle className="text-green-600 w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-green-700 uppercase tracking-wider">Accepted Jobs</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{stats?.acceptedJobsCount || 0}</p>
                </button>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left">
                  <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                    <Users className="text-blue-600 w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalUsers || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Jobs by Type</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Top Job Locations</h2>
                  <div className="space-y-4">
                    {areaData.map(([city, count]: any) => (
                      <div key={city} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <MapPin className="text-blue-600 w-4 h-4" />
                          </div>
                          <p className="font-bold text-gray-900">{city}</p>
                        </div>
                        <p className="text-sm font-bold text-blue-600">{count} Jobs</p>
                      </div>
                    ))}
                    {areaData.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No location data available</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 capitalize">
                {adminView === 'pending' ? 'Jobs Pending Review' : 'Accepted Jobs'}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Job Title</th>
                      <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Location</th>
                      <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Salary</th>
                      <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(adminView === 'pending' ? pendingJobs : approvedJobs).map((job: any) => (
                      <tr key={job.id}>
                        <td className="py-4">
                          <p className="text-sm font-bold text-gray-900">{job.title}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">{job.type}</p>
                        </td>
                        <td className="py-4 text-sm text-gray-500">{job.location.address}</td>
                        <td className="py-4 text-sm font-bold text-gray-900">{job.salary}</td>
                        <td className="py-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                            job.adminStatus === 'approved' ? "bg-green-100 text-green-700" :
                            job.adminStatus === 'pending' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                          )}>
                            {job.adminStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(adminView === 'pending' ? pendingJobs : approvedJobs).length === 0 && (
                  <p className="text-center text-gray-500 py-12">No jobs found in this category.</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Link to="/jobs" className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Briefcase className="text-blue-600 w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Active Jobs</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{workerStats?.activeJobsCount || '...'}</p>
            </Link>
            <Link to="/applications" className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm hover:shadow-md transition-all">
              <div className="bg-green-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle className="text-green-600 w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-green-700 uppercase tracking-wider">Applications</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{workerStats?.applicationsCount || 0}</p>
            </Link>
            <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 shadow-sm">
              <div className="bg-purple-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <TrendingUp className="text-purple-600 w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-purple-700 uppercase tracking-wider">Profile Views</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{workerStats?.profileViews || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recommended Job Opportunities</h2>
                <div className="bg-blue-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span className="text-[10px] font-bold text-blue-600 uppercase">AI Matched</span>
                </div>
              </div>
              <div className="space-y-4">
                {recommendedJobs.length > 0 ? recommendedJobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all">
                    <div>
                      <p className="font-bold text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-500">{job.location.address}</p>
                    </div>
                    <Link to={`/jobs?id=${job.id}`} className="text-blue-600 text-sm font-bold hover:underline">View</Link>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-8">No recommendations yet. Complete your profile to get matched!</p>
                )}
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Your Profile Strength</h2>
              <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mb-4">
                <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${user.profile?.profilePhoto ? '100%' : '85%'}` }} />
              </div>
              <p className="text-sm text-gray-500">
                {user.profile?.profilePhoto 
                  ? "Your profile is 100% complete! You're ready to find the best jobs." 
                  : "Your profile is 85% complete. Add a profile picture to reach 100%!"}
              </p>
              <Link to="/profile" className="mt-6 inline-block bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all">
                {user.profile?.profilePhoto ? 'View Profile' : 'Complete Profile'}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const ProfilePage = ({ user, onUpdate }: { user: User, onUpdate: (u: User) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.profile?.name || '',
    phone: user.profile?.phone || '',
    city: user.profile?.city || '',
    state: user.profile?.state || '',
    skills: user.profile?.skills || [],
    yearsOfExperience: user.profile?.yearsOfExperience || 0,
    emergencyContact: user.profile?.emergencyContact || '',
    description: user.profile?.description || '',
    profilePhoto: user.profile?.profilePhoto || '',
    lat: user.profile?.lat || 12.9716,
    lng: user.profile?.lng || 77.5946
  });

  if (!user.profile) return null;

  const handleSave = async () => {
    const updatedUser = await API.updateUser(user.id, {
      ...formData,
      yearsOfExperience: Number(formData.yearsOfExperience)
    });
    onUpdate(updatedUser);
    setIsEditing(false);
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'city') {
      const cityData = INDIAN_CITIES.find(c => c.name === value);
      if (cityData) {
        setFormData(prev => ({ ...prev, city: value, lat: cityData.lat, lng: cityData.lng }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-6">
            <div className="w-32 h-32 bg-white rounded-3xl p-1 shadow-xl">
              <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden relative group">
                {formData.profilePhoto ? (
                  <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-16 h-16 text-gray-400" />
                )}
                {isEditing && (
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all">
                    <Camera className="text-white w-8 h-8" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-start mb-8">
            <div>
              {isEditing ? (
                <input 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="text-3xl font-bold text-gray-900 border-b-2 border-blue-500 outline-none"
                />
              ) : (
                <h1 className="text-3xl font-bold text-gray-900">{user.profile.name}</h1>
              )}
              <p className="text-gray-500">{user.email} • {user.profile.city}, {user.profile.state}</p>
            </div>
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="bg-blue-50 text-blue-600 px-6 py-2 rounded-xl font-bold hover:bg-blue-100 transition-all"
            >
              {isEditing ? 'Save Profile' : 'Edit Profile'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">About You</h3>
                {isEditing ? (
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm resize-none"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed">{user.profile.description || 'No description added yet.'}</p>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Personal Information</h3>
                <div className="space-y-4">
                  <div className="flex flex-col text-sm">
                    <span className="text-gray-500 mb-1">Phone</span>
                    {isEditing ? (
                      <input 
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="font-medium text-gray-900 border-b border-gray-200 outline-none"
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{user.profile.phone}</span>
                    )}
                  </div>
                  <div className="flex flex-col text-sm">
                    <span className="text-gray-500 mb-1">City</span>
                    {isEditing ? (
                      <select 
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="font-medium text-gray-900 border-b border-gray-200 outline-none bg-transparent"
                      >
                        {INDIAN_CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    ) : (
                      <span className="font-medium text-gray-900">{user.profile.city}</span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date of Birth</span>
                    <span className="font-medium text-gray-900">{user.profile.dob}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Professional Info</h3>
                <div className="space-y-4">
                  <div className="flex flex-col text-sm">
                    <span className="text-gray-500 mb-1">Experience (Years)</span>
                    {isEditing ? (
                      <input 
                        name="yearsOfExperience"
                        type="number"
                        value={formData.yearsOfExperience}
                        onChange={handleChange}
                        className="font-medium text-gray-900 border-b border-gray-200 outline-none"
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{user.profile.yearsOfExperience} Years</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Skills & Expertise</h3>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200 max-h-64 overflow-y-auto">
                  {COMMON_SKILLS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-[10px] font-bold transition-all border",
                        formData.skills.includes(skill)
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"
                      )}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.profile.skills.map(skill => (
                    <span key={skill} className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-2">Emergency Contact</h4>
                {isEditing ? (
                  <input 
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    className="w-full bg-transparent border-b border-gray-300 outline-none text-sm"
                  />
                ) : (
                  <p className="text-sm text-gray-600">{user.profile.emergencyContact}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentModal = ({ isOpen, onClose, onComplete, amount }: { isOpen: boolean, onClose: () => void, onComplete: () => void, amount: number }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onComplete();
        onClose();
      }, 2000);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          {!isSuccess ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Payment Gateway</h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-2xl mb-8">
                <p className="text-sm text-blue-600 font-bold uppercase tracking-wider mb-1">Amount to Pay</p>
                <p className="text-4xl font-bold text-blue-900">₹{amount}</p>
                <p className="text-xs text-blue-500 mt-2">Application processing fee (Deducted from both parties)</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="p-4 border border-gray-200 rounded-2xl flex items-center gap-4 hover:border-blue-500 cursor-pointer transition-all">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-gray-900">UPI / GPay / PhonePe</p>
                    <p className="text-xs text-gray-500">Pay using any UPI app</p>
                  </div>
                  <div className="w-4 h-4 border-2 border-blue-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  </div>
                </div>
                <div className="p-4 border border-gray-100 rounded-2xl flex items-center gap-4 opacity-50 cursor-not-allowed">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-gray-900">Credit / Debit Card</p>
                    <p className="text-xs text-gray-500">Visa, Mastercard, RuPay</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ₹${amount} Now`
                )}
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-500">Your application has been submitted successfully.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const WorkerPortal = ({ user }: { user: User }) => {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<'all' | 'applicable' | 'not-applicable'>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState({
    skill: '',
    minExperience: '',
    maxSalary: '',
    location: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    const data = await API.getJobs(user.id, undefined, {
      search,
      ...advancedFilters
    });
    setJobs(data);
    
    const jobId = searchParams.get('id');
    if (jobId) {
      const job = data.find(j => j.id === jobId);
      if (job) setSelectedJob(job);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [user.id, search, advancedFilters]);

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    if (filter === 'applicable') return job.status === 'Applicable';
    if (filter === 'not-applicable') return job.status === 'Not Applicable';
    return true;
  });

  const handleApply = async () => {
    if (!selectedJob) return;
    setShowPayment(true);
  };

  const completeApplication = async () => {
    if (!selectedJob) return;
    try {
      await API.applyForJob(selectedJob.id, user.id);
      fetchJobs();
    } catch (err) {
      console.error('Application failed');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Feed</h1>
          <p className="text-gray-500">Browse and apply for jobs that match your expertise.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-all"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl">
            {['all', 'applicable', 'not-applicable'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all",
                  filter === f ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {f.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-white p-6 rounded-3xl border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Skill</label>
                <input 
                  type="text" 
                  placeholder="e.g. Plumbing"
                  value={advancedFilters.skill}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, skill: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. Bangalore"
                  value={advancedFilters.location}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, location: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Min. Experience (Years)</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={advancedFilters.minExperience}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, minExperience: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Max Salary (₹/day)</label>
                <input 
                  type="number" 
                  placeholder="5000"
                  value={advancedFilters.maxSalary}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, maxSalary: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow overflow-hidden">
        <div className="lg:col-span-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {filteredJobs.map(job => (
            <button 
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className={cn(
                "w-full text-left p-6 rounded-3xl border transition-all",
                selectedJob?.id === job.id 
                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "bg-white border-gray-100 hover:border-blue-200 text-gray-900"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  selectedJob?.id === job.id ? "text-blue-100" : job.status === 'Applicable' ? "text-green-600" : "text-gray-400"
                )}>
                  {job.status}
                </span>
                <span className={cn("text-[10px] font-bold", selectedJob?.id === job.id ? "text-blue-200" : "text-blue-600")}>
                  {user.profile?.lat && user.profile?.lng ? `${calculateDistance(user.profile.lat, user.profile.lng, job.location.lat, job.location.lng)} km` : ''}
                </span>
              </div>
              <h3 className="font-bold mb-1 truncate">{job.title}</h3>
              <p className={cn("text-xs mb-4", selectedJob?.id === job.id ? "text-blue-100" : "text-gray-500")}>
                {job.location.address}
              </p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">{job.salary}</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {selectedJob ? (
              <motion.div 
                key={selectedJob.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className={cn(
                      "inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4",
                      selectedJob.status === 'Applicable' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {selectedJob.status}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">{selectedJob.title}</h2>
                    <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm">
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedJob.location.address}</span>
                      <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {selectedJob.type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{selectedJob.salary}</p>
                    <p className="text-xs text-gray-400">Posted {new Date(selectedJob.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Experience</p>
                    <p className="font-bold text-gray-900">{selectedJob.yearsOfExperienceRequired}+ Years</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl md:col-span-2">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.requiredSkills.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none mb-12">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Job Description</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedJob.description}</p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={handleApply}
                    disabled={selectedJob.status !== 'Applicable'}
                    className={cn(
                      "flex-grow py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                      selectedJob.status === 'Applicable' 
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20" 
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {selectedJob.status === 'Applicable' ? 'Join this Job' : 'Not Applicable'}
                  </button>
                  <button className="px-6 py-4 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-all">
                    Save
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                <Briefcase className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a job to view details</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <PaymentModal 
        isOpen={showPayment} 
        onClose={() => setShowPayment(false)} 
        onComplete={completeApplication}
        amount={50}
      />
    </div>
  );
};

const MapView = ({ user }: { user: User }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    API.getJobs(user.id).then(setJobs);
  }, [user.id]);

  const userPos: [number, number] = [user.profile?.lat || 12.9716, user.profile?.lng || 77.5946];

  return (
    <div className="h-screen w-full relative">
      <MapContainer 
        center={userPos} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* User Location Marker */}
        <Marker position={userPos}>
          <Popup>
            <div className="p-2">
              <p className="font-bold text-blue-600">Your Location</p>
              <p className="text-xs text-gray-500">{user.profile?.address}</p>
            </div>
          </Popup>
        </Marker>

        {jobs.map(job => (
          <Marker 
            key={job.id} 
            position={[job.location.lat, job.location.lng]}
            eventHandlers={{
              click: () => setSelectedJob(job),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-gray-900">{job.title}</h3>
                <p className="text-xs text-gray-500 mb-2">{job.location.address}</p>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-bold text-xs">{job.salary}</span>
                  <button 
                    onClick={() => setSelectedJob(job)}
                    className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded font-bold"
                  >
                    Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <AnimatePresence>
        {selectedJob && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-8 left-8 right-8 z-10 bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 max-w-2xl mx-auto"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedJob.title}</h3>
                <p className="text-sm text-gray-500">{selectedJob.location.address}</p>
              </div>
              <button 
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="mt-4 flex gap-4">
              <Link 
                to={`/jobs?id=${selectedJob.id}`} 
                className="flex-grow bg-blue-600 text-white py-3 rounded-xl font-bold text-center hover:bg-blue-700"
              >
                View Details & Apply
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ApplicationsPage = ({ user }: { user: User }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getApplications({ workerId: user.id }).then(data => {
      setApplications(data);
      setLoading(false);
    });
  }, [user.id]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-500">Track the status of your job applications.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p>Loading...</p>
        ) : applications.length > 0 ? (
          applications.map(app => (
            <div key={app.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{app.jobTitle}</h3>
                <p className="text-xs text-gray-500 mt-1">Applied on {new Date(app.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <span className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest",
                  app.status === 'pending' ? "bg-yellow-50 text-yellow-600" :
                  app.status === 'accepted' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                )}>
                  {app.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500">You haven't applied for any jobs yet.</p>
            <Link to="/jobs" className="mt-4 inline-block text-blue-600 font-bold hover:underline">Browse Jobs</Link>
          </div>
        )}
      </div>
    </div>
  );
};

const RecruiterPortal = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [selectedWorkerForProfile, setSelectedWorkerForProfile] = useState<User | null>(null);
  const [view, setView] = useState<'post' | 'edit' | 'workers' | 'applicants'>('workers');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    salary: '',
    type: 'Full-time' as any,
    address: '',
    lat: 12.9716,
    lng: 77.5946,
    yearsOfExperienceRequired: 0,
    bannerImage: ''
  });

  const fetchRecruiterData = async () => {
    const jobsData = await API.getJobs(undefined, user.id);
    setJobs(jobsData);
    const workersData = await API.getWorkers();
    setWorkers(workersData);
  };

  useEffect(() => {
    fetchRecruiterData();
  }, [user.id]);

  const fetchApplicants = async (jobId: string) => {
    const data = await API.getJobApplicants(jobId);
    setApplicants(data);
    setView('applicants');
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const jobData = {
        ...formData,
        recruiterId: user.id,
        requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        location: {
          address: formData.address,
          lat: Number(formData.lat),
          lng: Number(formData.lng)
        },
        yearsOfExperienceRequired: Number(formData.yearsOfExperienceRequired)
      };

      if (view === 'edit' && selectedJob) {
        await API.updateJob(selectedJob.id, jobData);
        alert('Job updated successfully!');
      } else {
        await API.postJob(jobData);
        alert('Job posted successfully!');
      }
      
      setView('workers');
      fetchRecruiterData();
      resetForm();
    } catch (err) {
      alert('Failed to save job');
    }
  };

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills.join(', '),
      salary: job.salary,
      type: job.type,
      address: job.location.address,
      lat: job.location.lat,
      lng: job.location.lng,
      yearsOfExperienceRequired: job.yearsOfExperienceRequired,
      bannerImage: job.bannerImage || ''
    });
    setView('edit');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this job listing?')) {
      await API.deleteJob(id);
      fetchRecruiterData();
      if (selectedJob?.id === id) setSelectedJob(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      requiredSkills: '',
      salary: '',
      type: 'Full-time',
      address: '',
      lat: 12.9716,
      lng: 77.5946,
      yearsOfExperienceRequired: 0,
      bannerImage: ''
    });
  };

  const handleStatusUpdate = async (appId: string, status: string) => {
    await API.updateApplicationStatus(appId, status);
    if (selectedJob) fetchApplicants(selectedJob.id);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recruiter Portal</h1>
          <p className="text-gray-500">Manage your job listings and applicants.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              setView('workers');
              resetForm();
            }}
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all",
              view === 'workers' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-white text-gray-500 border border-gray-200"
            )}
          >
            Browse Workers
          </button>
          <button 
            onClick={() => {
              setView('post');
              resetForm();
            }}
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all",
              view === 'post' || view === 'edit' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-white text-gray-500 border border-gray-200"
            )}
          >
            {view === 'edit' ? 'Editing Job' : 'Post New Job'}
          </button>
        </div>
      </div>

      <div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Your Active Job Listings</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                {/* ... existing table code remains similar but I will ensure it's not the main focus ... */}
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Job Title</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Applicants</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {jobs.map(job => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-all">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-500">{job.location.address}</p>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => {
                            setSelectedJob(job);
                            fetchApplicants(job.id);
                          }}
                          className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all"
                        >
                          {job.applicantCount || 0} Applied
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                          job.adminStatus === 'approved' ? "bg-green-100 text-green-700" :
                          job.adminStatus === 'pending' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                        )}>
                          {job.adminStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleEdit(job)} className="p-2 text-gray-400 hover:text-blue-600 transition-all text-xs font-bold">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(job.id)} className="p-2 text-gray-400 hover:text-red-600 transition-all text-xs font-bold">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {view === 'workers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workers.map(worker => (
            <div key={worker.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-gray-100 w-16 h-16 rounded-2xl overflow-hidden">
                  {worker.profile?.profilePhoto ? (
                    <img src={worker.profile.profilePhoto} alt={worker.profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="text-gray-300 w-8 h-8" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{worker.profile?.name}</h3>
                  <p className="text-xs text-gray-500">{worker.profile?.city}, {worker.profile?.state}</p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <p className="text-xs text-gray-600 line-clamp-2">{worker.profile?.description}</p>
                <div className="flex flex-wrap gap-1">
                  {worker.profile?.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedWorkerForProfile(worker)}
                  className="flex-grow bg-gray-100 text-gray-900 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                >
                  View Profile
                </button>
                <button 
                  onClick={() => {
                    navigate(`/messages?contactId=${worker.id}`);
                  }}
                  className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-all"
                >
                  <MessageIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'applicants' && selectedJob && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setView('workers')} className="p-2 hover:bg-gray-100 rounded-full transition-all">
              <ChevronRight className="w-6 h-6 rotate-180 text-gray-400" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Applicants for {selectedJob.title}</h2>
              <p className="text-gray-500">Review and manage candidates.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {applicants.map(app => (
              <div key={app.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 w-12 h-12 rounded-xl overflow-hidden">
                    {app.workerProfile?.profilePhoto ? (
                      <img src={app.workerProfile.profilePhoto} alt={app.workerProfile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserIcon className="text-gray-300 w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{app.workerProfile?.name}</h3>
                    <p className="text-xs text-gray-500">{app.workerProfile?.skills.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                    app.status === 'accepted' ? "bg-green-100 text-green-700" :
                    app.status === 'pending' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                  )}>
                    {app.status}
                  </span>
                  {app.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleStatusUpdate(app.id, 'accepted')}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-all"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(app.id, 'rejected')}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => {
                      navigate(`/messages?contactId=${app.workerId}`);
                    }}
                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                  >
                    <MessageIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {applicants.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">No applicants yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {(view === 'post' || view === 'edit') && (
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{view === 'edit' ? 'Edit Job Listing' : 'Post a New Job'}</h2>
          <form onSubmit={handlePostJob} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Job Title</label>
                <input 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Senior Electrician"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Describe the job responsibilities..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Required Skills (comma separated)</label>
                <input 
                  required
                  value={formData.requiredSkills}
                  onChange={(e) => setFormData({...formData, requiredSkills: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Electrical, Wiring, Safety"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Salary Range</label>
                <input 
                  required
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. ₹800/day"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Job Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Daily Wage</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Experience Required (Years)</label>
                <input 
                  type="number"
                  required
                  value={formData.yearsOfExperienceRequired}
                  onChange={(e) => setFormData({...formData, yearsOfExperienceRequired: Number(e.target.value)})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Work Location Address</label>
                <input 
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Full address of the workplace"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Banner Image URL (Optional)</label>
                <input 
                  value={formData.bannerImage}
                  onChange={(e) => setFormData({...formData, bannerImage: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                type="submit"
                className="flex-grow bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
              >
                {view === 'edit' ? 'Update Job Listing' : 'Post Job Opportunity'}
              </button>
              <button 
                type="button"
                onClick={() => setView('workers')}
                className="px-8 bg-gray-100 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {selectedWorkerForProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[40px] p-10 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh] border border-gray-100"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-blue-50 rounded-3xl overflow-hidden border-4 border-white shadow-xl">
                  {selectedWorkerForProfile.profile?.profilePhoto ? (
                    <img src={selectedWorkerForProfile.profile.profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="w-10 h-10 text-blue-200" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedWorkerForProfile.profile?.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-500 font-medium">{selectedWorkerForProfile.profile?.city}, {selectedWorkerForProfile.profile?.state}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedWorkerForProfile(null)}
                className="p-2 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100/50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Experience</p>
                  <p className="text-lg font-bold text-gray-900">{selectedWorkerForProfile.profile?.yearsOfExperience} Years</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100/50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nationality</p>
                  <p className="text-lg font-bold text-gray-900">{selectedWorkerForProfile.profile?.nationality}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100/50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Gender</p>
                  <p className="text-lg font-bold text-gray-900">{selectedWorkerForProfile.profile?.gender}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Professional Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedWorkerForProfile.profile?.skills.map(skill => (
                    <span key={skill} className="bg-blue-600 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Professional Bio</h3>
                <p className="text-gray-600 leading-relaxed bg-blue-50/30 p-6 rounded-3xl border border-blue-50/50">
                  {selectedWorkerForProfile.profile?.description}
                </p>
              </div>

              <div className="pt-6 border-t border-gray-100 flex gap-4">
                <button 
                   onClick={() => {
                    navigate(`/messages?contactId=${selectedWorkerForProfile.id}`);
                    setSelectedWorkerForProfile(null);
                  }}
                  className="flex-grow bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <MessageIcon className="w-5 h-5" />
                  Send Message
                </button>
                <button 
                  onClick={() => setSelectedWorkerForProfile(null)}
                  className="px-8 bg-gray-50 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const AdminPortal = () => {
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'users' | 'jobs' | 'revenue'>('overview');

  useEffect(() => {
    API.getAdminStats().then(setStats);
  }, []);

  const handleDownloadTransactions = () => {
    const headers = ['ID', 'Amount', 'Status', 'Date', 'Job ID', 'Worker ID', 'Recruiter ID'];
    const rows = stats.allTransactions.map((tx: any) => [
      tx.id,
      tx.amount,
      tx.status,
      new Date(tx.timestamp).toLocaleString(),
      tx.jobId,
      tx.workerId,
      tx.recruiterId
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `laborlink_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [selectedJobDetail, setSelectedJobDetail] = useState<any>(null);
  const [view, setView] = useState<'stats' | 'jobs' | 'transactions'>('stats');

  if (!stats) return <div className="p-8">Loading stats...</div>;

  const usersByRole = stats.allUsers.reduce((acc: any, u: any) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const jobsByType = stats.allJobs.reduce((acc: any, j: any) => {
    acc[j.type] = (acc[j.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
          <p className="text-gray-500 mt-1">Platform overview and financial performance.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl overflow-x-auto max-w-full">
          {['overview', 'transactions', 'users', 'jobs', 'revenue'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize whitespace-nowrap",
                activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">₹{stats.totalRevenue}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Pending Review</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingJobsCount}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Active Jobs</p>
              <p className="text-3xl font-bold text-green-600">{stats.acceptedJobsCount}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">User Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(usersByRole).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.entries(usersByRole).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Jobs by Type</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(jobsByType).map(([name, value]) => ({ name, value }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Transactions</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ID</th>
                      <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.recentTransactions.map((tx: any) => (
                      <tr key={tx.id}>
                        <td className="py-4 text-sm font-medium text-gray-900">#{tx.id.slice(0, 8)}</td>
                        <td className="py-4 text-sm font-bold text-gray-900">₹{tx.amount}</td>
                        <td className="py-4">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-gray-500">{new Date(tx.timestamp).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent User Activity</h2>
              <div className="space-y-4">
                {stats.allUsers
                  .filter((u: any) => u.profile?.lastLogin)
                  .sort((a: any, b: any) => new Date(b.profile.lastLogin).getTime() - new Date(a.profile.lastLogin).getTime())
                  .slice(0, 5)
                  .map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                          {(u.profile?.name || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{u.profile?.name || u.email}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">{u.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-green-600 uppercase">Online</p>
                        <p className="text-[10px] text-gray-400">{new Date(u.profile.lastLogin).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">All Transactions</h2>
            <button 
              onClick={handleDownloadTransactions}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black transition-all"
            >
              <Download className="w-4 h-4" />
              Download Report (CSV)
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-sm font-bold text-gray-400 uppercase mb-1">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-sm font-bold text-gray-400 uppercase mb-1">Avg. Transaction</p>
              <p className="text-2xl font-bold text-gray-900">₹{(stats.totalRevenue / (stats.totalTransactions || 1)).toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-sm font-bold text-gray-400 uppercase mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">100%</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">All Transactions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.allTransactions.map((tx: any) => (
                    <tr key={tx.id}>
                      <td className="py-4 text-sm font-medium text-gray-900">#{tx.id.slice(0, 8)}</td>
                      <td className="py-4 text-sm font-bold text-gray-900">₹{tx.amount}</td>
                      <td className="py-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-500">{new Date(tx.timestamp).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(usersByRole).map(([role, count]: any) => (
              <div key={role} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-sm font-bold text-gray-400 uppercase mb-1">{role}s</p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Name / Email</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Location</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Last Login</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.allUsers.map((u: any) => (
                    <tr key={u.id}>
                      <td className="py-4">
                        <p className="text-sm font-bold text-gray-900">{u.profile?.name || 'New User'}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                          u.role === 'worker' ? "bg-blue-100 text-blue-700" :
                          u.role === 'recruiter' ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-500">{u.profile?.city || 'N/A'}</td>
                      <td className="py-4 text-sm text-gray-500">
                        {u.profile?.lastLogin ? new Date(u.profile.lastLogin).toLocaleString() : 'Never'}
                      </td>
                      <td className="py-4 text-right space-x-2">
                        <button 
                          onClick={() => API.suspendUser(u.id, !u.isSuspended).then(() => API.getAdminStats().then(setStats))}
                          className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                            u.isSuspended ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                          )}
                        >
                          {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button 
                          onClick={() => API.resetPassword(u.id).then(res => alert(res.message))}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold uppercase hover:bg-gray-200 transition-all"
                        >
                          Reset Pwd
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(jobsByType).map(([type, count]: any) => (
              <div key={type} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{type}</p>
                <p className="text-lg font-bold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Active Job Listings</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Salary</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.allJobs.map((j: any) => (
                    <tr key={j.id}>
                      <td className="py-4">
                        <p className="text-sm font-bold text-gray-900">{j.title}</p>
                        <p className="text-[10px] text-gray-500">{j.location.address}</p>
                      </td>
                      <td className="py-4 text-sm font-bold text-gray-900">{j.salary}</td>
                      <td className="py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                          j.adminStatus === 'approved' ? "bg-green-100 text-green-700" :
                          j.adminStatus === 'pending' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                        )}>
                          {j.adminStatus}
                        </span>
                      </td>
                      <td className="py-4 text-right space-x-2">
                        <button 
                          onClick={() => setSelectedJobDetail(j)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-100 transition-all"
                        >
                          Details
                        </button>
                        {j.adminStatus !== 'approved' && (
                          <button 
                            onClick={() => API.updateJobAdminStatus(j.id, 'approved').then(() => API.getAdminStats().then(setStats))}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-green-700 transition-all"
                          >
                            Approve
                          </button>
                        )}
                        {j.adminStatus !== 'rejected' && (
                          <button 
                            onClick={() => API.updateJobAdminStatus(j.id, 'rejected').then(() => API.getAdminStats().then(setStats))}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-red-700 transition-all"
                          >
                            Reject
                          </button>
                        )}
                        <button 
                          onClick={() => API.deleteJob(j.id).then(() => API.getAdminStats().then(setStats))}
                          className="px-3 py-1 bg-gray-900 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-black transition-all"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedJobDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedJobDetail.title}</h2>
                <p className="text-gray-500">Job ID: {selectedJobDetail.id}</p>
              </div>
              <button 
                onClick={() => setSelectedJobDetail(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            {selectedJobDetail.bannerImage && (
              <img 
                src={selectedJobDetail.bannerImage} 
                alt="Job Banner" 
                className="w-full h-48 object-cover rounded-2xl mb-6"
                referrerPolicy="no-referrer"
              />
            )}

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Salary</p>
                <p className="text-lg font-bold text-gray-900">{selectedJobDetail.salary}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Type</p>
                <p className="text-lg font-bold text-gray-900">{selectedJobDetail.type}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Location</p>
                <p className="text-sm text-gray-900">{selectedJobDetail.location.address}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Required Experience</p>
                <p className="text-sm text-gray-900">{selectedJobDetail.yearsOfExperienceRequired} Years</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">{selectedJobDetail.description}</p>
            </div>

            <div className="mb-8">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {selectedJobDetail.requiredSkills.map((skill: string) => (
                  <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => {
                  API.deleteJob(selectedJobDetail.id).then(() => {
                    API.getAdminStats().then(setStats);
                    setSelectedJobDetail(null);
                  });
                }}
                className="flex-grow bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all"
              >
                Delete Listing
              </button>
              <button 
                onClick={() => setSelectedJobDetail(null)}
                className="flex-grow bg-gray-100 text-gray-900 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Financial Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="p-6 bg-blue-50 rounded-3xl">
                <p className="text-sm font-bold text-blue-600 uppercase mb-2">Total Platform Earnings</p>
                <p className="text-4xl font-bold text-blue-900">₹{stats.totalRevenue}</p>
                <p className="text-xs text-blue-500 mt-2">Calculated from ₹50 fee per application (both parties)</p>
              </div>
              <div className="p-6 bg-green-50 rounded-3xl">
                <p className="text-sm font-bold text-green-600 uppercase mb-2">Projected Monthly</p>
                <p className="text-4xl font-bold text-green-900">₹{stats.totalRevenue * 3}</p>
                <p className="text-xs text-green-500 mt-2">Based on current growth trends</p>
              </div>
            </div>
            <div className="h-64 bg-gray-50 rounded-3xl flex items-end justify-around p-8">
              {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                <div key={i} className="w-8 bg-blue-600 rounded-t-lg transition-all hover:bg-blue-700" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-around mt-4 text-[10px] font-bold text-gray-400 uppercase">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Messaging Component ---
const Messaging = ({ user }: { user: User }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchParams] = useSearchParams();
  const contactIdFromUrl = searchParams.get('contactId');
  const [selectedContact, setSelectedContact] = useState<string | null>(contactIdFromUrl);
  const [contacts, setContacts] = useState<any[]>([]);
  const [allWorkers, setAllWorkers] = useState<User[]>([]);
  const [showWorkerSelect, setShowWorkerSelect] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      const data = await API.getMessages(user.id);
      setMessages(data);
      
      const uniqueContactIds = Array.from(new Set(data.map((m: Message) => 
        m.senderId === user.id ? m.receiverId : m.senderId
      )));

      if (contactIdFromUrl && !uniqueContactIds.includes(contactIdFromUrl)) {
        uniqueContactIds.push(contactIdFromUrl);
      }
      
      const contactList = await Promise.all(uniqueContactIds.map(async id => {
        const lastMsg = [...data].reverse().find((m: Message) => m.senderId === id || m.receiverId === id);
        let name = lastMsg?.senderId === id ? lastMsg.senderName : 'User ' + (id as string).substring(0, 4);
        return { id, name, lastMessage: lastMsg?.content || 'No messages yet' };
      }));
      setContacts(contactList);
    };
    fetchMessages();

    if (user.role === 'recruiter') {
      API.getWorkers().then(setAllWorkers);
    }
  }, [user.id, contactIdFromUrl, user.role]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !newMessage.trim()) return;
    
    const msg = await API.sendMessage(user.id, selectedContact, newMessage);
    setMessages([...messages, msg]);
    setNewMessage('');
  };

  const filteredMessages = messages.filter(m => 
    (m.senderId === user.id && m.receiverId === selectedContact) ||
    (m.senderId === selectedContact && m.receiverId === user.id)
  );

  return (
    <div className="p-8 max-w-6xl mx-auto h-[calc(100vh-100px)]">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 h-full flex overflow-hidden">
        {/* Contacts Sidebar */}
        <div className="w-80 border-r border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            {user.role === 'recruiter' && (
              <button 
                onClick={() => setShowWorkerSelect(!showWorkerSelect)}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="flex-grow overflow-y-auto relative">
            {showWorkerSelect && (
              <div className="absolute inset-0 bg-white z-10 p-4 space-y-2 border-b border-gray-100 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-900">Select Worker</h3>
                  <button onClick={() => setShowWorkerSelect(false)} className="text-gray-400 hover:text-gray-900"><X className="w-4 h-4" /></button>
                </div>
                {allWorkers.map(w => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setSelectedContact(w.id);
                      setShowWorkerSelect(false);
                      if (!contacts.find(c => c.id === w.id)) {
                        setContacts([{ id: w.id, name: w.profile?.name || w.email, lastMessage: 'No messages yet' }, ...contacts]);
                      }
                    }}
                    className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-xl transition-all text-left border border-transparent hover:border-gray-100"
                  >
                    <div className="bg-gray-100 w-8 h-8 rounded-lg flex items-center justify-center">
                      <UserIcon className="text-gray-400 w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{w.profile?.name || w.email}</span>
                  </button>
                ))}
              </div>
            )}
            {contacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact.id)}
                className={cn(
                  "w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-all text-left",
                  selectedContact === contact.id && "bg-blue-50"
                )}
              >
                <div className="bg-gray-200 w-12 h-12 rounded-2xl flex items-center justify-center">
                  <UserIcon className="text-gray-500 w-6 h-6" />
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-gray-900 truncate">{contact.name}</p>
                  <p className="text-xs text-gray-500 truncate">{contact.lastMessage}</p>
                </div>
              </button>
            ))}
            {contacts.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <p className="text-sm">No conversations yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-grow flex flex-col">
          {selectedContact ? (
            <>
              <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <div className="bg-gray-100 w-10 h-10 rounded-xl flex items-center justify-center">
                  <UserIcon className="text-gray-500 w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900">
                  {contacts.find(c => c.id === selectedContact)?.name}
                </h3>
              </div>
              <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50">
                {filteredMessages.map(m => (
                  <div key={m.id} className={cn(
                    "flex",
                    m.senderId === user.id ? "justify-end" : "justify-start"
                  )}>
                    <div className={cn(
                      "max-w-[70%] p-4 rounded-2xl text-sm",
                      m.senderId === user.id 
                        ? "bg-blue-600 text-white rounded-tr-none" 
                        : "bg-white text-gray-900 border border-gray-100 rounded-tl-none"
                    )}>
                      <p>{m.content}</p>
                      <p className={cn(
                        "text-[10px] mt-1 opacity-70",
                        m.senderId === user.id ? "text-blue-100" : "text-gray-400"
                      )}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSend} className="p-6 border-t border-gray-100 flex gap-3">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-grow px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Notifications Component ---
const Notifications = ({ user }: { user: User }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const data = await API.getNotifications(user.id);
      setNotifications(data.reverse());
    };
    fetchNotifications();
  }, [user.id]);

  const markAsRead = async (id: string) => {
    await API.markNotificationRead(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
          {notifications.filter(n => !n.isRead).length} New
        </span>
      </div>
      <div className="space-y-4">
        {notifications.map(n => (
          <div 
            key={n.id}
            onClick={() => markAsRead(n.id)}
            className={cn(
              "p-6 rounded-3xl border transition-all cursor-pointer",
              n.isRead ? "bg-white border-gray-100" : "bg-blue-50 border-blue-100 shadow-sm"
            )}
          >
            <div className="flex gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                n.type === 'application' ? "bg-green-100 text-green-600" :
                n.type === 'message' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
              )}>
                {n.type === 'application' ? <CheckCircle className="w-6 h-6" /> :
                 n.type === 'message' ? <MessageIcon className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{n.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{n.content}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-3">
                  {new Date(n.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Transaction History Component ---
const TransactionHistory = ({ user }: { user: User }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    API.getTransactions(user.id).then(data => setTransactions(data.reverse()));
  }, [user.id]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Transaction History</h1>
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-left">Description / Job</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(t.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{t.description}</p>
                    <p className="text-[10px] text-gray-400">ID: {t.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded-lg">
                      {t.type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-red-600">
                    -₹{t.amount}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-green-600 uppercase bg-green-50 px-2 py-1 rounded-lg">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="text-center py-20">
              <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">No transactions found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex">
        {user && <Sidebar user={user} onLogout={handleLogout} />}
        <main className={cn("flex-grow overflow-y-auto h-screen", !user && "w-full")}>
          <Routes>
            {!user ? (
              <>
                <Route path="/admin-login" element={<AdminLoginPage onLogin={setUser} />} />
                <Route path="*" element={<AuthPage onLogin={setUser} />} />
              </>
            ) : (
                <>
                {((user.role === 'worker' || user.role === 'recruiter') && !user.profile?.onboarded) ? (
                  <Route path="*" element={<Onboarding user={user} onComplete={setUser} />} />
                ) : (
                  <>
                    <Route path="/" element={
                      user.role === 'recruiter' ? <Navigate to="/recruiter" /> :
                      user.role === 'admin' ? <Navigate to="/admin" /> :
                      <Dashboard user={user} />
                    } />
                    <Route path="/profile" element={<ProfilePage user={user} onUpdate={setUser} />} />
                    
                    {user.role === 'worker' && (
                      <>
                        <Route path="/jobs" element={<WorkerPortal user={user} />} />
                        <Route path="/applications" element={<ApplicationsPage user={user} />} />
                        <Route path="/map" element={<MapView user={user} />} />
                      </>
                    )}
                    
                    {user.role === 'recruiter' && (
                      <Route path="/recruiter" element={<RecruiterPortal user={user} />} />
                    )}
                    
                    {user.role === 'admin' && (
                      <Route path="/admin" element={<AdminPortal />} />
                    )}

                    <Route path="/messages" element={<Messaging user={user} />} />
                    <Route path="/notifications" element={<Notifications user={user} />} />
                    <Route path="/transactions" element={<TransactionHistory user={user} />} />
                    
                    <Route path="*" element={<Navigate to="/" />} />
                  </>
                )}
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}
