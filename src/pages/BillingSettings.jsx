import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, Zap, AlertCircle } from 'lucide-react';
import { createPageUrl } from '../utils';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    description: 'Perfect to get started',
    features: [
      'Unlimited clients & projects',
      'Document review & approval',
      'Invoice management',
      'Time tracking',
      'Basic reporting',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For growing freelancers',
    features: [
      'Everything in Free',
      'Team collaboration (up to 3)',
      'Advanced reporting',
      'Custom branding',
      'API access',
      'Priority support',
    ],
    coming_soon: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '$79',
    period: '/month',
    description: 'For agencies',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Custom integrations',
      'White-label options',
      'Dedicated support',
      'SLA guarantee',
    ],
    coming_soon: true,
  },
];

export default function BillingSettings() {
  const queryClient = useQueryClient();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: () => {
      if (!user?.id) return null;
      return base44.entities.Subscription.filter({ user_id: user.id }).then(results => results[0]);
    },
    enabled: !!user?.id,
  });

  const upgradeMutation = useMutation({
    mutationFn: (planId) => {
      // This would integrate with Stripe in production
      return Promise.resolve({ success: true, planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setShowUpgradeDialog(false);
    },
  });

  if (!subscription) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  const currentPlan = PLANS.find(p => p.id === subscription.plan);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-8 h-8 text-[#9B63E9]" />
          <h1 className="text-3xl font-bold text-slate-900">Billing & Subscription</h1>
        </div>
        <p className="text-slate-600">Manage your plan and billing information</p>
      </div>

      {/* Current Plan */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-[#9B63E9]">Current Plan</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">
              {currentPlan?.name}
            </h2>
            <p className="text-slate-600 mt-2">{currentPlan?.description}</p>
            {subscription.next_billing_date && (
              <p className="text-sm text-[#9B63E9] mt-3">
                Next billing date: {new Date(subscription.next_billing_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <Badge className="bg-[#9B63E9] text-white h-fit">
            {subscription.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </Card>

      {/* Plan Comparison */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Choose Your Plan</h3>
        <div className="grid grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrentPlan = subscription.plan === plan.id;
            return (
              <Card
                key={plan.id}
                className={`p-6 flex flex-col ${
                  isCurrentPlan ? 'ring-2 ring-[#9B63E9] bg-purple-50' : ''
                }`}
              >
                {isCurrentPlan && (
                  <Badge className="w-fit mb-3 bg-[#9B63E9]">Current Plan</Badge>
                )}
                <h4 className="text-lg font-bold text-slate-900">{plan.name}</h4>
                <p className="text-slate-600 text-sm mt-1">{plan.description}</p>

                <div className="my-6">
                  <div className="text-4xl font-bold text-slate-900">
                    {plan.price}
                    {plan.period && (
                      <span className="text-lg text-slate-600 font-normal">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#9B63E9] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button disabled className="w-full">
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      setShowUpgradeDialog(true);
                    }}
                    disabled={plan.coming_soon}
                    className={`w-full ${
                      plan.coming_soon
                        ? 'bg-slate-300'
                        : 'bg-[#9B63E9] hover:bg-[#8A52D8]'
                    }`}
                  >
                    {plan.coming_soon ? (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Coming Soon
                      </>
                    ) : (
                      'Upgrade'
                    )}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing Info */}
      <Card className="p-6">
        <h3 className="font-bold text-slate-900 mb-4">Billing Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Email</p>
              <p className="text-slate-900 mt-1">{subscription.billing_email || user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <p className="text-slate-900 mt-1 capitalize">{subscription.status}</p>
            </div>
            {subscription.payment_method && (
              <div>
                <p className="text-sm text-slate-600">Payment Method</p>
                <p className="text-slate-900 mt-1">•••• {subscription.payment_method}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Free Plan Info */}
      {subscription.plan === 'free' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">Free Plan Active</h4>
            <p className="text-sm text-blue-700 mt-1">
              Upgrade to Pro or Business to unlock advanced features like team collaboration, custom branding, and priority support.
            </p>
          </div>
        </div>
      )}

      {/* Invoice History */}
      <Card className="p-6">
        <h3 className="font-bold text-slate-900 mb-4">Invoice History</h3>
        <div className="text-center py-8">
          <p className="text-slate-600">No invoices yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Your billing information will appear here after your first charge.
          </p>
        </div>
      </Card>
    </div>
  );
}