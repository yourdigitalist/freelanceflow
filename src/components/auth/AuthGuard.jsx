import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function AuthGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        
        if (!authenticated) {
          setIsAuthenticated(false);
          navigate(createPageUrl('Landing'));
          return;
        }

        // Try to initialize user
        try {
          await base44.functions.invoke('initializeUser');
        } catch (initError) {
          console.error('initializeUser error:', initError);
          // Continue even if initialization fails
        }
        
        // Check if onboarding is needed
        const user = await base44.auth.me();
        if (!user.onboarding_completed) {
          navigate(createPageUrl('OnboardingWizard'));
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        navigate(createPageUrl('Landing'));
      }
    };

    checkAuth();
  }, [navigate]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#9B63E9] border-t-transparent"></div>
      </div>
    );
  }

  // If not authenticated, don't render children (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return children;
}