import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  Clock, 
  FileText, 
  Menu, 
  X,
  Sparkles,
  Settings,
  ChevronRight,
  ChevronLeft,
  User,
  Eye
} from 'lucide-react';
import { cn } from "@/lib/utils";
import UserMenu from './components/layout/UserMenu';
import AuthGuard from './components/auth/AuthGuard';
import NotificationBell from './components/notifications/NotificationBell';

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Clients', icon: Users, page: 'Clients' },
  { name: 'Projects', icon: FolderKanban, page: 'Projects', hasSubmenu: true },
  { name: 'Time', icon: Clock, page: 'TimeTracking' },
  { name: 'Invoices', icon: FileText, page: 'Invoices' },
  { name: 'Reviews', icon: Eye, page: 'ReviewRequests' },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.email],
    queryFn: () => base44.entities.Project.filter({ created_by: user.email }, '-updated_date', 5),
    enabled: !!user?.email,
  });

  const toggleSidebar = () => {
    const newValue = !sidebarCollapsed;
    setSidebarCollapsed(newValue);
    localStorage.setItem('sidebarCollapsed', newValue.toString());
  };

  // Don't show layout for landing, onboarding, and public pages
  const isPublicPage = currentPageName === 'Landing' || currentPageName === 'OnboardingWizard' || 
      currentPageName === 'PublicInvoice' || currentPageName === 'PublicReviewView';
  
  if (isPublicPage) {
    return children;
  }

  return (
    <AuthGuard>
    <div className="min-h-screen bg-[#F5F5F5] relative">
      <div className="absolute inset-0 pointer-events-none -z-10" style={{
        background: 'radial-gradient(circle at 30% 40%, rgba(247, 237, 255, 0.4), transparent 50%), radial-gradient(circle at 70% 60%, rgba(206, 221, 247, 0.3), transparent 50%)'
      }} />
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full bg-white border-r border-[#9B63E9]/10 transform transition-all duration-300 ease-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        sidebarCollapsed ? "w-20" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9B63E9] to-[#8A52D8] flex items-center justify-center shadow-lg shadow-[#9B63E9]/20 flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <span className="text-lg font-semibold text-slate-800 tracking-tight">Flowdesk</span>
                )}
                </div>
                <div className="flex items-center gap-2">
                {!sidebarCollapsed && <NotificationBell />}
                <button
                onClick={toggleSidebar}
                className="hidden lg:block p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                )}
                </button>
                </div>
                </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <div key={item.name}>
                  {item.hasSubmenu && item.page ? (
                    <div>
                      <button
                        onClick={() => setProjectsExpanded(!projectsExpanded)}
                        className={cn(
                          "flex items-center w-full gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                          isActive 
                            ? "bg-[#9B63E9]/10 text-[#9B63E9]" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                          sidebarCollapsed ? "justify-center" : "justify-between"
                        )}
                        title={sidebarCollapsed ? item.name : ''}
                      >
                        <div className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center")}>
                          <item.icon className={cn(
                            sidebarCollapsed ? "w-6 h-6" : "w-5 h-5",
                            isActive ? "text-[#9B63E9]" : "text-slate-400"
                          )} />
                          {!sidebarCollapsed && item.name}
                        </div>
                        {!sidebarCollapsed && (
                          <ChevronRight className={cn(
                            "w-4 h-4 transition-transform",
                            projectsExpanded && "rotate-90"
                          )} />
                        )}
                      </button>
                      {projectsExpanded && !sidebarCollapsed && (
                        <div className="ml-8 mt-1 space-y-1">
                          <Link
                            to={createPageUrl(item.page)}
                            onClick={() => setSidebarOpen(false)}
                            className="block px-3 py-1.5 text-sm text-slate-600 hover:text-emerald-600 rounded-lg hover:bg-slate-50"
                          >
                            All Projects
                          </Link>
                          {projects.slice(0, 5).map(project => (
                            <Link
                              key={project.id}
                              to={createPageUrl(`ProjectDetail?id=${project.id}`)}
                              onClick={() => setSidebarOpen(false)}
                              className="block px-3 py-1.5 text-sm text-slate-600 hover:text-emerald-600 rounded-lg hover:bg-slate-50 truncate"
                            >
                              {project.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={createPageUrl(item.page)}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        isActive 
                          ? "bg-[#9B63E9]/10 text-[#9B63E9]" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        sidebarCollapsed && "justify-center"
                      )}
                      title={sidebarCollapsed ? item.name : ''}
                    >
                      <item.icon className={cn(
                        sidebarCollapsed ? "w-6 h-6" : "w-5 h-5",
                        isActive ? "text-[#9B63E9]" : "text-slate-400"
                      )} />
                      {!sidebarCollapsed && item.name}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User Menu */}
          <UserMenu collapsed={sidebarCollapsed} />
        </div>
      </aside>

      {/* Main content */}
      <div className={cn("transition-all duration-300", sidebarCollapsed ? "lg:pl-16" : "lg:pl-64")}>
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white/80 backdrop-blur-xl border-b border-[#9B63E9]/10 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#9B63E9] to-[#8A52D8] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-800">Flowdesk</span>
              </div>
              <NotificationBell />
            </header>

        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}