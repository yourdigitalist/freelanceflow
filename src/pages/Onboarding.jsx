import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { createPageUrl } from '../utils';

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [companyData, setCompanyData] = useState({
    company_name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    website: '',
    tax_id: '',
  });
  const [preferences, setPreferences] = useState({
    timezone: 'UTC',
    currency: 'USD',
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const createCompanyMutation = useMutation({
    mutationFn: (data) => base44.entities.CompanyProfile.create(data),
    onSuccess: () => {
      setStep(2);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      createSubscriptionMutation.mutate();
    },
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: (data) => base44.entities.Subscription.create(data),
    onSuccess: () => {
      // Complete onboarding
      base44.auth.updateMe({ onboarding_completed: true });
      setTimeout(() => {
        window.location.href = createPageUrl('Dashboard');
      }, 1000);
    },
  });

  const handleCompanySubmit = (e) => {
    e.preventDefault();
    createCompanyMutation.mutate({
      user_id: user?.id,
      ...companyData,
      timezone: preferences.timezone,
      currency: preferences.currency,
      is_setup_complete: false,
    });
  };

  const handlePreferencesSubmit = (e) => {
    e.preventDefault();
    updateUserMutation.mutate({
      timezone: preferences.timezone,
      notifications: {
        review_comments: true,
        invoice_payments: true,
        project_updates: true,
        overdue_tasks: true,
        new_clients: true,
        invoice_reminders: true,
        email_digest: 'weekly',
      },
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block p-3 bg-emerald-100 rounded-full mb-4">
            <Sparkles className="w-6 h-6 text-emerald-600 animate-spin" />
          </div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800">Flowdesk</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {step === 1 ? 'Set up your company' : 'Your preferences'}
          </h1>
          <p className="text-slate-600">
            {step === 1
              ? 'Tell us about your business so we can customize your experience'
              : 'Configure your notification and timezone preferences'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-600' : 'text-slate-300'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step >= 1 ? 'bg-emerald-100' : 'bg-slate-200'
            }`}>
              {step > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <span className="text-sm font-medium">Company</span>
          </div>
          <div className={`h-1 w-12 ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-600' : 'text-slate-300'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step >= 2 ? 'bg-emerald-100' : 'bg-slate-200'
            }`}>
              {step > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <span className="text-sm font-medium">Preferences</span>
          </div>
          <div className={`h-1 w-12 ${step >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-emerald-600' : 'text-slate-300'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step >= 3 ? 'bg-emerald-100' : 'bg-slate-200'
            }`}>
              3
            </div>
            <span className="text-sm font-medium">Billing</span>
          </div>
        </div>

        {/* Form */}
        <Card className="p-8 bg-white shadow-lg">
          {step === 1 && (
            <form onSubmit={handleCompanySubmit} className="space-y-6">
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  placeholder="Your Business Name"
                  value={companyData.company_name}
                  onChange={(e) =>
                    setCompanyData({ ...companyData, company_name: e.target.value })
                  }
                  required
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="business@example.com"
                    value={companyData.email}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, email: e.target.value })
                    }
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 000-0000"
                    value={companyData.phone}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, phone: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  placeholder="123 Main Street"
                  value={companyData.street}
                  onChange={(e) =>
                    setCompanyData({ ...companyData, street: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={companyData.city}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, city: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="NY"
                    value={companyData.state}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, state: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    placeholder="10001"
                    value={companyData.zip}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, zip: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="United States"
                    value={companyData.country}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, country: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="tax_id">Tax ID</Label>
                  <Input
                    id="tax_id"
                    placeholder="XX-XXXXXXX"
                    value={companyData.tax_id}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, tax_id: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://example.com"
                  value={companyData.website}
                  onChange={(e) =>
                    setCompanyData({ ...companyData, website: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createCompanyMutation.isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {createCompanyMutation.isPending ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handlePreferencesSubmit} className="space-y-6">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={preferences.timezone} onValueChange={(value) =>
                  setPreferences({ ...preferences, timezone: value })
                }>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={preferences.currency} onValueChange={(value) =>
                  setPreferences({ ...preferences, currency: value })
                }>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr} value={curr}>
                        {curr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-3">Notification Preferences</h3>
                <div className="space-y-3">
                  {[
                    { key: 'review_comments', label: 'Review comments' },
                    { key: 'invoice_payments', label: 'Invoice payments' },
                    { key: 'project_updates', label: 'Project updates' },
                    { key: 'overdue_tasks', label: 'Overdue tasks' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {updateUserMutation.isPending ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="inline-block p-4 bg-emerald-100 rounded-full mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">You're all set!</h2>
              <p className="text-slate-600">
                Your Flowdesk account is ready. You're currently on the{' '}
                <span className="font-semibold">Free Plan</span>.
              </p>
              <div className="bg-slate-50 p-4 rounded-lg text-left space-y-2">
                <p className="text-sm text-slate-700">
                  ✓ Unlimited clients & projects
                </p>
                <p className="text-sm text-slate-700">
                  ✓ Document review & approval
                </p>
                <p className="text-sm text-slate-700">
                  ✓ Invoice management
                </p>
                <p className="text-sm text-slate-700">
                  ✓ Time tracking
                </p>
              </div>
              <p className="text-sm text-slate-500 pt-4">
                Upgrade to unlock advanced features and team collaboration.
              </p>
              <Button
                onClick={() => window.location.href = createPageUrl('Dashboard')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 mt-6"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-8">
          You can update these settings anytime in Settings.
        </p>
      </div>
    </div>
  );
}