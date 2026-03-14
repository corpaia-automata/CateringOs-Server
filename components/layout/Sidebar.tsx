'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ShoppingCart,
  BarChart3,
  Database,
  Settings,
  LogOut,
  ChefHat,
} from 'lucide-react';
import { authStorage } from '@/lib/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', href: '/leads', icon: Users },
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Grocery', href: '/grocery', icon: ShoppingCart },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Master Data', href: '/master', icon: Database },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(authStorage.getUser());
  }, []);

  function handleLogout() {
    authStorage.clear();
    router.push('/login');
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{ width: 240, backgroundColor: '#1C3355' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 36, height: 36, backgroundColor: '#D95F0E' }}
        >
          <ChefHat size={20} color="#fff" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Afsal Catering</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>CateringOS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative"
                  style={{
                    color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                    backgroundColor: active ? 'rgba(217,95,14,0.2)' : 'transparent',
                    borderLeft: active ? '3px solid #D95F0E' : '3px solid transparent',
                  }}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3 px-2 mb-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback style={{ backgroundColor: '#D95F0E', color: '#fff', fontSize: 12 }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">
              {user?.full_name || user?.email || 'User'}
            </p>
            <Badge
              className="mt-0.5 text-[10px] px-1.5 py-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', border: 'none' }}
            >
              {user?.role || 'Staff'}
            </Badge>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ color: 'rgba(255,255,255,0.6)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
