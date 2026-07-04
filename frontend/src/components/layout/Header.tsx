'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, Wifi, Search, ChevronDown, LogOut, User, Loader2 } from 'lucide-react';

const MOCK_SEARCH_DB = [
  { type: 'Job Card', id: 'JC-4021', title: 'Mainboard Assembly', status: 'WIP', url: '/job-cards/4021' },
  { type: 'Job Card', id: 'JC-4022', title: 'LED Panel Testing', status: 'DONE', url: '/job-cards/4022' },
  { type: 'Job Card', id: 'JC-4050', title: 'Power Supply Unit', status: 'PENDING', url: '/job-cards/4050' },
  { type: 'Purchase Order', id: 'PO-9921', title: 'Global Tech Pvt Ltd', status: 'APPROVED', url: '/purchase-orders/9921' },
  { type: 'Purchase Order', id: 'PO-9922', title: 'Electro Components Inc', status: 'DRAFT', url: '/purchase-orders/9922' },
  { type: 'Spec Card', id: 'SC-101', title: 'Standard PCB Specs', status: 'ACTIVE', url: '/spec-cards/101' },
  { type: 'Spec Card', id: 'SC-105', title: 'High Voltage Board', status: 'REVIEW', url: '/spec-cards/105' },
  { type: 'User', id: 'USR-01', title: 'Rajesh Kumar (Production)', status: 'ACTIVE', url: '/profile' },
];

function levenshteinDistance(s: string, t: string) {
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const arr = [];
  for (let i = 0; i <= t.length; i++) {
    arr[i] = [i];
    for (let j = 1; j <= s.length; j++) {
      arr[i][j] = i === 0 ? j : Math.min(
        arr[i - 1][j] + 1,
        arr[i][j - 1] + 1,
        arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1)
      );
    }
  }
  return arr[t.length][s.length];
}

function getSearchResults(query: string) {
  if (!query || query.trim() === '') return [];
  const lowerQuery = query.toLowerCase().trim();

  // First try direct includes (substring match)
  let results = MOCK_SEARCH_DB.filter(item =>
    item.id.toLowerCase().includes(lowerQuery) ||
    item.title.toLowerCase().includes(lowerQuery) ||
    item.type.toLowerCase().includes(lowerQuery)
  );

  // If no direct match, try fuzzy match (spelling mistakes)
  if (results.length === 0) {
    const fuzzyResults = MOCK_SEARCH_DB.map(item => {
      const distId = levenshteinDistance(lowerQuery, item.id.toLowerCase());
      const distTitle = levenshteinDistance(lowerQuery, item.title.toLowerCase());
      const distType = levenshteinDistance(lowerQuery, item.type.toLowerCase());
      return { ...item, dist: Math.min(distId, distTitle, distType) };
    });
    // Threshold for typo: up to 4 mistakes
    results = fuzzyResults.filter(item => item.dist <= 4).sort((a, b) => a.dist - b.dist);
  }
  return results.slice(0, 5); // Return top 5
}

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = React.useState('Super Admin');
  const [userEmail, setUserEmail] = React.useState('admin@rfelectro.com');
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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

    // Simulate network delay of 800ms
    searchTimeoutRef.current = setTimeout(() => {
      setSearchResults(getSearchResults(val));
      setIsLoading(false);
    }, 800);
  };

  React.useEffect(() => {
    const role = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');
    if (role) setUserRole(role);
    if (email) setUserEmail(email);
  }, []);

  // Format the path to a nice title
  const title = pathname
    ? pathname.split('/').filter(Boolean)[0]?.charAt(0).toUpperCase() + pathname.split('/').filter(Boolean)[0]?.slice(1) || 'Dashboard'
    : 'Dashboard';

  // Get initials from role
  const initials = userRole.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    router.push('/login');
  };

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 sticky top-0 z-10 shrink-0">
      <div className="flex items-center space-x-6 flex-1 max-w-2xl">
        <h1 className="text-xl font-bold text-slate-800 hidden sm:block min-w-[120px]">{title}</h1>

        <div className="relative flex-1 max-w-md">
          {isLoading ? (
            <Loader2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
          ) : (
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          )}
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => {
              if (searchQuery.trim() !== '') setIsSearching(true);
            }}
            placeholder="Search Spec Card No, PO, Job Card..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />

          {/* Search Results Dropdown */}
          {isSearching && searchQuery.length > 0 && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSearching(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
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
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between mb-1"
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
                <div className="p-3 text-center border-t border-slate-100 bg-slate-50">
                  <button onClick={() => { setIsSearching(false); router.push(`/search?q=${encodeURIComponent(searchQuery)}`); }} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                    View all results for "{searchQuery}"
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-4">
          {/* Offline / PWA sync status indicator */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold">
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ONLINE</span>
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Notifications</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">1 New</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-4 hover:bg-slate-50 border-b border-slate-50 cursor-pointer transition-colors">
                    <p className="text-sm text-slate-800 font-medium">System Update</p>
                    <p className="text-xs text-slate-500 mt-1">Role-based dashboards are now active.</p>
                    <p className="text-[10px] text-slate-400 mt-2">Just now</p>
                  </div>
                </div>
                <div className="p-3 text-center border-t border-slate-100 bg-slate-50">
                  <button className="text-xs font-semibold text-blue-600 hover:text-blue-800">Mark all as read</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile */}
        <div className="relative flex items-center space-x-3 text-right border-l border-slate-200 pl-6">
          <div className="hidden md:block">
            <p className="text-sm font-bold text-slate-800 leading-none">{userRole}</p>
            <p className="text-xs text-slate-500 mt-1">{userEmail}</p>
          </div>
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-slate-100 flex items-center justify-center text-blue-600 font-bold">
              {initials}
            </div>
            <div className="text-slate-400 hover:text-slate-600">
              <ChevronDown className={`w-5 h-5 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-100 bg-slate-50 md:hidden">
                <p className="text-sm font-bold text-slate-800">{userRole}</p>
                <p className="text-xs text-slate-500">{userEmail}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push('/profile');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button>
                <div className="h-px bg-slate-100 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
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
