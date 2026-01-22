import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Clients', icon: Users, page: 'Clients' },
  { name: 'Projects', icon: FolderKanban, page: 'Projects', hasSubmenu: true },
  { name: 'Time', icon: Clock, page: 'TimeTracking' },
  { name: 'Invoices', icon: FileText, page: 'Invoices' },
  { name: 'Reviews', icon: Eye, page: 'ReviewRequests' },
  { name: 'Settings', icon: Settings, hasSubmenu: true, submenuItems: [
    { name: 'Invoice Settings', page: 'InvoiceSettings' },
    { name: 'Personal Preferences', page: 'PersonalPreferences' }
  ]},
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date', 5),
  });

  const toggleSidebar = () => {
    const newValue = !sidebarCollapsed;
    setSidebarCollapsed(newValue);
    localStorage.setItem('sidebarCollapsed', newValue.toString());
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full bg-white border-r border-slate-200/80 transform transition-all duration-300 ease-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <span className="text-lg font-semibold text-slate-800 tracking-tight">Flowdesk</span>
              )}
            </div>
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

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page || (item.submenuItems && item.submenuItems.some(sub => sub.page === currentPageName));
              return (
                <div key={item.name}>
                  {item.hasSubmenu && item.page ? (
                    <div>
                      <button
                        onClick={() => setProjectsExpanded(!projectsExpanded)}
                        className={cn(
                          "flex items-center w-full gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                          isActive 
                            ? "bg-emerald-50 text-emerald-700" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                          sidebarCollapsed ? "justify-center" : "justify-between"
                        )}
                        title={sidebarCollapsed ? item.name : ''}
                      >
                        <div className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center")}>
                          <item.icon className={cn(
                            "w-5 h-5",
                            isActive ? "text-emerald-600" : "text-slate-400"
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
                    ) : item.hasSubmenu && item.submenuItems ? (
                    <div>
                      <button
                        onClick={() => setSettingsExpanded(!settingsExpanded)}
                        className={cn(
                          "flex items-center w-full gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                          isActive 
                            ? "bg-emerald-50 text-emerald-700" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                          sidebarCollapsed ? "justify-center" : "justify-between"
                        )}
                        title={sidebarCollapsed ? item.name : ''}
                      >
                        <div className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center")}>
                          <item.icon className={cn(
                            "w-5 h-5",
                            isActive ? "text-emerald-600" : "text-slate-400"
                          )} />
                          {!sidebarCollapsed && item.name}
                        </div>
                        {!sidebarCollapsed && (
                          <ChevronRight className={cn(
                            "w-4 h-4 transition-transform",
                            settingsExpanded && "rotate-90"
                          )} />
                        )}
                      </button>
                      {settingsExpanded && !sidebarCollapsed && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.submenuItems.map(subItem => (
                            <Link
                              key={subItem.page}
                              to={createPageUrl(subItem.page)}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                "block px-3 py-1.5 text-sm rounded-lg hover:bg-slate-50",
                                currentPageName === subItem.page 
                                  ? "text-emerald-600 bg-emerald-50" 
                                  : "text-slate-600 hover:text-emerald-600"
                              )}
                            >
                              {subItem.name}
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
                          ? "bg-emerald-50 text-emerald-700" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        sidebarCollapsed && "justify-center"
                      )}
                      title={sidebarCollapsed ? item.name : ''}
                    >
                      <item.icon className={cn(
                        "w-5 h-5",
                        isActive ? "text-emerald-600" : "text-slate-400"
                      )} />
                      {!sidebarCollapsed && item.name}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          {!sidebarCollapsed && (
            <div className="px-4 py-4 border-t border-slate-100">
              <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100">
                <p className="text-xs font-medium text-slate-500">Free Plan</p>
                <p className="text-xs text-slate-400 mt-0.5">Upgrade for more features</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className={cn("transition-all duration-300", sidebarCollapsed ? "lg:pl-16" : "lg:pl-64")}>
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-800">Flowdesk</span>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}