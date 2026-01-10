export type HelpPageKey = 'transactions' | 'dashboard' | 'charts' | 'fortnight' | 'debts' | 'profile' | 'ownhome' | 'chat';

export interface HelpSection {
  title: string;
  body: string;
}

export interface HelpPageContent {
  key: HelpPageKey;
  title: string;
  description?: string;
  sections: HelpSection[];
  quickLinks?: Array<{ label: string; href?: string; note?: string }>;
  tags?: string[];
}
