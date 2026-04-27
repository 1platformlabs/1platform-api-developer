import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: 'Flows',
      items: [
        'flows/generate-invoice',
        'flows/user-onboarding',
        'flows/activity-logs',
        'flows/ai-agents',
        'flows/ai-generations',
        'flows/dashboard-overview',
        'flows/dashboard-settings',
        'flows/domain-management',
        'flows/external-integrations',
        'flows/generate-ai-content',
        'flows/google-adsense',
        'flows/google-analytics',
        'flows/magic-link-authentication',
        'flows/manage-websites',
        'flows/notifications',
        'flows/paid-onboarding',
        'flows/payments-and-subscriptions',
        'flows/referrals',
        'flows/support',
        'flows/tasks',
        'flows/webhook-configuration',
      ],
    },
  ],
};

export default sidebars;
