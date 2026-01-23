import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Building2, Bell, CheckCircle2 } from 'lucide-react';
import { createPageUrl } from '../utils';
import AvatarUpload from '../components/user/AvatarUpload';
import { toast } from 'sonner';

const steps = [
  { id: 1, title: 'Company Info', icon: Building2 },
  { id: 2, title: 'Your Profile', icon: Bell },
  { id: 3, title: 'Ready!', icon: CheckCircle2 },
];

export default function OnboardingWizard() {
  useEffect(() => {
    // Initialize user subscription on mount
    base44.functions.invoke('initializeUser').catch(() => {});
  }, []);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [companyData, setCompanyData] = useState({
    company_name: '',
    street: '',
    city: '',
    country: '',
    currency: 'USD',
    timezone: 'UTC',
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.CompanyProfile.create({
        ...data,
        user_id: user.id,
        is_setup_complete: false,
      });
    },
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const profiles = await base44.entities.CompanyProfile.filter({ user_id: user.id });
      if (profiles[0]) {
        await base44.entities.CompanyProfile.update(profiles[0].id, {
          is_setup_complete: true,
        });
      }
      await base44.auth.updateMe({ onboarding_completed: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Welcome to Flowdesk!');
      navigate(createPageUrl('Dashboard'));
    },
  });

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!companyData.company_name) {
        toast.error('Please enter your company name');
        return;
      }
      try {
        await createProfileMutation.mutateAsync(companyData);
        setCurrentStep(2);
      } catch (error) {
        toast.error('Failed to save company info');
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      await completeOnboardingMutation.mutateAsync();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Flowdesk</h1>
          <p className="text-slate-600">Let's set up your account in just a few steps</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    currentStep >= step.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <step.icon className="w-6 h-6" />
                </div>
                <p className="text-xs mt-2 text-slate-600">{step.title}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 w-16 ${currentStep > step.id ? 'bg-emerald-600' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Tell us about your business</h2>
                <p className="text-slate-600">This information will appear on your invoices</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={companyData.company_name}
                    onChange={(e) => setCompanyData({ ...companyData, company_name: e.target.value })}
                    placeholder="Acme Inc."
                  />
                </div>

                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={companyData.street}
                    onChange={(e) => setCompanyData({ ...companyData, street: e.target.value })}
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={companyData.city}
                      onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                      placeholder="San Francisco"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={companyData.country}
                      onChange={(e) => setCompanyData({ ...companyData, country: e.target.value })}
                      placeholder="USA"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select value={companyData.currency} onValueChange={(val) => setCompanyData({ ...companyData, currency: val })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={companyData.timezone} onValueChange={(val) => setCompanyData({ ...companyData, timezone: val })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Set up your profile</h2>
                <p className="text-slate-600">Add a profile photo to personalize your account</p>
              </div>

              <div className="py-8">
                <AvatarUpload
                  currentAvatarUrl={user?.avatar_url}
                  userName={user?.full_name}
                  onUploadSuccess={() => queryClient.invalidateQueries(['currentUser'])}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">You're all set!</h2>
              <p className="text-slate-600 mb-6">
                Your account is ready. Start managing your projects, clients, and invoices.
              </p>
              <div className="bg-slate-50 rounded-xl p-6 text-left">
                <h3 className="font-semibold text-slate-900 mb-3">What's included in your Free plan:</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Unlimited projects & clients
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Time tracking & invoicing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Client review portals
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || createProfileMutation.isPending || completeOnboardingMutation.isPending}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={createProfileMutation.isPending || completeOnboardingMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {currentStep === 3 ? 'Go to Dashboard' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}