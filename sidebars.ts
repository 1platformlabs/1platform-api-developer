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
        'flows/external-integrations',
        'flows/generate-ai-content',
        'flows/google-analytics',
        'flows/manage-websites',
        'flows/payments-and-subscriptions',
      ],
    },
  ],
};

export default sidebars;
