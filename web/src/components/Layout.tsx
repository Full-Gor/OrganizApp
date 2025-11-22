'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  Lightbulb,
  Bell,
  Settings,
  Plus,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useStore';
import { useState, useCallback } from 'react';
import QuickAddModal from './QuickAddModal';
import AIAssistant from './AIAssistant';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projets', href: '/projects', icon: FolderKanban },
  { name: 'Rush', href: '/rush', icon: Zap },
  { name: 'Calendrier', href: '/calendar', icon: Calendar },
  { name: 'Veille', href: '/watch', icon: Lightbulb },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Paramètres', href: '/settings', icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Rafraîchir la page quand l'IA effectue une action
  const handleAIAction = useCallback(() => {
    router.refresh();
    // Forcer un re-render en rechargeant la page
    window.location.reload();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 hidden lg:block">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary-600">OrganizApp</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                  {item.name === 'Notifications' && unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Add Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setQuickAddOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Ajout rapide
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-bold text-primary-600">OrganizApp</h1>
          <button
            onClick={() => setQuickAddOpen(true)}
            className="p-2 bg-primary-600 text-white rounded-lg"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="flex items-center justify-around h-16">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs',
                  isActive ? 'text-primary-600' : 'text-gray-500'
                )}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.name === 'Notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <div className="p-4 lg:p-8">{children}</div>
      </main>

      {/* Quick Add Modal */}
      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />

      {/* AI Assistant */}
      <AIAssistant onAction={handleAIAction} />
    </div>
  );
}
