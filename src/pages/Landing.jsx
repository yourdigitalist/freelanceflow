import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Users, 
  Clock, 
  FileText, 
  Eye,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { createPageUrl } from '../utils';

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect authenticated users, don't interfere with public page access
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const user = await base44.auth.me();
        if (!user.onboarding_completed) {
          navigate(createPageUrl('OnboardingWizard'));
        } else {
          navigate(createPageUrl('Dashboard'));
        }
      }
    };
    
    // Only run redirect logic if we're actually on the landing page route
    if (window.location.hash === '#/Landing' || window.location.hash === '#/' || window.location.hash === '') {
      checkAuth();
    }
  }, [navigate]);

  const handleSignIn = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  const features = [
    {
      icon: Users,
      title: 'Client Management',
      description: 'Keep all your client information organized in one place'
    },
    {
      icon: Clock,
      title: 'Time Tracking',
      description: 'Track time spent on projects and tasks effortlessly'
    },
    {
      icon: FileText,
      title: 'Invoicing',
      description: 'Create and send professional invoices in minutes'
    },
    {
      icon: Eye,
      title: 'Client Reviews',
      description: 'Share work for feedback with secure review links'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Flowdesk</span>
          </div>
          <Button onClick={handleSignIn} variant="outline">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
            Freelance work management,
            <span className="text-emerald-600"> simplified</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Manage clients, track time, create invoices, and collaborate with clients - all in one beautiful platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={handleSignIn}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 shadow-lg shadow-emerald-600/30"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Everything you need to run your freelance business
          </h2>
          <p className="text-lg text-slate-600">
            Powerful features to help you work smarter, not harder
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-12 text-center shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-emerald-50 text-lg mb-8">
            Join thousands of freelancers managing their business with Flowdesk
          </p>
          <Button 
            onClick={handleSignIn}
            size="lg"
            className="bg-white text-emerald-600 hover:bg-emerald-50 text-lg px-8"
          >
            Start Free Trial
          </Button>
          <div className="flex items-center justify-center gap-8 mt-8 text-white/90">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Free forever</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900">Flowdesk</span>
            </div>
            <p className="text-sm text-slate-600">
              © 2026 Flowdesk. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}