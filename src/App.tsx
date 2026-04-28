/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import CryptoJS from 'crypto-js';
import {
  Users,
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Plus,
  Check,
  X,
  TrendingUp,
  DollarSign,
  Megaphone,
  Download,
  PlusCircle,
  ArrowUpRight,
  ShieldCheck,
  User,
  Lock,
  Mail,
  Search,
  ChevronRight,
  Filter,
  Calendar,
  AlertTriangle,
  Coins,
  Bell,
  BellDot,
  Key,
  Edit3,
  Menu,
  Camera,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type Role = 'ADMIN' | 'MEMBER';
type LoanStatus = 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Paid';
type LoanType = 'APL' | 'MPL' | 'EHL' | 'EPL';

interface UserData {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: Role;
  status: 'Active' | 'Inactive' | 'Pending' | 'Rejected';
  phone?: string;
  profile_image?: string;
}

interface Loan {
  id: string;
  member_id: string;
  member_name: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  created_at?: string;
}

interface Payment {
  id: string;
  member_id: string;
  member_name: string;
  loan_type: string;
  amount: number;
  date: string;
  created_at?: string;
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type?: string;
  loan_id?: string;
}

interface Announcement {
  id: string;
  title?: string;
  content: string;
  date: string;
  created_at?: string;
}

// --- Mock Data ---

const MOCK_USERS: UserData[] = [
  { id: '1', name: 'John Aganan', email: 'john@example.com', role: 'ADMIN', status: 'Active' },
  { id: '2', name: 'John Doe', email: 'johndoe@example.com', role: 'MEMBER', status: 'Active' },
  { id: '3', name: 'JC1', email: 'jc1@example.com', role: 'MEMBER', status: 'Active' },
  { id: '4', name: 'John', email: 'john_member@example.com', role: 'MEMBER', status: 'Active' },
  { id: 'admin', name: 'System Admin', email: 'admin', role: 'ADMIN', status: 'Active' },
  { id: 'member', name: 'System Member', email: 'member', role: 'MEMBER', status: 'Active' },
];

const MOCK_LOANS: Loan[] = [
  { id: 'L1', member_id: '3', member_name: 'jc1', type: 'APL', amount: 313, status: 'Active', date: '2026-04-23' },
  { id: 'L2', member_id: '2', member_name: 'john doe', type: 'MPL', amount: 100, status: 'Rejected', date: '2026-04-23' },
  { id: 'L3', member_id: '4', member_name: 'john', type: 'APL', amount: 2, status: 'Active', date: '2026-04-23' },
  { id: 'L4', member_id: '2', member_name: 'john doe', type: 'EHL', amount: 500, status: 'Pending', date: '2026-04-24' },
];

const MOCK_PAYMENTS: Payment[] = [
  { id: 'P1', member_id: '4', member_name: 'john', loan_type: 'APL', amount: 5, date: '2026-04-23' },
];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'A1', content: 'Cooperative meeting on Monday.', date: '2026-04-23' },
  { id: 'A2', content: 'Loan processing update.', date: '2026-04-23' },
];

const LOAN_TYPES = {
  APL: 'Agricultural Production Loan',
  MPL: 'Multi-Purpose Loan',
  EHL: 'Emergency Health Loan',
  EPL: 'Emergency Personal Loan',
};

// --- Components ---

const SidebarItem = ({ icon: Icon, label, id, currentView, setView, sidebarOpen, setSidebarOpen }: { icon: any, label: string, id: string, currentView: string, setView: (id: string) => void, sidebarOpen: boolean, setSidebarOpen?: (val: boolean) => void }) => (
  <button
    onClick={() => {
      setView(id);
      if (window.innerWidth < 1024 && setSidebarOpen) {
        setSidebarOpen(false);
      }
    }}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold text-sm ${currentView === id ? 'bg-white text-brand-700 shadow-lg scale-[1.02]' : 'text-white hover:bg-brand-600/40'
      } ${(!label && !sidebarOpen) ? 'justify-center' : ''}`}
  >
    <Icon size={18} className={`${currentView === id ? 'text-brand-700' : 'text-white'} shrink-0`} />
    {sidebarOpen && <span className="animate-in fade-in slide-in-from-left-1 duration-300">{label}</span>}
  </button>
);

const StatCard = ({ title, value, icon: Icon, borderColor = "border-green-500" }: { title: string, value: string, icon: any, borderColor?: string }) => (
  <div className={`metric-card p-3 ${borderColor}`}>
    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{title}</p>
    <p className="text-2xl font-black text-gray-800">{value}</p>
    <div className="flex items-center gap-2 mt-1">
      <Icon size={12} className="text-gray-400" />
      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Verified</span>
    </div>
  </div>
);

const SearchResultsDropdown = ({
  results,
  onSelect,
  onClose
}: {
  results: { loans: any[], members: any[], announcements: any[] },
  onSelect: (view: string, data?: any) => void,
  onClose: () => void
}) => {
  const hasResults = results.loans.length > 0 || results.members.length > 0 || results.announcements.length > 0;

  if (!hasResults) return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 text-center animate-in fade-in zoom-in-95 duration-200 z-50">
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <Search size={20} className="text-gray-300" />
      </div>
      <p className="text-sm font-bold text-gray-800">No results found</p>
      <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Try a different keyword</p>
    </div>
  );

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 max-h-[400px] overflow-y-auto custom-scrollbar">
      {results.members.length > 0 && (
        <div className="p-2">
          <div className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Members</div>
          {results.members.slice(0, 3).map(m => (
            <button key={m.id} onClick={() => { onSelect('members'); onClose(); }} className="w-full flex items-center gap-3 p-2 hover:bg-brand-50 rounded-xl transition-colors text-left group">
              <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-brand-700 font-bold text-xs group-hover:bg-brand-700 group-hover:text-white transition-colors">
                {m.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">{m.name}</p>
                <p className="text-[9px] text-gray-400">{m.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {results.loans.length > 0 && (
        <div className="p-2 border-t border-gray-50">
          <div className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Loans</div>
          {results.loans.slice(0, 3).map(l => (
            <button key={l.id} onClick={() => { onSelect('loans'); onClose(); }} className="w-full flex items-center gap-3 p-2 hover:bg-brand-50 rounded-xl transition-colors text-left group">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <FileText size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">{l.member_name} - {l.type}</p>
                <p className="text-[9px] text-gray-400">₱{l.amount.toLocaleString()} • {l.status}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {results.announcements.length > 0 && (
        <div className="p-2 border-t border-gray-50">
          <div className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Announcements</div>
          {results.announcements.slice(0, 3).map(a => (
            <div key={a.id} className="p-3 hover:bg-gray-50 rounded-xl transition-colors text-left">
              <div className="flex items-center gap-2 mb-1">
                <Megaphone size={12} className="text-brand-500" />
                <p className="text-[9px] font-black text-brand-600 uppercase tracking-tight">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
              <p className="text-[11px] font-bold text-gray-700 line-clamp-2">{a.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 bg-gray-50 text-center">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Press Enter for full results</p>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState<UserData | null>(() => {
    const saved = localStorage.getItem('nagco_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState(() => {
    return localStorage.getItem('nagco_view') || 'login';
  }); // login, dashboard, loans, reports, members
  const [loginSubView, setLoginSubView] = useState<'login' | 'forgot' | 'create' | 'reset' | 'otp'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'reset' && params.get('token')) return 'reset';
    return 'login';
  });
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [showReportPreview, setShowReportPreview] = useState(false);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };
  const [resetToken] = useState(() => new URLSearchParams(window.location.search).get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<UserData[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showViewAnnouncementModal, setShowViewAnnouncementModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showViewLoanModal, setShowViewLoanModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingMember, setEditingMember] = useState<UserData | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [requestType, setRequestType] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [calculation, setCalculation] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  useEffect(() => {
    if (user?.profile_image) {
      setProfileImage(user.profile_image);
    }
  }, [user?.profile_image]);

  // Handle mobile responsiveness for sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // Using 1024px for tablet/mobile threshold
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [showViewNotificationModal, setShowViewNotificationModal] = useState(false);
  const [showNoPendingModal, setShowNoPendingModal] = useState(false);
  const [noPendingActionType, setNoPendingActionType] = useState<'Approve' | 'Reject'>('Approve');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
  const [showResetTooltip, setShowResetTooltip] = useState(false);
  const [showProfileTooltip, setShowProfileTooltip] = useState(false);
  const [showSettingsTooltip, setShowSettingsTooltip] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('nagco_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('nagco_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('nagco_view', view);
  }, [view]);

  // --- Auth Logic ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: CryptoJS.SHA256(loginPass).toString() }),
      });
      const data = await response.json();

      // Artificial delay for smooth loading transition
      await new Promise(resolve => setTimeout(resolve, 1200));

      if (response.ok) {
        if (data.requires_otp) {
          setLoginSubView('otp');
          return;
        }
        setUser(data.user);
        setView('dashboard');
        addToast(`Welcome back, ${data.user.name}!`, 'success');
      } else {
        addToast(data.error || 'Login failed', 'error');
      }
    } catch (err) {
      addToast('Network error. Is the server running?', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, otp: otpCode }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setView('dashboard');
        setLoginSubView('login');
        setOtpCode('');
        addToast(`Login successful! Welcome back, ${data.user.name}!`, 'success');
      } else {
        addToast(data.error || 'Verification failed', "error");
      }
    } catch (err) {
      addToast('Connection error. Please try again.', "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerPassword !== registerConfirmPassword) {
      addToast('Passwords do not match', "error");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(registerPassword)) {
      addToast('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character (!@#$%^&*)', "error");
      return;
    }
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerFullName,
          username: registerUsername,
          email: registerEmail,
          password: CryptoJS.SHA256(registerPassword).toString()
        }),
      });
      const data = await response.json();
      if (response.ok) {
        addToast('Request completed! Please wait for administrator approval for your account.', "success");
        setLoginSubView('login');
        // Clear registration states
        setRegisterFullName('');
        setRegisterUsername('');
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterConfirmPassword('');
      } else {
        addToast(data.error || 'Registration failed', "error");
      }
    } catch (err) {
      addToast('Network error. Is the server running?', "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nagco_user');
    localStorage.removeItem('nagco_token');
    setUser(null);
    setView('login');
    setLoginSubView('login');
    addToast('Successfully logged out', 'success');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail, frontendUrl: window.location.origin }),
      });
      const data = await response.json();
      if (response.ok) {
        addToast('Password reset link sent! Please check your email.', "success");
        setLoginSubView('login');
      } else {
        addToast(data.message || 'Error sending reset link.', "error");
      }
    } catch (err) {
      addToast('Network error. Is the server running?', "error");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword: CryptoJS.SHA256(newPassword).toString() }),
      });
      const data = await response.json();
      if (response.ok) {
        addToast('Password reset successful! You can now log in.', "success");
        setLoginSubView('login');
        window.history.replaceState({}, document.title, window.location.pathname);
        setNewPassword('');
      } else {
        addToast(data.error || 'Failed to reset password.', "error");
      }
    } catch (err) {
      addToast('Network error. Is the server running?', "error");
    } finally {
      setForgotLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const membersRes = await fetch('/api/members');
      const membersData = await membersRes.json();
      if (membersRes.ok) setMembers(membersData.members);

      const loansRes = await fetch('/api/loans');
      const loansData = await loansRes.json();
      if (loansRes.ok) setLoans(loansData.loans);

      const paymentsRes = await fetch('/api/payments');
      const paymentsData = await paymentsRes.json();
      if (paymentsRes.ok) setPayments(paymentsData.payments);

      const annRes = await fetch('/api/announcements');
      const annData = await annRes.json();
      if (annRes.ok) setAnnouncements(annData.announcements);

      if (user) {
        const notifRes = await fetch(`/api/notifications/${user.id}`);
        const notifData = await notifRes.json();
        if (notifRes.ok) {
          const formattedNotifs: AppNotification[] = notifData.notifications.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: new Date(n.created_at).toLocaleDateString() + ' ' + new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: !n.is_read,
            type: n.type
          }));
          setNotifications(formattedNotifs);
        }
      }
    } catch (err) {
      console.error('Data fetch error:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleUpdateMemberStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/members/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setMembers(prev => prev.map(m => m.id === id ? { ...m, status: status as any } : m));
        addToast(`Member status updated to ${status}`, "success");
      } else {
        addToast('Failed to update status', "error");
      }
    } catch (err) {
      addToast('Network error', "error");
    }
  };

  const handleUpdateMemberRole = async (id: string, role: string) => {
    try {
      const response = await fetch(`/api/members/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (response.ok) {
        setMembers(prev => prev.map(m => m.id === id ? { ...m, role: role as any } : m));
        addToast(`Role updated to ${role}`, "success");
      } else {
        addToast('Failed to update role', "error");
      }
    } catch (err) {
      addToast('Network error', "error");
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return;
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setMembers(prev => prev.filter(m => m.id !== id));
        addToast('Member deleted successfully', "success");
      } else {
        addToast('Failed to delete member', "error");
      }
    } catch (err) {
      addToast('Network error', "error");
    }
  };

  const handleUpdateLoanStatus = async (id: string, status: string) => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/loans/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setLoans(prev => prev.map(l => l.id === id ? { ...l, status } : l));
        addToast(`Loan ${status === 'Active' ? 'approved' : 'rejected'} successfully.`, "success");
        fetchData();
      } else {
        addToast('Failed to update loan status', "error");
      }
    } catch (err) {
      addToast('Network error', "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleBulkAction = async (status: string) => {
    try {
      const pendingSelectedIds = selectedLoanIds.filter(id => {
        const loan = loans.find(l => l.id === id);
        return loan?.status === 'Pending';
      });

      if (pendingSelectedIds.length === 0) {
        setNoPendingActionType(status === 'Active' ? 'Approve' : 'Reject');
        setShowNoPendingModal(true);
        return;
      }

      if (!confirm(`Are you sure you want to bulk ${status === 'Active' ? 'Approve' : 'Reject'} ${pendingSelectedIds.length} pending loans?`)) {
        return;
      }

      setIsUpdatingStatus(true);
      const results = await Promise.all(
        pendingSelectedIds.map(id => 
          fetch(`/api/loans/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          })
        )
      );
      
      const allSuccess = results.every(res => res.ok);
      if (allSuccess) {
        setLoans(prev => prev.map(l => pendingSelectedIds.includes(l.id) ? { ...l, status } : l));
        addToast(`Successfully processed ${pendingSelectedIds.length} pending loans`, "success");
        setSelectedLoanIds([]);
        fetchData();
      } else {
        addToast('Some loans could not be processed', "error");
        fetchData();
      }
    } catch (err) {
      addToast('Network error', "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const response = await fetch(`/api/members/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          phone: user.phone,
          profile_image: profileImage
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        addToast('Profile updated successfully!', "success");
      } else {
        addToast(data.error || 'Failed to update profile', "error");
      }
    } catch (err) {
      addToast('Network error', "error");
    }
  };

  const handleBulkMemberAction = async (status: string) => {
    try {
      if (!confirm(`Are you sure you want to bulk set ${selectedMemberIds.length} members to ${status}?`)) {
        return;
      }
      const results = await Promise.all(
        selectedMemberIds.map(id => 
          fetch(`/api/members/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          })
        )
      );
      
      const allSuccess = results.every(res => res.ok);
      if (allSuccess) {
        setMembers(prev => prev.map(m => selectedMemberIds.includes(m.id) ? { ...m, status: status as UserData['status'] } : m));
        addToast(`Successfully processed ${selectedMemberIds.length} members`, "success");
        setSelectedMemberIds([]);
      } else {
        addToast('Some members could not be processed', "error");
        fetchData();
      }
    } catch (err) {
      addToast('Network error', "error");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const response = await fetch(`/api/members/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: CryptoJS.SHA256(currentPassword).toString(),
          newPassword: CryptoJS.SHA256(newPassword).toString()
        }),
      });
      const data = await response.json();
      if (response.ok) {
        addToast('Password changed successfully!', "success");
        setCurrentPassword('');
        setNewPassword('');
      } else {
        addToast(data.error || 'Failed to change password', "error");
      }
    } catch (err) {
      addToast('Network error', "error");
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const publishDate = formData.get('publishDate') as string;
    const publishTime = formData.get('publishTime') as string;

    // Combine date and time
    const fullPublishDate = `${publishDate}T${publishTime || '00:00'}`;

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          content, 
          start_date: fullPublishDate,
          end_date: fullPublishDate // Using same for both to satisfy backend
        }),
      });
      if (response.ok) {
        addToast('Notice posted successfully!', "success");
        setShowAnnouncementModal(false);
        fetchData();
      } else {
        addToast('Failed to post notice', "error");
      }
    } catch (err) {
      addToast('Network error', "error");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchData();
        addToast('Announcement deleted successfully', "success");
      } else {
        addToast('Failed to delete announcement', "error");
      }
    } catch (err) {
      addToast('Network error', "error");
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const memberId = formData.get('memberId') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const loanType = formData.get('loanType') as string;

    const member = members.find(m => m.id === memberId);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          member_name: member?.name || 'Unknown',
          loan_type: loanType,
          amount
        }),
      });
      if (response.ok) {
        addToast('Payment recorded successfully!', "success");
        // Refresh payments
        const pRes = await fetch('/api/payments');
        const pData = await pRes.json();
        setPayments(pData.payments);
        form.reset();
      } else {
        addToast('Failed to record payment', "error");
      }
    } catch (err) {
      addToast('Network error', "error");
    }
  };

  const handleLoanRequest = async () => {
    if (!calculation || !user) return;
    setIsSubmittingLoan(true);
    try {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: user.id,
          member_name: user.name,
          type: requestType,
          amount: parseFloat(requestAmount)
        }),
      });

      // Nice artificial delay for professional feel
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (response.ok) {
        setShowSuccessAnimation(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setShowSuccessAnimation(false);

        addToast('Loan request submitted successfully!', "success");
        setShowRequestModal(false);
        setCalculation(null);
        setRequestAmount('');
        setRequestType('');
        // Refresh loans
        const lRes = await fetch('/api/loans');
        const lData = await lRes.json();
        setLoans(lData.loans);
      } else {
        addToast('Failed to submit loan request', "error");
      }
    } catch (err) {
      addToast('Network error', "error");
    } finally {
      setIsSubmittingLoan(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => n.unread);
      await Promise.all(
        unreadNotifs.map(n => fetch(`/api/notifications/${n.id}/read`, { method: 'PUT' }))
      );
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    setSelectedNotification(notif);
    setShowViewNotificationModal(true);

    // Mark as read locally and on server
    if (notif.unread) {
      try {
        await fetch(`/api/notifications/${notif.id}/read`, { method: 'PUT' });
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
      } catch (error) {
        console.error('Failed to mark notification as read', error);
      }
    }

    // Navigate based on type
    if (user?.role === 'ADMIN') {
      if (notif.type === 'LOAN_REQUEST' || notif.title.includes('Loan')) {
        setView('loans');
      } else if (notif.type === 'ACCOUNT_APPROVAL' || notif.type === 'ACCOUNT_REJECTION') {
        setView('members');
      }
    } else {
      // Member view
      if (notif.type === 'LOAN_STATUS' || notif.title.includes('Loan')) {
        setView('dashboard');
      }
    }

    setShowNotifications(false);
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent opening the notification details modal
    try {
      const response = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        addToast('Notification deleted', 'success');
      }
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  };

  const handleGenerateReport = () => {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [46, 125, 50]; // #2E7D32

    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('NAgCO LOAN MANAGEMENT SYSTEM', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Napilihan Agriculture Cooperative — Financial Summary Report', 105, 28, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 34, { align: 'center' });

    // Financial Summary Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCIAL OVERVIEW', 14, 55);

    autoTable(doc, {
      startY: 60,
      head: [['Metric', 'Value']],
      body: [
        ['Total Active Loans', stats.totalActiveLoans.toString()],
        ['Monthly Collections', `PHP ${stats.totalCollectionMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
        ['Total Capital Released', `PHP ${stats.totalReleased.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
        ['Collection Goal Achievement', `${stats.goalAchievement.toFixed(1)}%`]
      ],
      headStyles: { fillColor: primaryColor },
      theme: 'striped'
    });

    // Loan Type Breakdown Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LOAN TYPE BREAKDOWN', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Type', 'Description', 'Active', 'Released', 'Collected']],
      body: Object.entries(LOAN_TYPES).map(([type, label]) => [
        type,
        label,
        stats.breakdown[type].count.toString(),
        `PHP ${stats.breakdown[type].released.toLocaleString()}`,
        `PHP ${stats.breakdown[type].collections.toLocaleString()}`
      ]),
      headStyles: { fillColor: primaryColor },
      styles: { fontSize: 8 }
    });

    // Active Loans Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTIVE LOAN ACCOUNTS', 14, (doc as any).lastAutoTable.finalY + 15);

    const activeLoans = loans.filter(l => l.status === 'Active');
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['ID', 'Member Name', 'Type', 'Amount', 'Date']],
      body: activeLoans.map(l => [
        l.id,
        l.member_name,
        l.type,
        `PHP ${l.amount.toLocaleString()}`,
        l.date || 'N/A'
      ]),
      headStyles: { fillColor: primaryColor },
      styles: { fontSize: 9 }
    });

    // Payments Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RECENT COLLECTIONS', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['ID', 'Member', 'Loan Type', 'Amount Paid', 'Date']],
      body: payments.slice(0, 10).map(p => [
        p.id,
        p.member_name,
        p.loan_type,
        `PHP ${p.amount.toLocaleString()}`,
        p.date
      ]),
      headStyles: { fillColor: primaryColor },
      styles: { fontSize: 9 }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `NAgCO Confidential Report — Page ${i} of ${pageCount}`,
        105,
        285,
        { align: 'center' }
      );
    }

    doc.save(`NAgCO_Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // --- Derived Data ---
  const stats = useMemo(() => {
    const totalActiveLoans = loans.filter(l => l.status === 'Active').length;
    const totalCollectionMonth = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalReleased = loans.filter(l => l.status === 'Active' || l.status === 'Approved').reduce((acc, l) => acc + l.amount, 0);
    const monthlyGoal = 500000;
    const goalAchievementRaw = (totalCollectionMonth / monthlyGoal) * 100;
    const goalAchievement = Math.min(goalAchievementRaw, 100);

    const breakdown = Object.keys(LOAN_TYPES).reduce((acc, type) => {
      acc[type] = {
        released: loans.filter(l => l.type === type && (l.status === 'Active' || l.status === 'Approved')).reduce((sum, l) => sum + l.amount, 0),
        collections: payments.filter(p => p.loan_type === type).reduce((sum, p) => sum + p.amount, 0),
        count: loans.filter(l => l.type === type && l.status === 'Active').length
      };
      return acc;
    }, {} as Record<string, { released: number; collections: number; count: number }>);

    return { totalActiveLoans, totalCollectionMonth, totalReleased, monthlyGoal, goalAchievement, breakdown };
  }, [loans, payments]);

  const filteredLoans = useMemo(() => {
    let results = loans;
    if (globalSearch) {
      const s = globalSearch.toLowerCase();
      results = loans.filter(l =>
        l.id.toString().toLowerCase().includes(s) ||
        l.type.toLowerCase().includes(s) ||
        l.member_name?.toLowerCase().includes(s) ||
        LOAN_TYPES[l.type as keyof typeof LOAN_TYPES]?.toLowerCase().includes(s) ||
        l.status.toLowerCase().includes(s)
      );
    }
    
    return [...results].sort((a, b) => {
      // Prioritize Pending (Top)
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      
      // Deprioritize Rejected (Bottom)
      if (a.status === 'Rejected' && b.status !== 'Rejected') return 1;
      if (a.status !== 'Rejected' && b.status === 'Rejected') return -1;
      
      const dateA = new Date(a.created_at || a.date).getTime();
      const dateB = new Date(b.created_at || b.date).getTime();
      return dateB - dateA;
    });
  }, [loans, globalSearch]);

  const filteredMembers = useMemo(() => {
    if (!globalSearch) return members;
    const s = globalSearch.toLowerCase();
    return members.filter(m =>
      m.name.toLowerCase().includes(s) ||
      m.email.toLowerCase().includes(s) ||
      m.role.toLowerCase().includes(s)
    );
  }, [members, globalSearch]);

  const filteredPayments = useMemo(() => {
    if (!globalSearch) return payments;
    const s = globalSearch.toLowerCase();
    return payments.filter(p =>
      p.id.toString().toLowerCase().includes(s) ||
      p.member_name?.toLowerCase().includes(s) ||
      p.loan_type.toLowerCase().includes(s) ||
      p.amount.toString().includes(s)
    );
  }, [payments, globalSearch]);

  const filteredAnnouncements = useMemo(() => {
    if (!globalSearch) return announcements;
    const s = globalSearch.toLowerCase();
    return announcements.filter(a =>
      a.content.toLowerCase().includes(s) ||
      (a.title && a.title.toLowerCase().includes(s)) ||
      new Date(a.created_at || a.date).toLocaleDateString().includes(s)
    );
  }, [announcements, globalSearch]);

  if (view === 'login') {
    return (
      <>
        <div className="min-h-screen bg-white sm:bg-[#4CAF50] flex items-center justify-center sm:p-4 font-sans relative overflow-hidden">


          <AnimatePresence>
            {loginLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-[#2E7D32] flex flex-col items-center justify-center"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 border-4 border-white/20 border-t-white rounded-full"
                  />
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <img src="/logo.png" alt="Logo" className="w-12 h-12" />
                  </motion.div>
                </div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 text-center"
                >
                  <h3 className="text-white font-black text-xl uppercase tracking-widest mb-2">Securing Connection</h3>
                  <div className="flex gap-1 justify-center">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-2 h-2 bg-white rounded-full"
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full sm:max-w-md h-full sm:h-auto relative z-10">
            <AnimatePresence mode="wait">
              {loginSubView === 'login' && (
                <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white px-6 py-12 sm:p-8 sm:rounded-2xl sm:shadow-2xl h-full sm:h-auto flex flex-col">
                  <div className="text-center mb-10 sm:mb-8">
                    <img src="/logo.png" alt="NAgCO" className="w-24 h-24 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full border border-gray-100 shadow-sm object-contain p-1 bg-white" />
                    <h1 className="text-3xl sm:text-2xl font-bold text-[#2E7D32] leading-tight mb-2">NAgCO</h1>
                    <p className="text-base sm:text-sm text-gray-500 font-medium">Napilihan Agriculture Cooperative</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 ml-1">Email or Username</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2E7D32] transition-colors" size={16} />
                        <input
                          type="text"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#2E7D32] outline-none text-sm text-gray-700 transition-all"
                          placeholder="Enter email or username"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 ml-1">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2E7D32] transition-colors" size={16} />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={loginPass}
                          onChange={(e) => setLoginPass(e.target.value)}
                          className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#2E7D32] outline-none text-sm text-gray-700 transition-all"
                          placeholder="Enter password"
                          required
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2E7D32] hover:text-[#1B5E20]">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <div className="flex justify-end">
                        <button type="button" onClick={() => setLoginSubView('forgot')} className="text-xs font-semibold text-[#2E7D32] hover:underline">Forgot Password?</button>
                      </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-[#2E7D32] text-white rounded-xl font-bold text-base shadow-md hover:bg-[#1B5E20] transition-all active:scale-[0.98] mt-4">
                      Log In
                    </button>

                    <div className="text-center pt-6 mt-auto sm:mt-4">
                      <p className="text-xs font-medium text-gray-600">
                        Don't have an account? <button type="button" onClick={() => setLoginSubView('create')} className="text-[#2E7D32] font-bold hover:underline">Create Account</button>
                      </p>
                    </div>
                  </form>
                </motion.div>
              )}

              {loginSubView === 'otp' && (
                <motion.div key="otp" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white px-6 py-12 sm:p-8 sm:rounded-2xl sm:shadow-2xl h-full sm:h-auto flex flex-col">
                  <div className="text-center mb-10">
                    <img src="/logo.png" alt="NAgCO" className="w-20 h-20 mx-auto mb-6 rounded-full border border-gray-100 shadow-sm object-contain p-1 bg-white" />
                    <h2 className="text-2xl font-bold text-gray-800">Verify Identity</h2>
                    <p className="text-base text-gray-500 mt-2">We've sent a 6-digit code to your email.</p>
                  </div>

                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div className="flex justify-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center py-4 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2E7D32] outline-none text-2xl font-bold tracking-[0.5em] text-[#2E7D32] transition-all"
                        placeholder="000000"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={otpLoading || otpCode.length !== 6}
                      className="w-full py-3.5 bg-[#2E7D32] text-white rounded-lg font-bold text-sm shadow-md hover:bg-[#1B5E20] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {otpLoading ? "Verifying..." : "Verify & Continue"}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setLoginSubView('login')}
                        className="text-xs font-bold text-[#2E7D32] hover:underline"
                      >
                        Cancel and Go Back
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {loginSubView === 'create' && (
                <motion.div key="create" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white px-6 py-12 sm:p-8 sm:rounded-2xl sm:shadow-2xl h-full sm:h-auto flex flex-col overflow-y-auto custom-scrollbar">
                  <div className="text-center mb-10">
                    <img src="/logo.png" alt="NAgCO" className="w-20 h-20 mx-auto mb-6 rounded-full border border-gray-100 shadow-sm object-contain p-1 bg-white" />
                    <h1 className="text-2xl font-bold text-[#2E7D32] mb-2">Create Account</h1>
                    <p className="text-base text-gray-500">Join our cooperative today</p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 ml-1">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2E7D32] transition-colors" size={16} />
                        <input type="text" value={registerFullName} onChange={(e) => setRegisterFullName(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#2E7D32] outline-none text-sm text-gray-700 transition-all" placeholder="Enter your full name" required />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 ml-1">Username</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2E7D32] transition-colors" size={16} />
                        <input type="text" value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#2E7D32] outline-none text-sm text-gray-700 transition-all" placeholder="Choose a username" required />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2E7D32] transition-colors" size={16} />
                        <input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#2E7D32] outline-none text-sm text-gray-700 transition-all" placeholder="Enter your email" required />
                      </div>
                    </div>
                    <div className="space-y-1.5 relative">
                      <label className="text-xs font-semibold text-gray-700 ml-1 flex items-center gap-1">
                        Password
                        <AlertCircle
                          size={12}
                          className="text-gray-500 hover:text-gray-700 transition-colors cursor-help"
                          onMouseEnter={() => setShowPasswordTooltip(true)}
                          onMouseLeave={() => setShowPasswordTooltip(false)}
                        />
                      </label>
                      {showPasswordTooltip && (
                        <div className="absolute top-6 left-1 bg-white text-black text-xs rounded p-2 z-10 w-64 shadow-lg border">
                          <p className="font-bold mb-1 text-green-600">Password Requirements:</p>
                          <div className="space-y-1">
                            <div className={`flex items-center gap-1 ${registerPassword.length >= 8 ? 'text-green-400' : 'text-gray-400'}`}>
                              <Check size={8} /> At least 8 characters
                            </div>
                            <div className={`flex items-center gap-1 ${/[A-Z]/.test(registerPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                              <Check size={8} /> At least 1 uppercase letter
                            </div>
                            <div className={`flex items-center gap-1 ${/[a-z]/.test(registerPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                              <Check size={8} /> At least 1 lowercase letter
                            </div>
                            <div className={`flex items-center gap-1 ${/\d/.test(registerPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                              <Check size={8} /> At least 1 number (0-9)
                            </div>
                            <div className={`flex items-center gap-1 ${/[!@#$%^&*]/.test(registerPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                              <Check size={8} /> At least 1 special character (!@#$%^&*)
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2E7D32] transition-colors" size={16} />
                        <input type={showRegisterPassword ? "text" : "password"} value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#2E7D32] outline-none text-sm text-gray-700 transition-all" placeholder="••••••••" required />
                        <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2E7D32] hover:text-[#1B5E20] transition-colors">{showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 ml-1">Confirm Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2E7D32] transition-colors" size={16} />
                        <input type={showConfirmPassword ? "text" : "password"} value={registerConfirmPassword} onChange={(e) => setRegisterConfirmPassword(e.target.value)} className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#2E7D32] outline-none text-sm text-gray-700 transition-all" placeholder="••••••••" required />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2E7D32] hover:text-[#1B5E20] transition-colors">{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 hidden">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Password Requirements:</p>
                      <div className="grid grid-cols-1 gap-1.5">
                        <div className={`flex items-center gap-2 text-[10px] font-bold ${registerPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                          {registerPassword.length >= 8 ? <Check size={10} strokeWidth={4} /> : <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-200" />}
                          At least 8 characters
                        </div>
                        <div className={`flex items-center gap-2 text-[10px] font-bold ${/[A-Z]/.test(registerPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                          {/[A-Z]/.test(registerPassword) ? <Check size={10} strokeWidth={4} /> : <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-200" />}
                          At least 1 uppercase letter
                        </div>
                        <div className={`flex items-center gap-2 text-[10px] font-bold ${/[a-z]/.test(registerPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                          {/[a-z]/.test(registerPassword) ? <Check size={10} strokeWidth={4} /> : <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-200" />}
                          At least 1 lowercase letter
                        </div>
                        <div className={`flex items-center gap-2 text-[10px] font-bold ${/\d/.test(registerPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                          {/\d/.test(registerPassword) ? <Check size={10} strokeWidth={4} /> : <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-200" />}
                          At least 1 number (0-9)
                        </div>
                        <div className={`flex items-center gap-2 text-[10px] font-bold ${/[!@#$%^&*]/.test(registerPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                          {/[!@#$%^&*]/.test(registerPassword) ? <Check size={10} strokeWidth={4} /> : <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-200" />}
                          At least 1 special character (!@#$%^&*)
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-[#2E7D32] text-white rounded-xl font-bold text-base shadow-md hover:bg-[#1B5E20] transition-all active:scale-[0.98] mt-4">
                      Create Account
                    </button>
                    <div className="text-center pt-4">
                      <button type="button" onClick={() => setLoginSubView('login')} className="text-xs font-bold text-[#2E7D32] hover:underline">
                        Back to Login
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {loginSubView === 'forgot' && (
                <motion.div key="forgot" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white px-6 py-12 sm:p-8 sm:rounded-2xl sm:shadow-2xl h-full sm:h-auto flex flex-col">
                  <div className="text-center mb-10">
                    <img src="/logo.png" alt="NAgCO" className="w-20 h-20 mx-auto mb-6 rounded-full border border-gray-100 shadow-sm object-contain p-1 bg-white" />
                    <h2 className="text-2xl font-bold text-gray-800">Recovery</h2>
                    <p className="text-base text-gray-500 mt-2">Enter your email to receive a reset link.</p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-700 ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2E7D32] transition-colors" size={16} />
                        <input
                          type="email"
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2E7D32] outline-none text-sm text-gray-700 transition-all"
                          placeholder="name@example.com"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full py-3.5 bg-[#2E7D32] text-white rounded-lg font-bold text-sm shadow-md hover:bg-[#1B5E20] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {forgotLoading ? "Sending..." : "Send Reset Link"}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setLoginSubView('login')}
                        className="text-xs font-bold text-[#2E7D32] hover:underline"
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {loginSubView === 'reset' && (
                <motion.div key="reset" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white px-6 py-12 sm:p-8 sm:rounded-2xl sm:shadow-2xl h-full sm:h-auto flex flex-col overflow-y-auto">
                  <div className="text-center mb-10">
                    <img src="/logo.png" alt="NAgCO" className="w-20 h-20 mx-auto mb-6 rounded-full border border-gray-100 shadow-sm object-contain p-1 bg-white" />
                    <h2 className="text-2xl font-bold text-gray-800">New Password</h2>
                    <p className="text-base text-gray-500 mt-2">Create a secure password for your account.</p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="space-y-2 relative">
                      <label className="text-xs font-semibold text-gray-700 ml-1 flex items-center gap-1">
                        New Password
                        <AlertCircle
                          size={12}
                          className="text-gray-500 hover:text-gray-700 transition-colors cursor-help"
                          onMouseEnter={() => setShowResetTooltip(true)}
                          onMouseLeave={() => setShowResetTooltip(false)}
                        />
                      </label>
                      {showResetTooltip && (
                        <div className="absolute top-6 left-1 bg-white text-black text-xs rounded p-2 z-10 w-64 shadow-lg border">
                          <p className="font-bold mb-1 text-green-600">Password Requirements:</p>
                          <div className="space-y-1">
                            <div className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-green-400' : 'text-gray-400'}`}>
                              <Check size={8} /> At least 8 characters
                            </div>
                            <div className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                              <Check size={8} /> At least 1 uppercase letter
                            </div>
                            <div className={`flex items-center gap-1 ${/[a-z]/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                              <Check size={8} /> At least 1 lowercase letter
                            </div>
                            <div className={`flex items-center gap-1 ${/\d/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                              <Check size={8} /> At least 1 number (0-9)
                            </div>
                            <div className={`flex items-center gap-1 ${/[!@#$%^&*]/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                              <Check size={8} /> At least 1 special character (!@#$%^&*)
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2E7D32] transition-colors" size={16} />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-12 pr-5 py-4 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2E7D32] outline-none text-sm text-gray-700 transition-all"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full py-3.5 bg-[#2E7D32] text-white rounded-lg font-bold text-sm shadow-md hover:bg-[#1B5E20] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {forgotLoading ? "Resetting..." : "Update Password"}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Toast Notification System for Login/Logout Visibility */}
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
          <AnimatePresence>
            {toasts.map(toast => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-xl shadow-2xl border flex items-center gap-3 ${toast.type === 'success' ? 'bg-white border-green-100 text-green-800' :
                    toast.type === 'error' ? 'bg-white border-red-100 text-red-800' :
                      'bg-white border-blue-100 text-blue-800'
                  }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-50' :
                    toast.type === 'error' ? 'bg-red-50' :
                      'bg-blue-50'
                  }`}>
                  {toast.type === 'success' ? <CheckCircle className="text-green-600" size={20} /> :
                    toast.type === 'error' ? <XCircle className="text-red-600" size={20} /> :
                      <AlertCircle className="text-blue-600" size={20} />}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">
                    {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Notification'}
                  </p>
                  <p className="text-sm font-bold leading-tight">{toast.message}</p>
                </div>
                <button
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </>
    );
  }

  const renderAdminView = () => (
    <div className="pov-110-container">
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar */}
        {/* Sidebar Overlay for Mobile */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={`fixed lg:relative z-40 bg-brand-700 text-white flex flex-col h-full border-r border-brand-800 shrink-0 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}`}>
          <div className="p-4 flex items-center gap-3 overflow-hidden border-b border-brand-800/30">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 p-1">
              <img src="/logo.png" alt="NAgCO" className="w-full h-full object-contain" />
            </div>
            {sidebarOpen && <span className="font-bold text-xs leading-tight whitespace-normal w-[160px] animate-in fade-in slide-in-from-left-2">NAgCO Loan Management System</span>}
          </div>

          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" id="dashboard" currentView={view} setView={setView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <SidebarItem icon={FileText} label="Loan Management" id="loans" currentView={view} setView={setView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <SidebarItem icon={TrendingUp} label="Reports" id="reports" currentView={view} setView={setView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <SidebarItem icon={Users} label="Members" id="members" currentView={view} setView={setView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <SidebarItem icon={User} label="Profile" id="profile" currentView={view} setView={setView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          </nav>

          <div className="p-3 border-t border-brand-800/30 mt-auto">
            {sidebarOpen && (
              <div className="mb-3 flex items-center gap-2 px-1 py-2 bg-brand-800/20 rounded-lg">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-brand-600 shadow-sm" />
                ) : (
                  <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-[10px] font-black text-white border-2 border-brand-500 shadow-sm">
                    {user?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black truncate leading-tight text-white">{user?.email}</p>
                  <p className="text-[8px] text-brand-300 font-bold uppercase tracking-widest leading-none mt-1">{user?.role}</p>
                </div>
              </div>
            )}
            <button onClick={handleLogout} className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-red-500/20 text-red-100 transition-colors font-bold text-xs">
              <LogOut size={18} className="text-white" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="bg-white border-b border-gray-200 shrink-0 relative z-30">
            <div className="h-16 flex items-center justify-between px-4 sm:px-8">
              <div className="flex items-center gap-4 flex-1 max-w-xl">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                  <Menu size={20} />
                </button>

                {/* Desktop Search Bar */}
                <div className="relative flex-1 hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Search members, loans, or reports..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-700 outline-none transition-all shadow-sm"
                  />
                  {globalSearch && (
                    <SearchResultsDropdown
                      results={{ loans: filteredLoans, members: filteredMembers, announcements: filteredAnnouncements }}
                      onSelect={setView}
                      onClose={() => setGlobalSearch('')}
                    />
                  )}
                </div>

                {/* Mobile Search Toggle */}
                <button
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className="sm:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                  {isSearchExpanded ? <X size={20} /> : <Search size={20} />}
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors relative"
                  >
                    {notifications.some(n => n.unread) ? <BellDot size={20} className="text-brand-600" /> : <Bell size={20} />}
                    {notifications.filter(n => n.unread).length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full min-w-[14px] h-[14px] flex items-center justify-center border border-white">
                        {notifications.filter(n => n.unread).length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                          <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Notifications</h3>
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-[10px] font-bold text-brand-700 hover:underline uppercase tracking-tight"
                          >
                            Mark all as read
                          </button>
                        </div>
                        <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
                          {notifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => handleNotificationClick(n)}
                              className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer relative group/notif ${n.unread ? 'bg-brand-50/30' : ''}`}
                            >
                              <p className="text-xs font-black text-gray-800 mb-1 flex items-center justify-between pr-6">
                                {n.title}
                                {n.unread && <span className="w-1.5 h-1.5 bg-brand-600 rounded-full"></span>}
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-1 pr-6">{n.message}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{n.time}</p>
                              
                              <button 
                                onClick={(e) => handleDeleteNotification(e, n.id)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/notif:opacity-100"
                                title="Delete notification"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => setShowAnnouncementModal(true)}
                    className="px-3 sm:px-4 py-2 bg-brand-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-brand-800 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Plus size={14} /> <span className="hidden sm:inline">New Announcement</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Search Bar Row */}
            <AnimatePresence>
              {isSearchExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="sm:hidden px-4 pb-4 overflow-visible border-t border-gray-100 bg-white"
                >
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      autoFocus
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-brand-700 outline-none transition-all shadow-sm"
                    />
                    {globalSearch && (
                      <SearchResultsDropdown
                        results={{ loans: filteredLoans, members: filteredMembers, announcements: filteredAnnouncements }}
                        onSelect={setView}
                        onClose={() => { setGlobalSearch(''); setIsSearchExpanded(false); }}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 font-sans">
            {view === 'dashboard' && (
              <div className="space-y-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-widest mb-2">Welcome, {user?.name}</h2>
                    <p className="text-sm font-bold text-gray-500">This is your dashboard.</p>
                  </div>
                  <button onClick={() => { setView('reports'); setShowReportPreview(true); }} className="px-4 py-2 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-brand-100 transition-all active:scale-95 flex items-center gap-2">
                    <Download size={14} /> Generate PDF
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <StatCard title="Total Active Loans" value={stats.totalActiveLoans.toString()} icon={FileText} borderColor="border-brand-500" />
                  <StatCard title="Total Collection" value={`₱ ${stats.totalCollectionMonth.toLocaleString()}`} icon={Coins} borderColor="border-brand-600" />
                  <div className="metric-card border-brand-800 bg-brand-700 relative overflow-hidden group shadow-[0_4px_15px_rgba(21,128,61,0.15)] p-3 h-full">
                    <div className="relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[9px] font-black text-black uppercase tracking-widest mb-0.5">Active Notices</p>
                          <p className="text-3xl font-black text-black">{announcements.length}</p>
                        </div>
                        <Megaphone size={20} className="text-white opacity-50" />
                      </div>
                      <div className="mt-2 pt-2 border-t border-brand-600">
                        <p className="text-[9px] font-bold text-black uppercase tracking-tight mb-0.5">Latest Update:</p>
                        <p className="text-xs font-medium text-black line-clamp-1 italic">
                          {announcements.length > 0 ? `"${announcements[0].content}"` : "No announcements yet."}
                        </p>
                      </div>
                      <button
                        onClick={() => setView('reports')}
                        className="mt-4 w-full px-4 py-2 bg-[#2E7D32] text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:bg-[#1B5E20] active:scale-95"
                      >
                        Management System →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="col-span-2 space-y-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden mb-8">
                      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-4">
                          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Recent Loan Requests</h2>
                          <AnimatePresence>
                            {selectedLoanIds.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-2"
                              >
                                <button 
                                  onClick={() => handleBulkAction('Active')} 
                                  className="px-3 py-1 bg-brand-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand-800 transition-all active:scale-95 shadow-md shadow-brand-100"
                                >
                                  Bulk Approve
                                </button>
                                <button 
                                  onClick={() => handleBulkAction('Reject')} 
                                  className="px-3 py-1 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 shadow-md shadow-red-100"
                                >
                                  Bulk Reject
                                </button>
                                <button onClick={() => setSelectedLoanIds([])} className="p-1 text-gray-400 hover:text-gray-600"><X size={12} /></button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <span className="text-[10px] font-black bg-brand-50 text-brand-700 px-2 py-1 rounded border border-brand-100 uppercase tracking-widest">Real-time</span>
                      </div>
                      <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                            <tr>
                              <th className="px-6 py-4 w-10 bg-gray-50">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-600"
                                  checked={selectedLoanIds.length > 0 && selectedLoanIds.length === filteredLoans.filter(l => l.status === 'Pending').length}
                                  onChange={(e) => {
                                    const pendingLoans = filteredLoans.filter(l => l.status === 'Pending');
                                    if (e.target.checked) {
                                      if (pendingLoans.length === 0) {
                                        setNoPendingActionType('Approve'); // Default label for modal
                                        setShowNoPendingModal(true);
                                        e.preventDefault();
                                        return;
                                      }
                                      setSelectedLoanIds(pendingLoans.map(l => l.id));
                                    } else {
                                      setSelectedLoanIds([]);
                                    }
                                  }}
                                />
                              </th>
                              <th className="table-header-cell bg-gray-50">Member</th>
                              <th className="table-header-cell hidden md:table-cell bg-gray-50">Loan Type</th>
                              <th className="table-header-cell text-right bg-gray-50">Amount</th>
                              <th className="table-header-cell bg-gray-50">Status</th>
                              <th className="table-header-cell bg-gray-50">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredLoans.map((loan) => (
                              <tr key={loan.id} className={`${loan.status === 'Pending' ? 'bg-amber-50/30' : ''} ${selectedLoanIds.includes(loan.id) ? 'bg-brand-50/50' : ''} hover:bg-gray-50/50 transition-colors`}>
                                <td className="px-6 py-4">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-600"
                                    checked={selectedLoanIds.includes(loan.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        if (loan.status !== 'Pending') {
                                          setNoPendingActionType('Approve');
                                          setShowNoPendingModal(true);
                                          return;
                                        }
                                        setSelectedLoanIds(prev => [...prev, loan.id]);
                                      } else {
                                        setSelectedLoanIds(prev => prev.filter(id => id !== loan.id));
                                      }
                                    }}
                                  />
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-800">{loan.member_name}</td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                  <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-500 mr-2 uppercase">{loan.type}</span>
                                  <span className="text-gray-500 text-xs hidden sm:inline">{LOAN_TYPES[loan.type as keyof typeof LOAN_TYPES]}</span>
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-gray-700">₱ {loan.amount.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                  {loan.status === 'Pending' ? (
                                    <select 
                                      onChange={(e) => {
                                        if (e.target.value === 'Active') handleUpdateLoanStatus(loan.id, 'Active');
                                        if (e.target.value === 'Rejected') handleUpdateLoanStatus(loan.id, 'Rejected');
                                      }}
                                      className="bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border border-amber-200 outline-none cursor-pointer hover:bg-amber-100 transition-colors"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Active">Approve</option>
                                      <option value="Rejected">Reject</option>
                                    </select>
                                  ) : (
                                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                        loan.status === 'Active' ? 'bg-green-100 text-green-700' :
                                          loan.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                                      }`}>
                                      {loan.status}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <button 
                                    onClick={() => { setSelectedLoan(loan); setShowViewLoanModal(true); }}
                                    className="p-1 text-gray-400 hover:text-brand-700 transition-colors"
                                    title="View Details"
                                  >
                                    <Eye size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Member List Dashboard Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                        <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Registered Members</h2>
                        <button onClick={() => setView('members')} className="text-[9px] font-black text-brand-700 uppercase tracking-widest hover:bg-brand-50 px-2 py-1 rounded border border-brand-100 transition-all">Manage All</button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                              <th className="table-header-cell">Name</th>
                              <th className="table-header-cell">Email</th>
                              <th className="table-header-cell">Role</th>
                              <th className="table-header-cell">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredMembers.slice(0, 5).map((member) => (
                              <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-800">{member.name}</td>
                                <td className="px-6 py-4 text-xs text-gray-500">{member.email}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${member.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                    {member.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${member.status === 'Active' ? 'bg-green-100 text-green-700' :
                                      member.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {member.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <h2 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Megaphone size={14} className="text-brand-500" /> Announcements
                      </h2>
                      <div className="space-y-6 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredAnnouncements.map((ann) => (
                          <div key={ann.id} className="border-l-2 border-brand-200 pl-4 relative group cursor-pointer hover:bg-gray-50 p-2 rounded-r-lg transition-colors"
                            onClick={() => { setSelectedAnnouncement(ann); setShowViewAnnouncementModal(true); }}>
                            <p className="text-[10px] text-brand-600 font-bold uppercase tracking-tight mb-1">
                              {new Date(ann.created_at || ann.date).toLocaleDateString()} {ann.created_at ? new Date(ann.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                            <p className="text-sm text-gray-700 font-bold leading-relaxed line-clamp-2">{ann.content}</p>
                            <div className="absolute top-2 right-10 opacity-40 group-hover:opacity-100 transition-opacity">
                              <Eye size={14} className="text-brand-400" />
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteAnnouncement(ann.id); }}
                              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete Announcement"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {announcements.length === 0 && (
                          <p className="text-xs text-gray-400 italic">No announcements posted.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-brand-700 p-6 rounded-xl shadow-lg border border-brand-800 text-white group overflow-hidden relative">
                      <div className="relative z-10">
                        <h2 className="font-bold mb-4 uppercase tracking-widest text-xs">Financial Summary</h2>
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-brand-200 uppercase tracking-tight">Monthly Goal Achievement</span>
                            <span className="text-lg font-black">{stats.goalAchievement.toFixed(2)}%</span>
                          </div>
                          <div className="w-full bg-brand-800 h-1.5 rounded-full overflow-hidden border border-brand-900/50">
                            <div className="bg-white h-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ width: `${stats.goalAchievement}%` }}></div>
                          </div>
                        </div>
                        <button className="w-full bg-white text-brand-700 py-3 rounded-lg font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-brand-50 transition-all active:scale-95">
                          Generate PDF Report
                        </button>
                      </div>
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === 'loans' && (
              <div className="space-y-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-gray-800 uppercase tracking-widest">Cooperative Loans</h2>
                  <AnimatePresence>
                    {selectedLoanIds.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 bg-brand-50 p-2 rounded-xl border border-brand-100 shadow-sm"
                      >
                        <div className="flex flex-col px-2">
                          <span className="text-[10px] font-black text-brand-700 uppercase tracking-widest">
                            {selectedLoanIds.length} Selected
                          </span>
                          {loans.filter(l => selectedLoanIds.includes(l.id) && l.status === 'Pending').length > 0 ? (
                            <span className="text-[8px] font-bold text-amber-600 uppercase tracking-tight">
                              {loans.filter(l => selectedLoanIds.includes(l.id) && l.status === 'Pending').length} Pending
                            </span>
                          ) : (
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">
                              No Pending Items
                            </span>
                          )}
                        </div>
                        <div className="h-4 w-px bg-brand-200 mx-1"></div>
                        <button 
                          onClick={() => handleBulkAction('Active')}
                          className="px-4 py-1.5 bg-brand-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand-800 transition-all shadow-md shadow-brand-100 active:scale-95"
                        >
                          Bulk Approve
                        </button>
                        <button 
                          onClick={() => handleBulkAction('Rejected')}
                          className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md shadow-red-100 active:scale-95"
                        >
                          Bulk Reject
                        </button>
                        <button 
                          onClick={() => setSelectedLoanIds([])}
                          className="p-1.5 text-gray-400 hover:text-gray-600"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="grid grid-cols-1 gap-8">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                      <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider">All Loans</h2>
                      <div className="flex items-center gap-2">
                        <div className="group relative">
                          <Info size={14} className="text-gray-400 cursor-help hover:text-brand-600 transition-colors" />
                          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 w-48 p-3 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-2xl z-50 translate-x-2 group-hover:translate-x-0">
                            The "Select All" checkbox in the header will only select Pending loans that require action.
                            <div className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-slate-900"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-4 w-10">
                              <input 
                                type="checkbox" 
                                className="rounded border-gray-300 text-brand-600 focus:ring-brand-600"
                                checked={selectedLoanIds.length > 0 && selectedLoanIds.length === filteredLoans.filter(l => l.status === 'Pending').length}
                                onChange={(e) => {
                                  const pendingLoans = filteredLoans.filter(l => l.status === 'Pending');
                                  if (e.target.checked) {
                                    if (pendingLoans.length === 0) {
                                      setNoPendingActionType('Approve');
                                      setShowNoPendingModal(true);
                                      return;
                                    }
                                    // Intelligent Select All: Only select pending loans
                                    setSelectedLoanIds(pendingLoans.map(l => l.id));
                                  } else {
                                    setSelectedLoanIds([]);
                                  }
                                }}
                              />
                            </th>
                            <th className="table-header-cell">Member</th>
                            <th className="table-header-cell">Loan Type</th>
                            <th className="table-header-cell text-right">Amount</th>
                            <th className="table-header-cell">Status</th>
                            <th className="table-header-cell">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                          {filteredLoans.map((loan) => (
                            <tr key={loan.id} className={`${loan.status === 'Pending' ? 'bg-amber-50/30' : ''} ${selectedLoanIds.includes(loan.id) ? 'bg-brand-50/50' : ''} hover:bg-gray-50/50 transition-colors`}>
                              <td className="px-6 py-4">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-600"
                                  checked={selectedLoanIds.includes(loan.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      if (loan.status !== 'Pending') {
                                        setNoPendingActionType('Approve');
                                        setShowNoPendingModal(true);
                                        return;
                                      }
                                      setSelectedLoanIds(prev => [...prev, loan.id]);
                                    } else {
                                      setSelectedLoanIds(prev => prev.filter(id => id !== loan.id));
                                    }
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4 font-bold text-gray-800">{loan.member_name}</td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-500 mr-2 uppercase">{loan.type}</span>
                                <span className="text-gray-500 text-xs hidden sm:inline">{LOAN_TYPES[loan.type as keyof typeof LOAN_TYPES]}</span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono font-bold text-gray-700">₱ {loan.amount.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                {loan.status === 'Pending' ? (
                                  <select 
                                    onChange={(e) => {
                                      if (e.target.value === 'Active') handleUpdateLoanStatus(loan.id, 'Active');
                                      if (e.target.value === 'Rejected') handleUpdateLoanStatus(loan.id, 'Rejected');
                                    }}
                                    className="bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border border-amber-200 outline-none cursor-pointer hover:bg-amber-100 transition-colors"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Active">Approve</option>
                                    <option value="Rejected">Reject</option>
                                  </select>
                                ) : (
                                  <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${loan.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                      loan.status === 'Active' ? 'bg-green-100 text-green-700' :
                                        loan.status === 'Rejected' ? 'text-red-700 bg-red-100' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {loan.status}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <button 
                                  onClick={() => { setSelectedLoan(loan); setShowViewLoanModal(true); }}
                                  className="p-1 text-gray-400 hover:text-brand-700 transition-colors"
                                  title="View Details"
                                >
                                  <Eye size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === 'members' && (
              <div className="space-y-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-gray-800 uppercase tracking-widest">Cooperative Members</h2>
                  <AnimatePresence>
                    {selectedMemberIds.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 bg-brand-50 p-2 rounded-xl border border-brand-100 shadow-sm"
                      >
                        <span className="text-[10px] font-black text-brand-700 uppercase tracking-widest px-2">
                          {selectedMemberIds.length} Selected
                        </span>
                        <div className="h-4 w-px bg-brand-200 mx-1"></div>
                        <button 
                          onClick={() => handleBulkMemberAction('Active')}
                          className="px-4 py-1.5 bg-brand-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand-800 transition-all shadow-md shadow-brand-100"
                        >
                          Bulk Activate
                        </button>
                        <button 
                          onClick={() => handleBulkMemberAction('Pending')}
                          className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-md shadow-amber-100"
                        >
                          Bulk Deactivate
                        </button>
                        <button 
                          onClick={() => setSelectedMemberIds([])}
                          className="p-1.5 text-gray-400 hover:text-gray-600"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Member List</h2>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black bg-brand-50 text-brand-700 px-2 py-1 rounded border border-brand-100 uppercase tracking-widest">Total: {members.length}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 w-10">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-brand-600 focus:ring-brand-600"
                              checked={selectedMemberIds.length > 0 && selectedMemberIds.length === filteredMembers.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMemberIds(filteredMembers.map(m => m.id));
                                } else {
                                  setSelectedMemberIds([]);
                                }
                              }}
                            />
                          </th>
                          <th className="table-header-cell">Name</th>
                          <th className="table-header-cell hidden lg:table-cell">Email</th>
                          <th className="table-header-cell hidden md:table-cell">Role</th>
                          <th className="table-header-cell">Status</th>
                          <th className="table-header-cell text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {filteredMembers.map((m) => (
                          <tr key={m.id} className={`${selectedMemberIds.includes(m.id) ? 'bg-brand-50/50' : ''} hover:bg-gray-50/50 transition-colors`}>
                            <td className="px-6 py-4">
                              <input 
                                type="checkbox" 
                                className="rounded border-gray-300 text-brand-600 focus:ring-brand-600"
                                checked={selectedMemberIds.includes(m.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedMemberIds(prev => [...prev, m.id]);
                                  } else {
                                    setSelectedMemberIds(prev => prev.filter(id => id !== m.id));
                                  }
                                }}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center text-brand-700 font-bold text-[10px]">
                                  {m.name.charAt(0)}
                                </div>
                                <span className="font-bold text-gray-800">{m.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600 hidden lg:table-cell">{m.email}</td>
                            <td className="px-6 py-4 hidden md:table-cell">
                              <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${m.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                {m.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${m.status === 'Active' ? 'bg-green-100 text-green-700' :
                                  m.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {m.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {m.status === 'Pending' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateMemberStatus(m.id, 'Active')}
                                      className="px-3 py-1 bg-brand-700 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-brand-800"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleUpdateMemberStatus(m.id, 'Rejected')}
                                      className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded text-[10px] font-black uppercase tracking-widest hover:bg-red-100"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => { setEditingMember(m); setShowEditRoleModal(true); }}
                                  className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-brand-700 transition-colors"
                                  title="Edit Role"
                                >
                                  <ShieldCheck size={16} />
                                </button>
                                <button
                                  onClick={() => { if (confirm(`Delete ${m.name}?`)) handleDeleteMember(m.id); }}
                                  className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                                  title="Delete Member"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {view === 'reports' && (
              <div className="space-y-8 max-w-7xl mx-auto pb-20">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-gray-800 uppercase tracking-widest">Reports</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Monthly Collection */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Monthly Collection</p>
                      <h3 className="text-3xl font-black text-gray-800 mb-2">₱ {stats.totalCollectionMonth.toLocaleString()}</h3>
                      <div className="flex items-center gap-2 text-[10px] font-black text-brand-600 uppercase tracking-widest">
                        <Check size={12} /> Verified
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <TrendingUp size={64} className="text-brand-700" />
                    </div>
                  </div>

                  {/* Total Loans Released */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Loans Released</p>
                      <h3 className="text-3xl font-black text-gray-800 mb-2">₱ {stats.totalReleased.toLocaleString()}</h3>
                      <div className="flex items-center gap-2 text-[10px] font-black text-brand-600 uppercase tracking-widest">
                        <Check size={12} /> Verified
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <ArrowUpRight size={64} className="text-brand-700" />
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-brand-700 p-6 rounded-2xl shadow-lg border border-brand-800 text-white flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Financial Summary</p>
                      <h3 className="text-xl font-bold mb-4">View Income & Expenses</h3>
                    </div>
                    <button onClick={handleGenerateReport} className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                      <Download size={14} /> Generate PDF Report
                    </button>
                  </div>
                </div>

                {/* Loan Type Breakdown Section */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Loan Type Distribution</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(LOAN_TYPES).map(([type, label]) => (
                      <div key={type} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <span className="px-2 py-1 bg-brand-50 text-brand-700 rounded text-[10px] font-black uppercase tracking-widest">{type}</span>
                          <span className="text-[10px] font-bold text-gray-400">{stats.breakdown[type].count} Active</span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 mb-1 line-clamp-1">{label}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Released</span>
                            <span className="text-sm font-black text-gray-800">₱{stats.breakdown[type].released.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-baseline">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Collected</span>
                            <span className="text-xs font-bold text-brand-600">₱{stats.breakdown[type].collections.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Record New Collection */}
                  <div className="lg:col-span-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                      <PlusCircle size={18} className="text-brand-600" /> Record New Collection
                    </h3>
                    <form onSubmit={handleRecordPayment} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Member Loan Account</label>
                        <select name="memberId" required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-700 font-bold text-sm">
                          <option value="">Select Member</option>
                          {members.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Loan Type</label>
                        <select name="loanType" required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-700 font-bold text-sm">
                          <option value="APL">APL (Agricultural Production Loan)</option>
                          <option value="MPL">MPL (Multi-Purpose Loan)</option>
                          <option value="EHL">EHL (Emergency Health Loan)</option>
                          <option value="EPL">EPL (Emergency Personal Loan)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Amount (₱)</label>
                        <input name="amount" type="number" step="0.01" defaultValue="0.00" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-700 font-bold text-lg" required />
                      </div>
                      <button type="submit" className="w-full py-4 bg-brand-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-brand-800 transition-all active:scale-95">
                        Confirm Payment
                      </button>
                    </form>
                  </div>

                  {/* Tables Area */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Payment History */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Payment History</h3>
                      </div>
                      <div className="overflow-x-auto max-h-[300px]">
                        <table className="w-full text-left">
                          <thead className="bg-white border-b border-gray-100 sticky top-0">
                            <tr>
                              <th className="table-header-cell">Date</th>
                              <th className="table-header-cell">Member</th>
                              <th className="table-header-cell">Type</th>
                              <th className="table-header-cell text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-[11px] font-bold">
                            {filteredPayments.map(p => (
                              <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-500">{p.date}</td>
                                <td className="px-6 py-4 text-gray-800">{p.member_name}</td>
                                <td className="px-6 py-4"><span className="px-2 py-0.5 bg-gray-100 rounded text-[9px]">{p.loan_type}</span></td>
                                <td className="px-6 py-4 text-right text-brand-700">₱ {p.amount.toLocaleString()}</td>
                              </tr>
                            ))}
                            {payments.length === 0 && (
                              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">No payments recorded</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Loan Report */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Loan Report</h3>
                      </div>
                      <div className="overflow-x-auto max-h-[300px]">
                        <table className="w-full text-left">
                          <thead className="bg-white border-b border-gray-100 sticky top-0">
                            <tr>
                              <th className="table-header-cell">Date</th>
                              <th className="table-header-cell">Member</th>
                              <th className="table-header-cell">Type</th>
                              <th className="table-header-cell text-right">Principal</th>
                              <th className="table-header-cell">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-[11px] font-bold">
                            {filteredLoans.map(l => (
                              <tr key={l.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-500">{l.created_at ? new Date(l.created_at).toLocaleDateString() : l.date}</td>
                                <td className="px-6 py-4 text-gray-800">{l.member_name}</td>
                                <td className="px-6 py-4"><span className="px-2 py-0.5 bg-gray-100 rounded text-[9px]">{l.type}</span></td>
                                <td className="px-6 py-4 text-right text-gray-700">₱ {l.amount.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-0.5 rounded-[4px] text-[9px] uppercase ${l.status === 'Active' ? 'bg-brand-50 text-brand-700' :
                                      l.status === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'
                                    }`}>{l.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Preview */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Report Preview</h3>
                    {showReportPreview && (
                      <button
                        onClick={handleGenerateReport}
                        className="px-6 py-2 bg-brand-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-800 transition-all active:scale-95 flex items-center gap-2"
                      >
                        <Download size={14} /> Download PDF
                      </button>
                    )}
                  </div>

                  {!showReportPreview ? (
                    <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-12 text-center">
                      <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                      <p className="text-sm text-gray-500 max-w-xs mx-auto">Click the button above to generate a preview of the financial report.</p>
                      <button
                        onClick={() => setShowReportPreview(true)}
                        className="mt-4 text-brand-700 font-bold text-xs uppercase tracking-widest hover:underline"
                      >
                        Generate Preview
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-xl overflow-hidden shadow-inner bg-gray-50 p-8"
                    >
                      {/* Fake PDF Preview */}
                      <div className="bg-white max-w-4xl mx-auto shadow-2xl p-10 min-h-[600px] font-serif text-gray-800">
                        <div className="border-b-4 border-brand-700 pb-4 mb-8 flex justify-between items-end">
                          <div>
                            <h1 className="text-2xl font-black text-brand-700 leading-tight">NAgCO FINANCIAL SUMMARY</h1>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Napilihan Agriculture Cooperative</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400">REPORT ID: #{Date.now().toString().slice(-8)}</p>
                            <p className="text-[10px] font-bold text-gray-400">DATE: {new Date().toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-12">
                          <div className="bg-brand-50/50 p-6 rounded-lg border border-brand-100">
                            <p className="text-[10px] font-black text-brand-700 uppercase tracking-widest mb-4">Core Metrics</p>
                            <div className="space-y-4">
                              <div className="flex justify-between border-b border-brand-100 pb-2">
                                <span className="text-xs font-medium">Total Active Loans</span>
                                <span className="text-xs font-black">{stats.totalActiveLoans}</span>
                              </div>
                              <div className="flex justify-between border-b border-brand-100 pb-2">
                                <span className="text-xs font-medium">Monthly Collections</span>
                                <span className="text-xs font-black">₱{stats.totalCollectionMonth.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between border-b border-brand-100 pb-2">
                                <span className="text-xs font-medium">Capital Released</span>
                                <span className="text-xs font-black">₱{stats.totalReleased.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col justify-center items-center p-6 border border-gray-100 rounded-lg">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Goal Achievement</p>
                            <p className="text-5xl font-black text-brand-700">{stats.goalAchievement.toFixed(1)}%</p>
                            <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                              <div className="bg-brand-600 h-full" style={{ width: `${stats.goalAchievement}%` }} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <p className="text-xs font-black uppercase tracking-widest border-b pb-2">Recent Payment Activity</p>
                          <table className="w-full text-xs">
                            <thead className="text-left text-gray-400 font-bold">
                              <tr>
                                <th className="pb-2">MEMBER</th>
                                <th className="pb-2">TYPE</th>
                                <th className="pb-2 text-right">AMOUNT</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {payments.slice(0, 5).map(p => (
                                <tr key={p.id}>
                                  <td className="py-2 font-bold">{p.member_name}</td>
                                  <td className="py-2 opacity-60">{p.loan_type}</td>
                                  <td className="py-2 text-right font-black">₱{p.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-20 pt-8 border-t text-center">
                          <p className="text-[10px] text-gray-400 font-medium italic">This is a system-generated summary for internal review only.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {view === 'profile' && (
              <div className="max-w-3xl mx-auto space-y-8">
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-widest mb-8">Account Settings</h2>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-center p-12">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl" />
                    ) : (
                      <div className="w-full h-full bg-brand-100 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-brand-700">
                        {user?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-brand-700 rounded-full border-4 border-white flex items-center justify-center cursor-pointer hover:bg-brand-800 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProfileImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <Camera size={14} className="text-white" />
                    </label>
                  </div>
                  <h3 className="text-xl font-black text-gray-800">{user?.name}</h3>
                  <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mt-1">{user?.role}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                      <User size={14} className="text-brand-500" /> Basic Information
                    </h3>
                    <form className="space-y-6" onSubmit={handleUpdateProfile}>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-black ml-1">Full name</label>
                        <input
                          type="text"
                          value={user?.name || ''}
                          onChange={(e) => setUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-700 outline-none text-sm font-bold text-black transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-black ml-1">Email address</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg outline-none text-sm font-bold text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <button type="submit" className="w-full py-4 bg-brand-700 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-100 transition-all hover:shadow-xl active:scale-95">Update Information</button>
                    </form>
                  </div>

                  <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                      <Lock size={14} className="text-brand-500" /> Security
                    </h3>
                    <form className="space-y-6" onSubmit={handleChangePassword}>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-black ml-1">Current password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-700 outline-none text-sm font-bold text-black transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2 relative">
                        <label className="text-[10px] font-black text-black ml-1 flex items-center gap-1">
                          New password
                          <AlertCircle
                            size={12}
                            className="text-gray-500 hover:text-gray-700 transition-colors cursor-help"
                            onMouseEnter={() => setShowSettingsTooltip(true)}
                            onMouseLeave={() => setShowSettingsTooltip(false)}
                          />
                        </label>
                        {showSettingsTooltip && (
                          <div className="absolute top-6 left-1 bg-white text-black text-xs rounded p-2 z-10 w-64 shadow-lg border">
                            <p className="font-bold mb-1 text-green-600">Password Requirements:</p>
                            <div className="space-y-1">
                              <div className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-green-400' : 'text-gray-400'}`}>
                                <Check size={8} /> At least 8 characters
                              </div>
                              <div className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                                <Check size={8} /> At least 1 uppercase letter
                              </div>
                              <div className={`flex items-center gap-1 ${/[a-z]/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                                <Check size={8} /> At least 1 lowercase letter
                              </div>
                              <div className={`flex items-center gap-1 ${/\d/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                                <Check size={8} /> At least 1 number (0-9)
                              </div>
                              <div className={`flex items-center gap-1 ${/[!@#$%^&*]/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                                <Check size={8} /> At least 1 special character (!@#$%^&*)
                              </div>
                            </div>
                          </div>
                        )}
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-700 outline-none text-sm font-bold text-black transition-all"
                          required
                        />
                      </div>
                      <button type="submit" className="w-full py-4 bg-brand-700 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg transition-all hover:bg-brand-800 active:scale-95">Change Password</button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {showEditRoleModal && editingMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditRoleModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Update System Role</h3>
                  <button onClick={() => setShowEditRoleModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400">
                    <X size={18} />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Target Account</p>
                  <p className="text-sm font-bold text-gray-800">{editingMember.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      handleUpdateMemberRole(editingMember.id, 'MEMBER');
                      setShowEditRoleModal(false);
                    }}
                    className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${editingMember.role === 'MEMBER' ? 'border-brand-700 bg-brand-50' : 'border-gray-100 hover:bg-gray-50'}`}
                  >
                    <User size={24} className={editingMember.role === 'MEMBER' ? 'text-brand-700' : 'text-gray-300'} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Member</span>
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateMemberRole(editingMember.id, 'ADMIN');
                      setShowEditRoleModal(false);
                    }}
                    className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${editingMember.role === 'ADMIN' ? 'border-brand-700 bg-brand-50' : 'border-gray-100 hover:bg-gray-50'}`}
                  >
                    <ShieldCheck size={24} className={editingMember.role === 'ADMIN' ? 'text-brand-700' : 'text-gray-300'} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
                  </button>
                </div>

                <p className="mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-relaxed text-center italic">
                  Warning: Granting admin access provides full control over loan approvals and financial reports.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Announcement Modal */}
      <AnimatePresence>
        {showAnnouncementModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAnnouncementModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Create New Notice</h3>
                  <button onClick={() => setShowAnnouncementModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400">
                    <X size={18} />
                  </button>
                </div>

                <form className="space-y-6" onSubmit={handlePostAnnouncement}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black ml-1">Notice title</label>
                    <input name="title" type="text" placeholder="e.g., Office Holiday Schedule" required className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-700 outline-none text-sm font-bold text-black transition-all" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black ml-1">Description</label>
                    <textarea name="content" rows={4} placeholder="Provide details about the notice..." required className="w-full px-4 py-3 bg-transparent border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-700 outline-none text-sm font-bold text-black transition-all resize-none" />
                  </div>

                  <div className="bg-green-50 p-4 rounded-xl border border-green-100 mb-2">
                    <div className="flex gap-3">
                      <Calendar size={18} className="text-green-600 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">Publishing Info</p>
                        <p className="text-[10px] font-bold text-green-600 leading-tight">
                          Select the date and time when this notice should become visible to all members.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-black ml-1">Publish Date</label>
                      <input name="publishDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-transparent border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-700 outline-none text-sm font-bold text-black transition-all cursor-pointer" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-black ml-1">Publish Time</label>
                      <input name="publishTime" type="time" required defaultValue={new Date().toTimeString().slice(0, 5)} className="w-full px-4 py-3 bg-transparent border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-700 outline-none text-sm font-bold text-black transition-all cursor-pointer" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-brand-700 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-100 hover:bg-brand-800 transition-all active:scale-95 mt-4"
                  >
                    Post Notice
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderMemberView = () => (
    <div className="pov-110-container">
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar */}
        {/* Sidebar Overlay for Mobile */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={`fixed lg:relative z-40 bg-brand-700 text-white flex flex-col h-full border-r border-brand-800 shrink-0 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}`}>
          <div className="p-4 flex items-center gap-3 overflow-hidden border-b border-brand-800/30">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 p-1">
              <img src="/logo.png" alt="NAgCO" className="w-full h-full object-contain" />
            </div>
            {sidebarOpen && <span className="font-bold text-xs leading-tight whitespace-normal w-[160px] animate-in fade-in slide-in-from-left-2">NAgCO Loan Management System</span>}
          </div>

          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
            <SidebarItem icon={LayoutDashboard} label="My Dashboard" id="dashboard" currentView={view} setView={setView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <SidebarItem icon={User} label="Profile" id="profile" currentView={view} setView={setView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          </nav>

          <div className="p-3 border-t border-brand-800/30 mt-auto">
            {sidebarOpen && (
              <div className="mb-3 flex items-center gap-2 px-1 py-2 bg-brand-800/20 rounded-lg">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-brand-600 shadow-sm" />
                ) : (
                  <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-[10px] font-black text-white border-2 border-brand-500 shadow-sm">
                    {user?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black truncate leading-tight text-white">{user?.email}</p>
                  <p className="text-[8px] text-brand-300 font-bold uppercase tracking-widest leading-none mt-1">{user?.role}</p>
                </div>
              </div>
            )}
            <button onClick={handleLogout} className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-red-500/20 text-red-100 transition-colors font-bold text-xs">
              <LogOut size={18} className="text-white" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="bg-white border-b border-gray-200 shrink-0 relative z-30">
            <div className="h-16 flex items-center justify-between px-4 sm:px-8">
              <div className="flex items-center gap-4 flex-1 max-w-xl">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                  <Menu size={20} />
                </button>

                {/* Desktop Search Bar */}
                <div className="relative flex-1 hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Search your records or announcements..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-700 outline-none transition-all shadow-sm"
                  />
                  {globalSearch && (
                    <SearchResultsDropdown
                      results={{ loans: filteredLoans, members: filteredMembers, announcements: filteredAnnouncements }}
                      onSelect={setView}
                      onClose={() => setGlobalSearch('')}
                    />
                  )}
                </div>

                {/* Mobile Search Toggle */}
                <button
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className="sm:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                  {isSearchExpanded ? <X size={20} /> : <Search size={20} />}
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors relative"
                  >
                    {notifications.some(n => n.unread) ? <BellDot size={20} className="text-brand-600" /> : <Bell size={20} />}
                    {notifications.filter(n => n.unread).length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full min-w-[14px] h-[14px] flex items-center justify-center border border-white">
                        {notifications.filter(n => n.unread).length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                          <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Notifications</h3>
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-[10px] font-bold text-brand-700 hover:underline uppercase tracking-tight"
                          >
                            Mark all as read
                          </button>
                        </div>
                        <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
                          {notifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => handleNotificationClick(n)}
                              className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer relative group/notif ${n.unread ? 'bg-brand-50/30' : ''}`}
                            >
                              <p className="text-xs font-black text-gray-800 mb-1 flex items-center justify-between pr-6">
                                {n.title}
                                {n.unread && <span className="w-1.5 h-1.5 bg-brand-600 rounded-full"></span>}
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-1 pr-6">{n.message}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{n.time}</p>
                              
                              <button 
                                onClick={(e) => handleDeleteNotification(e, n.id)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/notif:opacity-100"
                                title="Delete notification"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => setShowRequestModal(true)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-brand-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-brand-800 transition-all active:scale-95"
                >
                  <Plus size={14} /> <span className="hidden sm:inline">New Loan Request</span>
                </button>
              </div>
            </div>

            {/* Mobile Search Bar Row */}
            <AnimatePresence>
              {isSearchExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="sm:hidden px-4 pb-4 overflow-visible border-t border-gray-100 bg-white"
                >
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      autoFocus
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-brand-700 outline-none transition-all shadow-sm"
                    />
                    {globalSearch && (
                      <SearchResultsDropdown
                        results={{ loans: filteredLoans, members: filteredMembers, announcements: filteredAnnouncements }}
                        onSelect={setView}
                        onClose={() => { setGlobalSearch(''); setIsSearchExpanded(false); }}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 font-sans">
            {view === 'dashboard' && (
              <div className="max-w-7xl mx-auto space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 uppercase tracking-widest mb-2">Welcome, {user?.name}</h2>
                  <p className="text-sm font-bold text-gray-500">This is your dashboard.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="metric-card border-brand-500">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Loan Balance</p>
                        <p className="text-3xl font-black text-gray-800">
                          ₱ {loans.filter(l => l.member_id === user?.id && l.status === 'Active').reduce((acc, l) => acc + l.amount, 0).toLocaleString()}
                        </p>
                        <div className="mt-2 text-[10px] font-bold text-brand-600 uppercase tracking-tight">Status: Active</div>
                      </div>

                      <div className="metric-card border-brand-500">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Upcoming Payment</p>
                        {(() => {
                          const activeLoans = loans
                            .filter(l => l.member_id === user?.id && l.status === 'Active')
                            .sort((a, b) => new Date(a.created_at || a.date).getTime() - new Date(b.created_at || b.date).getTime());
                          
                          const nearestLoan = activeLoans[0];
                          
                          if (nearestLoan) {
                            const date = new Date(nearestLoan.created_at || nearestLoan.date);
                            const months = (nearestLoan.type === 'APL' || nearestLoan.type === 'MPL') ? 4 : 2;
                            date.setMonth(date.getMonth() + months);
                            return (
                              <div>
                                <p className="text-3xl font-black text-gray-800">₱ {(nearestLoan.amount / months).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                <p className="mt-2 text-[10px] font-bold text-brand-600 uppercase tracking-tight">Due on: {date.toLocaleDateString()}</p>
                                <p className="mt-1 text-[8px] font-bold text-red-500 uppercase tracking-tight italic">* 3% monthly penalty after due date</p>
                              </div>
                            );
                          }
                          return <p className="text-xl font-bold text-gray-300 py-2">None at the moment</p>;
                        })()}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <header className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                        <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider">My History</h2>
                      </header>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                              <th className="table-header-cell">Date</th>
                              <th className="table-header-cell">Activity</th>
                              <th className="table-header-cell text-right hidden xs:table-cell">Total Amount</th>
                              <th className="table-header-cell text-right">Monthly Payment</th>
                              <th className="table-header-cell">Due Date</th>
                              <th className="table-header-cell">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredPayments.filter(p => p.member_id === user?.id).map(p => (
                              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.created_at ? new Date(p.created_at).toLocaleDateString() : p.date}</td>
                                <td className="px-6 py-4 font-bold text-gray-800 underline decoration-brand-100 underline-offset-4">Loan Payment ({p.loan_type})</td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-brand-700 hidden xs:table-cell">₱ {p.amount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-brand-700">₱ {p.amount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-[10px] font-bold text-gray-400">PAID</td>
                                <td className="px-6 py-4">
                                  <span className="text-[10px] font-black text-brand-600 uppercase tracking-tighter">Verified</span>
                                </td>
                              </tr>
                            ))}
                            {filteredLoans.filter(l => l.member_id === user?.id).map(l => (
                              <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{l.created_at ? new Date(l.created_at).toLocaleDateString() : l.date}</td>
                                <td className="px-6 py-4 font-bold text-gray-800">Loan: {l.type}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 hidden xs:table-cell">₱ {l.amount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-brand-800">
                                  {l.status === 'Active' ? (() => {
                                    const months = (l.type === 'APL' || l.type === 'MPL') ? 4 : 2;
                                    return `₱ ${(l.amount / months).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                                  })() : '--'}
                                </td>
                                <td className="px-6 py-4 text-[10px] font-bold text-brand-600">
                                  {l.status === 'Active' ? (() => {
                                    const date = new Date(l.created_at || l.date);
                                    const months = (l.type === 'APL' || l.type === 'MPL') ? 4 : 2;
                                    date.setMonth(date.getMonth() + months);
                                    return date.toLocaleDateString();
                                  })() : '--'}
                                  {l.status === 'Active' && (
                                    <div className="text-[7px] text-red-400 font-bold leading-none mt-0.5">3% monthly penalty if late</div>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => { setSelectedLoan(l); setShowViewLoanModal(true); }}
                                      className="p-1 text-gray-400 hover:text-brand-700 transition-colors"
                                      title="View Details"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${l.status === 'Active' ? 'bg-green-100 text-green-700' :
                                        l.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                          'bg-red-100 text-red-700'
                                      }`}>
                                      {l.status}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {filteredLoans.filter(l => l.member_id === user?.id).length === 0 && filteredPayments.filter(p => p.member_id === user?.id).length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold">No records found yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <h2 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Megaphone size={14} className="text-brand-500" /> Important Updates
                      </h2>
                      <div className="space-y-6">
                        {filteredAnnouncements.map((ann) => (
                          <div key={ann.id} className="border-l-2 border-brand-200 pl-4 relative cursor-pointer hover:bg-gray-50 p-2 rounded-r-lg transition-colors group"
                            onClick={() => { setSelectedAnnouncement(ann); setShowViewAnnouncementModal(true); }}>
                            <p className="text-[10px] text-brand-600 font-bold uppercase tracking-tight mb-1">
                              {new Date(ann.created_at || ann.date).toLocaleDateString()} {ann.created_at ? new Date(ann.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                            <p className="text-sm text-gray-700 font-bold leading-relaxed line-clamp-2">{ann.content}</p>
                            <div className="absolute top-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity bg-white/80 rounded-full p-1 shadow-sm">
                              <Eye size={14} className="text-brand-600" />
                            </div>
                          </div>
                        ))}
                        {announcements.length === 0 && (
                          <p className="text-xs text-gray-400 italic">No updates at this time.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-brand-700 p-8 rounded-xl shadow-lg border border-brand-800 text-white relative overflow-hidden group">
                      <div className="relative z-10 text-center">
                        <AlertTriangle size={32} className="mx-auto mb-4 text-brand-400" />
                        <h3 className="font-bold text-xs uppercase tracking-widest mb-2">Important Reminder</h3>
                        <p className="text-[10px] font-bold text-brand-100 leading-relaxed uppercase tracking-tight mb-6 opacity-70">
                          Please make sure your details are correct so we can reach you for updates.
                        </p>
                        <button
                          onClick={() => setView('profile')}
                          className="w-full bg-white text-brand-700 py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-brand-50 transition-all active:scale-95"
                        >
                          Update Profile
                        </button>
                      </div>
                      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === 'profile' && (
              <div className="max-w-3xl mx-auto space-y-8">
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-widest mb-8">Account Settings</h2>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-center p-12">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl" />
                    ) : (
                      <div className="w-full h-full bg-brand-100 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-brand-700">
                        {user?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-brand-700 rounded-full border-4 border-white flex items-center justify-center cursor-pointer hover:bg-brand-800 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProfileImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <Camera size={14} className="text-white" />
                    </label>
                  </div>
                  <h3 className="text-xl font-black text-gray-800">{user?.name}</h3>
                  <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mt-1">{user?.role}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                      <User size={14} className="text-brand-500" /> Basic Information
                    </h3>
                    <form className="space-y-6" onSubmit={handleUpdateProfile}>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-black ml-1">Full name</label>
                        <input
                          type="text"
                          value={user?.name || ''}
                          onChange={(e) => setUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-700 outline-none text-sm font-bold text-black transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-black ml-1">Email address</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg outline-none text-sm font-bold text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <button type="submit" className="w-full py-4 bg-brand-700 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-100 transition-all hover:shadow-xl active:scale-95">Update Information</button>
                    </form>
                  </div>

                  <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                      <Lock size={14} className="text-brand-500" /> Security
                    </h3>
                    <form className="space-y-6" onSubmit={handleChangePassword}>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-black ml-1">Current password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-700 outline-none text-sm font-bold text-black transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2 relative">
                        <label className="text-[10px] font-black text-black ml-1 flex items-center gap-1">
                          New password
                          <AlertCircle
                            size={12}
                            className="text-gray-500 hover:text-gray-700 transition-colors cursor-help"
                            onMouseEnter={() => setShowProfileTooltip(true)}
                            onMouseLeave={() => setShowProfileTooltip(false)}
                          />
                        </label>
                        {showProfileTooltip && (
                          <div className="absolute top-6 left-1 bg-white text-black text-xs rounded p-2 z-10 w-64 shadow-lg border">
                            <p className="font-bold mb-1 text-green-600">Password Requirements:</p>
                            <div className="space-y-1">
                              <div className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-green-400' : 'text-gray-400'}`}>
                                <Check size={8} /> At least 8 characters
                              </div>
                              <div className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                                <Check size={8} /> At least 1 uppercase letter
                              </div>
                              <div className={`flex items-center gap-1 ${/[a-z]/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                                <Check size={8} /> At least 1 lowercase letter
                              </div>
                              <div className={`flex items-center gap-1 ${/\d/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                                <Check size={8} /> At least 1 number (0-9)
                              </div>
                              <div className={`flex items-center gap-1 ${/[!@#$%^&*]/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                                <Check size={8} /> At least 1 special character (!@#$%^&*)
                              </div>
                            </div>
                          </div>
                        )}
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-700 outline-none text-sm font-bold text-black transition-all"
                          required
                        />
                      </div>
                      <button type="submit" className="w-full py-4 bg-brand-700 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg transition-all hover:bg-brand-800 active:scale-95">Change Password</button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Loan Request Modal */}
          <AnimatePresence>
            {showRequestModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setShowRequestModal(false);
                    setCalculation(null);
                    setRequestAmount('');
                    setRequestType('');
                  }}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
                >
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Loan Request</h3>
                      <button onClick={() => {
                        setShowRequestModal(false);
                        setCalculation(null);
                        setRequestAmount('');
                        setRequestType('');
                      }} className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400">
                        <X size={18} />
                      </button>
                    </div>

                    <form className="space-y-6 max-w-sm mx-auto" onSubmit={(e) => e.preventDefault()}>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-black ml-1">Loan type</label>
                        <div className="relative group">
                          <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600 transition-colors" size={16} />
                          <select
                            value={requestType}
                            onChange={(e) => setRequestType(e.target.value)}
                            className="w-full py-3 px-12 bg-white/60 border border-gray-200 rounded-xl focus:ring-1 focus:ring-brand-700 outline-none text-sm font-bold text-black transition-all cursor-pointer"
                          >
                            <option value="">Select Loan Type</option>
                            <option value="APL">APL (Agricultural Production Loan)</option>
                            <option value="MPL">MPL (Multi-Purpose Loan)</option>
                            <option value="EHL">EHL (Emergency Health Loan)</option>
                            <option value="EPL">EPL (Emergency Personal Loan)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-black ml-1">Loan amount</label>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-brand-600 text-[10px] tracking-widest">₱</span>
                          <input
                            type="number"
                            value={requestAmount}
                            onChange={(e) => setRequestAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-12 pr-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:ring-1 focus:ring-brand-700 outline-none text-sm font-black text-black transition-all"
                          />
                        </div>
                      </div>

                      {!calculation ? (
                        <button
                          type="button"
                            onClick={() => {
                              if (!requestType || !requestAmount) return;
                              const amt = parseFloat(requestAmount);
                              
                              // Range Validation
                              if (requestType === 'EHL' && (amt < 2000 || amt > 5000)) {
                                addToast('EHL loan amount must be between ₱2,000 and ₱5,000', 'error');
                                return;
                              }
                              if (requestType === 'EPL' && (amt < 1000 || amt > 3000)) {
                                addToast('EPL loan amount must be between ₱1,000 and ₱3,000', 'error');
                                return;
                              }

                              const isLongTerm = requestType === 'APL' || requestType === 'MPL';
                              const months = isLongTerm ? 4 : 2;
                              const sf = amt * 0.02;
                              const cbuVal = isLongTerm ? 100 : 0;
                              const intr = amt * 0.02 * months; // 2% interest per month
                              const td = sf + cbuVal + intr;
                              
                              setCalculation({
                                type: LOAN_TYPES[requestType as LoanType],
                                amount: amt,
                                serviceFee: sf,
                                cbu: cbuVal,
                                interest: intr,
                                term: `${months} months`,
                                totalDeduction: td,
                                netRelease: amt - td
                              });
                            }}
                          className="w-full py-3 bg-brand-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-md hover:bg-brand-800 transition-all active:scale-95"
                        >
                          Calculate
                        </button>
                      ) : (
                        <div className="p-6 bg-brand-50 rounded-xl border border-brand-100 space-y-4 animate-in fade-in slide-in-from-top-1">
                          <h4 className="text-[10px] font-black text-brand-700 uppercase tracking-widest border-b border-brand-100 pb-2 mb-2">Loan Summary</h4>
                          <div className="grid grid-cols-1 gap-2 text-[10px] font-bold uppercase tracking-tight">
                            <div className="flex justify-between border-b border-brand-100/30 pb-1">
                              <span className="text-brand-600">Loan Type:</span>
                              <span className="text-brand-800">{calculation.type}</span>
                            </div>
                            <div className="flex justify-between border-b border-brand-100/30 pb-1">
                              <span className="text-brand-600">Loan Amount:</span>
                              <span className="text-brand-800">₱ {calculation.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b border-brand-100/30 pb-1">
                              <span className="text-brand-600">Service Fee:</span>
                              <span className="text-brand-800">₱ {calculation.serviceFee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b border-brand-100/30 pb-1">
                              <span className="text-brand-600">CBU:</span>
                              <span className="text-brand-800">₱ {calculation.cbu.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b border-brand-100/30 pb-1">
                              <span className="text-brand-600">Interest:</span>
                              <span className="text-brand-800">₱ {calculation.interest.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b border-brand-100/30 pb-1">
                              <span className="text-brand-600">Term:</span>
                              <span className="text-brand-800">{calculation.term}</span>
                            </div>
                            <div className="flex justify-between border-b border-brand-800/10 py-1 bg-brand-100/50 px-2 -mx-2">
                              <span className="text-brand-700">Total Deduction:</span>
                              <span className="text-brand-900 font-black">₱ {calculation.totalDeduction.toLocaleString()}</span>
                            </div>
                             <div className="flex justify-between pt-2 text-xs border-t border-brand-200 mt-1">
                              <span className="text-brand-800 font-black">Net Release:</span>
                              <span className="text-brand-900 font-black">₱ {calculation.netRelease.toLocaleString()}</span>
                            </div>
                            <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-100 flex items-center gap-2">
                              <AlertTriangle size={12} className="text-amber-600" />
                              <p className="text-[8px] text-amber-700 font-bold leading-tight uppercase">NOTE: AN ADDITIONAL 3% PENALTY PER MONTH WILL BE APPLIED AFTER THE DUE DATE.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowRequestModal(false);
                            setCalculation(null);
                            setRequestAmount('');
                            setRequestType('');
                          }}
                          className="flex-1 py-3 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleLoanRequest}
                          className="flex-1 py-3 bg-brand-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-brand-100 hover:bg-brand-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!calculation}
                        >
                          Send Request
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );

  return (
    <>
      {user?.role === 'ADMIN' ? renderAdminView() : renderMemberView()}

      {/* View Announcement Modal */}
      <AnimatePresence>
        {showViewAnnouncementModal && selectedAnnouncement && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowViewAnnouncementModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-0">
                <div className="bg-brand-700 p-8 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                        <Megaphone size={24} className="text-white" />
                      </div>
                      <button onClick={() => setShowViewAnnouncementModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                        <X size={20} />
                      </button>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Announcement</p>
                    <h3 className="text-2xl font-black leading-tight mb-2">{selectedAnnouncement.title || 'System Update'}</h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-white/80 uppercase tracking-widest">
                      <Calendar size={12} />
                      {new Date(selectedAnnouncement.created_at || selectedAnnouncement.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      <span className="w-1 h-1 bg-white/30 rounded-full" />
                      <Clock size={12} />
                      {new Date(selectedAnnouncement.created_at || selectedAnnouncement.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                </div>
                
                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 text-base leading-relaxed font-medium whitespace-pre-wrap">
                      {selectedAnnouncement.content}
                    </p>
                  </div>
                </div>
                
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setShowViewAnnouncementModal(false)}
                    className="px-8 py-3 bg-brand-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-100 hover:bg-brand-800 transition-all active:scale-95"
                  >
                    Close Notice
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Loan Details Modal */}
      <AnimatePresence>
        {showViewLoanModal && selectedLoan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowViewLoanModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-0">
                <div className="bg-brand-700 p-8 text-white relative overflow-hidden">
                  <div className="relative z-10 text-center">
                    <div className="bg-white/20 w-12 h-12 rounded-xl backdrop-blur-md flex items-center justify-center mx-auto mb-4">
                      <FileText size={24} className="text-white" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Loan Details</p>
                    <h3 className="text-2xl font-black">{selectedLoan.type}</h3>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md`}>
                        ID: {selectedLoan.id}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedLoan.status === 'Active' ? 'bg-green-400 text-green-950' :
                        selectedLoan.status === 'Pending' ? 'bg-amber-400 text-amber-950' : 'bg-red-400 text-red-950'}`}>
                        {selectedLoan.status}
                      </span>
                    </div>
                  </div>
                  <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </div>

                <div className="p-8 space-y-6 bg-white">
                  <div className="grid grid-cols-2 gap-8 border-b border-gray-100 pb-6">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Loan Amount</p>
                      <p className="text-xl font-black text-gray-800">₱ {selectedLoan.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Requested By</p>
                      <p className="text-sm font-bold text-gray-800">{selectedLoan.member_name}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-brand-700 uppercase tracking-widest">Calculation Breakdown</h4>
                    {(() => {
                      const amt = selectedLoan.amount;
                      const isLongTerm = selectedLoan.type === 'APL' || selectedLoan.type === 'MPL';
                      const months = isLongTerm ? 4 : 2;
                      const sf = amt * 0.02;
                      const cbuVal = isLongTerm ? 100 : 0;
                      const intr = amt * 0.02 * months; // 2% per month
                      const td = sf + cbuVal + intr;
                      const date = new Date(selectedLoan.created_at || selectedLoan.date);
                      date.setMonth(date.getMonth() + months);

                      return (
                        <div className="space-y-2 text-[10px] font-bold uppercase tracking-tight text-gray-600">
                          <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                            <span>Service Fee (2%)</span>
                            <span>₱ {sf.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                            <span>CBU Deduction</span>
                            <span>₱ {cbuVal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                            <span>Interest Rate (2% / mo)</span>
                            <span>₱ {intr.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-brand-50 text-brand-800 rounded-lg border border-brand-100">
                            <span>Net Release</span>
                            <span className="font-black">₱ {(amt - td).toLocaleString()}</span>
                          </div>
                          <div className="pt-4 border-t border-gray-100 mt-2">
                            <div className="flex justify-between text-gray-800">
                              <span>Payment Term</span>
                              <span className="text-brand-700">{months} Months</span>
                            </div>
                            <div className="flex justify-between text-gray-800 mt-1">
                              <span>Due Date</span>
                              <span className="text-brand-700">{date.toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-800 mt-1">
                              <span>Monthly Payment</span>
                              <span className="text-brand-700 font-black">₱ {(amt / months).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            
                            {(() => {
                              const now = new Date();
                              if (selectedLoan.status === 'Active' && now > date) {
                                const monthsLate = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
                                const penalty = amt * 0.03 * Math.max(1, monthsLate);
                                return (
                                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                                    <div className="flex justify-between text-red-700 mb-1">
                                      <span className="flex items-center gap-1"><AlertTriangle size={12} /> Overdue Penalty (3%)</span>
                                      <span className="font-black">₱ {penalty.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[8px] text-red-500 font-bold italic uppercase">Loan is {monthsLate || 1} month(s) overdue</p>
                                  </div>
                                );
                              }
                              return (
                                <div className="flex justify-between text-red-600 mt-2 pt-2 border-t border-red-50 italic">
                                  <span className="flex items-center gap-1"><AlertTriangle size={10} /> Overdue Penalty</span>
                                  <span>3% per month</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setShowViewLoanModal(false)}
                    className="w-full py-4 bg-brand-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-100 hover:bg-brand-800 transition-all active:scale-95"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification System */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-xl shadow-2xl border-l-4 flex items-center gap-3 ${
                toast.type === 'success' ? 'bg-green-50 border-green-500 text-green-900 shadow-green-900/5' :
                toast.type === 'error' ? 'bg-red-50 border-red-500 text-red-900 shadow-red-900/5' :
                'bg-blue-50 border-blue-500 text-blue-900 shadow-blue-900/5'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-50' :
                  toast.type === 'error' ? 'bg-red-50' :
                    'bg-blue-50'
                }`}>
                {toast.type === 'success' ? <CheckCircle className="text-green-600" size={20} /> :
                  toast.type === 'error' ? <XCircle className="text-red-600" size={20} /> :
                    <AlertCircle className="text-blue-600" size={20} />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">
                  {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Notification'}
                </p>
                <p className="text-sm font-bold leading-tight">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* View Notification Modal */}
      <AnimatePresence>
        {showViewNotificationModal && selectedNotification && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowViewNotificationModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-50 rounded-lg text-brand-700">
                      <Bell size={20} />
                    </div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Notification</h3>
                  </div>
                  <button onClick={() => setShowViewNotificationModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <p className="text-[10px] font-black text-brand-700 uppercase tracking-widest mb-1">{selectedNotification.title}</p>
                    <p className="text-sm font-bold text-gray-800 leading-relaxed">{selectedNotification.message}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{selectedNotification.time}</p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      if (user?.role === 'ADMIN') {
                        if (selectedNotification.type === 'LOAN_REQUEST' || selectedNotification.title.includes('Loan')) {
                          setView('loans');
                        } else if (selectedNotification.type === 'ACCOUNT_APPROVAL' || selectedNotification.type === 'ACCOUNT_REJECTION') {
                          setView('members');
                        }
                      } else {
                        setView('dashboard');
                      }
                      setShowViewNotificationModal(false);
                      setShowNotifications(false);
                    }}
                    className="w-full py-4 bg-brand-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-100 hover:bg-brand-800 transition-all active:scale-95"
                  >
                    Go to Page
                  </button>
                  <button
                    onClick={() => setShowViewNotificationModal(false)}
                    className="w-full py-4 bg-gray-50 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Loan Submission Loader */}
      <AnimatePresence>
        {(isSubmittingLoan || showSuccessAnimation) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/80"
          >
            <div className="text-center px-4">
              {!showSuccessAnimation ? (
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 border-4 border-white/10 border-t-brand-500 rounded-full mx-auto"
                  />
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Coins size={32} className="text-white animate-pulse" />
                  </motion.div>
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-12"
                  >
                    <h3 className="text-white font-black text-2xl uppercase tracking-[0.4em] mb-3">Processing</h3>
                    <div className="flex justify-center gap-1.5 mb-3">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} className="w-1.5 h-1.5 bg-brand-400 rounded-full" />
                      ))}
                    </div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Securing your financial request...</p>
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rotate-3">
                    <CheckCircle size={56} className="text-brand-700 -rotate-3" />
                  </div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-white font-black text-4xl uppercase tracking-tighter mb-3">Success!</h3>
                    <p className="text-brand-200 text-sm font-bold uppercase tracking-widest">Your request has been filed.</p>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Processing Loader */}
      <AnimatePresence>
        {isUpdatingStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <RefreshCw size={14} className="text-brand-700 animate-pulse" />
                </div>
              </div>
            </div>
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mt-6 text-center"
            >
              <p className="text-white font-black text-xs uppercase tracking-[0.2em] mb-1">Processing Request</p>
              <p className="text-white/60 text-[10px] font-bold">Please wait while we update the system...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* No Pending Selection Modal */}
      <AnimatePresence>
        {showNoPendingModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNoPendingModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-brand-100"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-xl">
                  <Info size={40} className="text-green-500" />
                </div>
                
                <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest mb-2 text-green-700">Selection Blocked</h3>
                <p className="text-sm font-bold text-gray-500 leading-relaxed mb-8">
                  Bulk actions are only available for loans with a <span className="text-green-600 font-black italic underline decoration-green-200 underline-offset-4">PENDING</span> status.
                  <br /><br />
                  You cannot bulk {noPendingActionType.toLowerCase()} other statuses. Please make sure to select only pending requests to proceed.
                </p>

                <button 
                  onClick={() => setShowNoPendingModal(false)}
                  className="w-full py-4 bg-brand-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-brand-800 transition-all active:scale-95 shadow-brand-100"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;

