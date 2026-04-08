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
        'flows/domain-management',
        'flows/external-integrations',
        'flows/generate-ai-content',
        'flows/google-adsense',
        'flows/google-analytics',
        'flows/manage-websites',
        'flows/paid-onboarding',
        'flows/payments-and-subscriptions',
      ],
    },
  ],
};

export default sidebars;
