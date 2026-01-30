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
import PhoneInput from '../components/shared/PhoneInput';
import { CURRENCY_OPTIONS } from '../components/shared/currencies';
import { TIMEZONE_OPTIONS } from '../components/shared/timezones';
import { toast } from 'sonner';

const steps = [
  { id: 1, title: 'Your Profile', icon: Bell },
  { id: 2, title: 'Company Info', icon: Building2 },
  { id: 3, title: 'Ready!', icon: CheckCircle2 },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [checking, setChecking] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const initAndCheck = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          navigate(createPageUrl('Landing'));
          return;
        }

        // Initialize user and wait for it to complete
        await base44.functions.invoke('initializeUser');

        const user = await base44.auth.me();
        if (user.onboarding_completed) {
          navigate(createPageUrl('Dashboard'));
          return;
        }

        setChecking(false);
      } catch (error) {
        console.error('Onboarding init error:', error);
        navigate(createPageUrl('Landing'));
      }
    };

    initAndCheck();
  }, [navigate]);
  const [companyData, setCompanyData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
    phone_country_code: '+1',
    email: '',
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
      // Validate name fields
      if (!companyData.first_name || !companyData.last_name) {
        toast.error('Please enter your first and last name');
        return;
      }
      try {
        // Update user's name
        await base44.auth.updateMe({
          full_name: `${companyData.first_name} ${companyData.last_name}`,
        });
        queryClient.invalidateQueries(['currentUser']);
        setCurrentStep(2);
      } catch (error) {
        toast.error('Failed to save your name');
      }
    } else if (currentStep === 2) {
      // Validate mandatory fields
      if (!companyData.company_name || !companyData.street || !companyData.city || 
          !companyData.zip || !companyData.country || !companyData.phone || !companyData.email) {
        toast.error('Please fill in all required fields');
        return;
      }
      try {
        await createProfileMutation.mutateAsync(companyData);
        setCurrentStep(3);
      } catch (error) {
        toast.error('Failed to save company info');
      }
    } else if (currentStep === 3) {
      await completeOnboardingMutation.mutateAsync();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9B63E9]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9B63E9] to-[#8A52D8] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#9B63E9]/30">
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
                      ? 'bg-[#9B63E9] text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <step.icon className="w-6 h-6" />
                </div>
                <p className="text-xs mt-2 text-slate-600">{step.title}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 w-16 ${currentStep > step.id ? 'bg-[#9B63E9]' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">What's your name?</h2>
                <p className="text-slate-600">This will be used to greet you and identify you in the system</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={companyData.first_name}
                    onChange={(e) => setCompanyData({ ...companyData, first_name: e.target.value })}
                    placeholder="John"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={companyData.last_name}
                    onChange={(e) => setCompanyData({ ...companyData, last_name: e.target.value })}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
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
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    value={companyData.street}
                    onChange={(e) => setCompanyData({ ...companyData, street: e.target.value })}
                    placeholder="123 Main St"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="street2">Street Address Line 2</Label>
                  <Input
                    id="street2"
                    value={companyData.street2}
                    onChange={(e) => setCompanyData({ ...companyData, street2: e.target.value })}
                    placeholder="Apt, Suite, Building (optional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={companyData.city}
                      onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                      placeholder="San Francisco"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={companyData.state}
                      onChange={(e) => setCompanyData({ ...companyData, state: e.target.value })}
                      placeholder="CA"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zip">ZIP/Postal Code *</Label>
                    <Input
                      id="zip"
                      value={companyData.zip}
                      onChange={(e) => setCompanyData({ ...companyData, zip: e.target.value })}
                      placeholder="94102"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={companyData.country}
                      onChange={(e) => setCompanyData({ ...companyData, country: e.target.value })}
                      placeholder="USA"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Business Phone *</Label>
                  <PhoneInput
                    value={companyData.phone}
                    countryCode={companyData.phone_country_code}
                    onChange={(phone, countryCode) => setCompanyData({ 
                      ...companyData, 
                      phone, 
                      phone_country_code: countryCode 
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Business Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    placeholder="hello@acme.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Default Currency *</Label>
                    <Select value={companyData.currency} onValueChange={(val) => setCompanyData({ ...companyData, currency: val })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {CURRENCY_OPTIONS.map((curr) => (
                          <SelectItem key={curr.value} value={curr.value}>
                            {curr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone *</Label>
                    <Select value={companyData.timezone} onValueChange={(val) => setCompanyData({ ...companyData, timezone: val })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}



          {currentStep === 3 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-[#9B63E9]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">You're all set!</h2>
              <p className="text-slate-600 mb-6">
                Your account is ready. Start managing your projects, clients, and invoices.
              </p>
              <div className="bg-slate-50 rounded-xl p-6 text-left">
                <h3 className="font-semibold text-slate-900 mb-3">What's included in your Free plan:</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#9B63E9]" />
                    Unlimited projects & clients
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#9B63E9]" />
                    Time tracking & invoicing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#9B63E9]" />
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
              className="bg-[#9B63E9] hover:bg-[#8A52D8]"
            >
              {currentStep === 3 ? 'Go to Dashboard' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}