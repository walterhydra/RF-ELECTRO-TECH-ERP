'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, Wifi, Search, ChevronDown, LogOut, User, Loader2, Menu } from 'lucide-react';
import { getApiBaseUrl, fetchApi } from '@/lib/utils';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = React.useState('Super Admin');
  const [userEmail, setUserEmail] = React.useState('admin@rfelectro.com');
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const loadNotifications = React.useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const res = await fetchApi('/notifications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch notifications:', e);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  React.useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      await fetchApi(`/notifications/${id}/read`, { method: 'PATCH' });
    } catch (e) {
      console.warn('Failed to mark read:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await fetchApi('/notifications/read-all', { method: 'PATCH' });
    } catch (e) {
      console.warn('Failed to mark all read:', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (val.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      setIsLoading(false);
      return;
    }

    setIsSearching(true);
    setIsLoading(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const queryTerm = encodeURIComponent(val.trim());
        const [jobRes, poRes, prodRes] = await Promise.all([
          fetchApi(`/job-cards?search=${queryTerm}`).then(r => r.ok ? r.json() : []).catch(() => []),
          fetchApi(`/customer-pos?search=${queryTerm}`).then(r => r.ok ? r.json() : []).catch(() => []),
          fetchApi(`/products?search=${queryTerm}`).then(r => r.ok ? r.json() : []).catch(() => []),
        ]);

        const combined: any[] = [];

        if (Array.isArray(jobRes)) {
          jobRes.slice(0, 3).forEach((jc: any) => {
            combined.push({
              type: 'Job Card',
              id: jc.jobCardNo,
              title: jc.product?.name || jc.product?.code || 'Job Card',
              status: jc.status,
              url: `/job-cards/${jc.id}`,
            });
          });
        }

        if (Array.isArray(poRes)) {
          poRes.slice(0, 3).forEach((po: any) => {
            combined.push({
              type: 'Customer PO',
              id: po.poNo,
              title: po.customer?.companyName || po.product?.name || 'Customer PO',
              status: po.status,
              url: `/pos`,
            });
          });
        }

        if (Array.isArray(prodRes)) {
          prodRes.slice(0, 3).forEach((p: any) => {
            combined.push({
              type: 'Spec Card',
              id: p.specCardNo || p.code,
              title: p.name,
              status: p.isActive ? 'ACTIVE' : 'INACTIVE',
              url: `/products`,
            });
          });
        }

        setSearchResults(combined);
      } catch (err) {
        console.error('Header search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);
  };

  const [assignedStage, setAssignedStage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const role = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');
    const stage = localStorage.getItem('assignedStage');
    if (role) setUserRole(role);
    if (email) setUserEmail(email);
    if (stage && stage.toUpperCase() !== 'ALL') setAssignedStage(stage);
  }, []);

  // Format the path to a nice title
  const title = pathname
    ? pathname.split('/').filter(Boolean)[0]?.charAt(0).toUpperCase() + pathname.split('/').filter(Boolean)[0]?.slice(1) || 'Dashboard'
    : 'Dashboard';

  // Get initials from role
  const initials = userRole.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${getApiBaseUrl()}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Ignore if offline
    }

    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('assignedStage');
    localStorage.removeItem('assignedStageId');
    localStorage.removeItem('rf_electro_job_cards_v3');

    // Clear cookies
    document.cookie = 'rf_session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax';
    document.cookie = 'rf_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax';

    router.push('/login');
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200/80 sticky top-0 z-30 shrink-0 shadow-xs">
      <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6 flex-1 max-w-4xl min-w-0">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden shrink-0 cursor-pointer"
          aria-label="Toggle Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-base sm:text-xl font-extrabold text-slate-800 tracking-tight truncate min-w-0">{title}</h1>

        <div className="relative flex-1 max-w-2xl hidden md:block">
          {isLoading ? (
            <Loader2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
          ) : (
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          )}
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => {
              if (searchQuery.trim() !== '') setIsSearching(true);
            }}
            placeholder="Search Spec Card No, PO, Job Card..."
            className="w-full bg-slate-50/80 border border-slate-200/90 rounded-full pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
          />

          {/* Search Results Dropdown */}
          {isSearching && searchQuery.length > 0 && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSearching(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-2">
                  {isLoading ? (
                    <div className="px-3 py-6 text-center flex flex-col items-center justify-center">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-2" />
                      <span className="text-sm text-slate-500 font-medium">Searching database...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setIsSearching(false); router.push(result.url); }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between mb-1 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{result.type}</span>
                          <span className="font-semibold text-blue-600">{result.id}</span>
                          <span className="text-slate-600 truncate max-w-[150px] sm:max-w-[200px]">{result.title}</span>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold mt-1 sm:mt-0 w-fit">
                          {result.status}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-sm text-slate-500">
                      No results found for "{searchQuery}". Try a different spelling.
                    </div>
                  )}
                </div>
                <div className="p-3 text-center border-t border-slate-100 bg-slate-50/80">
                  <button onClick={() => { setIsSearching(false); router.push(`/search?q=${encodeURIComponent(searchQuery)}`); }} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                    View all results for "{searchQuery}"
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 lg:space-x-5">
        {/* Status & Notification Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Offline / PWA sync status indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline tracking-wider uppercase text-[10px]">ONLINE</span>
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
                if (!showNotifications) {
                  loadNotifications();
                }
              }}
              className="relative p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100/80 transition-all cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-500" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                  </div>
                  {unreadCount > 0 ? (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                      {unreadCount} New
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                      All caught up
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {loadingNotifications && notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      <Bell className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkAsRead(n.id)}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors relative ${
                          !n.isRead ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold ${!n.isRead ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                          {new Date(n.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 text-center border-t border-slate-100 bg-slate-50/80 flex items-center justify-between px-4">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {notifications.length} total
                  </span>
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="h-6 w-px bg-slate-200/80"></div>

        {/* User Profile Card Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 p-1.5 pl-2 sm:pl-3 rounded-xl hover:bg-slate-100/70 border border-transparent hover:border-slate-200/80 transition-all focus:outline-none cursor-pointer group text-right"
          >
            <div className="hidden md:block">
              <p className="text-xs font-extrabold text-slate-800 leading-tight">
                {userRole}{assignedStage ? ` (${assignedStage})` : ''}
              </p>
              <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">{userEmail}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold text-xs shadow-sm flex items-center justify-center border-2 border-white ring-1 ring-blue-100 group-hover:bg-blue-700 group-hover:ring-blue-200 transition-all">
              {initials}
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60 md:hidden">
                <p className="text-sm font-bold text-slate-800">{userRole}</p>
                <p className="text-xs text-slate-500">{userEmail}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push('/profile');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  My Profile
                </button>
                <div className="h-px bg-slate-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
