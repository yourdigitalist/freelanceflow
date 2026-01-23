import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../../utils';

export default function AuthGuard({ children, requireOnboarding = true }) {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        
        if (!isAuth) {
          navigate(createPageUrl('Landing'));
          return;
        }

        if (requireOnboarding) {
          const user = await base44.auth.me();
          if (!user.onboarding_completed) {
            navigate(createPageUrl('OnboardingWizard'));
            return;
          }
        }
        
        setChecking(false);
      } catch (error) {
        navigate(createPageUrl('Landing'));
      }
    };

    checkAuth();
  }, [navigate, requireOnboarding]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return children;
}