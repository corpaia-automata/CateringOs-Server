'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { authStorage } from '@/lib/auth';

function getBreadcrumb(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    href: '/' + segments.slice(0, i + 1).join('/'),
  }));
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumb(pathname);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(authStorage.getUser());
  }, []);

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <Sidebar />

      {/* Main area offset by sidebar width */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: 240 }}>

        {/* Top header */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b"
          style={{ backgroundColor: '#fff', borderColor: '#E2E8F0', height: 60 }}
        >
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 && <span style={{ color: '#CBD5E1' }}>/</span>}
                <span
                  style={{
                    color: i === breadcrumbs.length - 1 ? '#0F172A' : '#64748B',
                    fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                  }}
                >
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
              style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', width: 220 }}
            >
              <Search size={14} style={{ color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent outline-none flex-1 text-sm"
                style={{ color: '#0F172A' }}
              />
            </div>

            {/* Notifications */}
            <button
              className="relative flex items-center justify-center rounded-lg p-2 transition-colors"
              style={{ color: '#64748B' }}
            >
              <Bell size={18} />
            </button>

            {/* User avatar */}
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback style={{ backgroundColor: '#1C3355', color: '#fff', fontSize: 12 }}>
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
