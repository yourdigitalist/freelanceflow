import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Users, 
  FolderKanban, 
  Clock, 
  DollarSign,
  ArrowRight,
  Plus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import StatCard from '../components/dashboard/StatCard';
import ProjectCard from '../components/dashboard/ProjectCard';
import RecentActivity from '../components/dashboard/RecentActivity';

export default function Dashboard() {
  const [checkingOnboarding, setCheckingOnboarding] = React.useState(true);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: () => base44.entities.TimeEntry.list(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list(),
  });

  // Calculate stats
  const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'review');
  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  const unbilledHours = timeEntries.filter(e => !e.billed && e.billable).reduce((sum, e) => sum + (e.hours || 0), 0);
  const pendingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Recent activities
  const recentActivities = timeEntries
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5)
    .map(entry => {
      const project = projects.find(p => p.id === entry.project_id);
      return {
        type: 'time',
        description: `${entry.hours}h logged on ${project?.name || 'Unknown project'}`,
        date: entry.created_date,
      };
    });

  // Get task counts per project
  const getProjectTaskCount = (projectId) => tasks.filter(t => t.project_id === projectId).length;
  const getProjectHours = (projectId) => timeEntries.filter(t => t.project_id === projectId).reduce((sum, e) => sum + (e.hours || 0), 0);

  React.useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const user = await base44.auth.me();
        
        if (!user.onboarding_completed) {
          window.location.href = createPageUrl('OnboardingWizard');
          return;
        }
      } catch (error) {
        window.location.href = createPageUrl('Landing');
      } finally {
        setCheckingOnboarding(false);
      }
    };
    
    checkOnboarding();
  }, []);

  if (checkingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl('TimeTracking')}>
            <Button variant="outline" className="border-slate-200">
              <Clock className="w-4 h-4 mr-2" />
              Log Time
            </Button>
          </Link>
          <Link to={createPageUrl('Projects')}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Clients"
          value={clients.filter(c => c.status === 'active').length}
          subtitle={`${clients.length} total`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Projects"
          value={activeProjects.length}
          subtitle={`${projects.length} total`}
          icon={FolderKanban}
          color="emerald"
        />
        <StatCard
          title="Hours This Month"
          value={totalHours.toFixed(1)}
          subtitle={`${unbilledHours.toFixed(1)}h unbilled`}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Pending Payment"
          value={`$${pendingAmount.toLocaleString()}`}
          subtitle={`${pendingInvoices.length} invoices`}
          icon={DollarSign}
          color="rose"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Active Projects</h2>
            <Link to={createPageUrl('Projects')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {activeProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeProjects.slice(0, 4).map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  client={clients.find(c => c.id === project.client_id)}
                  totalHours={getProjectHours(project.id)}
                  taskCount={getProjectTaskCount(project.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/60 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <FolderKanban className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">No active projects yet</p>
              <Link to={createPageUrl('Projects')}>
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <RecentActivity activities={recentActivities} />
        </div>
      </div>
    </div>
  );
}