import {
  ActionIcon,
  AppShell,
  AppShellHeader,
  AppShellMain,
  AppShellNavbar,
  Badge,
  Burger,
  Group,
  NavLink,
  ScrollArea,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { IconMessageChatbot } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import type { PageKey } from './api/types.js';
import { HelpProvider } from './components/HelpDrawer.js';
import { ChatProvider, ChatWidget, ProfileMenu, ThemeToggle, useChatContext } from './components/index.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { AuthProvider } from './contexts/AuthProvider.js';
import { PageContextProvider, usePageDataContext } from './contexts/PageContextProvider.js';
import { ChartsView } from './views/ChartsView.js';
import { DashboardView } from './views/DashboardView.js';
import { DebtsView } from './views/DebtsView.js';
import { FortnightView } from './views/FortnightView.js';
import { LoginView } from './views/LoginView.js';
import { OwnHomeView } from './views/OwnHomeView.js';
import { ProfileView } from './views/ProfileView.js';
import { SignupView } from './views/SignupView.js';
import { TransactionsView } from './views/TransactionsView.js';

const navItems = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'charts', label: 'Charts' },
  { key: 'fortnight', label: 'Fortnight' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'debts', label: 'Debts' },
  { key: 'ownhome', label: 'Own Your Home' },
  { key: 'profile', label: 'Profile' },
] as const;

type NavKey = (typeof navItems)[number]['key'];

function AppContent() {
  const [opened, { toggle, close }] = useDisclosure();
  const { openChat } = useChatContext();
  const { pageData, setCurrentPage } = usePageDataContext();

  // Sync hash changes (e.g., #transactions?fortnightId=123) to internal navigation
  useEffect(() => {
    const syncFromHash = () => {
      const raw = window.location.hash.replace(/^#/, '');
      const page = raw.split('?')[0] as NavKey;
      if (navItems.some((n) => n.key === page)) {
        setCurrentPage(page as PageKey);
      }
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [setCurrentPage]);

  const handleNavChange = (key: NavKey) => {
    setCurrentPage(key as PageKey);
    window.location.hash = key;
    close();
  };

  const renderView = () => {
    switch (pageData.currentPage) {
      case 'dashboard':
        return <DashboardView />;
      case 'charts':
        return <ChartsView />;
      case 'fortnight':
        return <FortnightView />;
      case 'transactions':
        return <TransactionsView />;
      case 'debts':
        return <DebtsView />;
      case 'ownhome':
        return <OwnHomeView />;
      case 'profile':
        return <ProfileView />;
      default:
        return null;
    }
  };

  return (
    <HelpProvider>
      <AppShell
        header={{ height: 64 }}
        navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        padding="md"
      >
        <AppShellHeader withBorder>
          <Group h="100%" px="md" justify="space-between">
            <Group gap="sm">
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
              <Title order={4}>Bucketwise Planner</Title>
              <Badge variant="light" color="amber">
                Personal
              </Badge>
            </Group>
            <Group gap="xs" align="center">
              <ThemeToggle />
              <ProfileMenu />
              <Tooltip label="Chat with Barefoot Advisor">
                <ActionIcon
                  variant="filled"
                  color="teal"
                  size="lg"
                  onClick={openChat}
                  aria-label="Open chat"
                >
                  <IconMessageChatbot size={20} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </AppShellHeader>

        <AppShellNavbar p="md">
          <AppShell.Section grow component={ScrollArea}>
            {navItems.map((item) => (
              <NavLink
                key={item.key}
                label={item.label}
                active={item.key === pageData.currentPage}
                onClick={() => handleNavChange(item.key)}
                variant="light"
                mb="xs"
              />
            ))}
          </AppShell.Section>
        </AppShellNavbar>

        <AppShellMain>{renderView()}</AppShellMain>
      </AppShell>
    </HelpProvider>
  );
}

export default function App() {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const authFallback = authMode === 'login'
    ? <LoginView onSwitch={() => setAuthMode('signup')} />
    : <SignupView onSwitch={() => setAuthMode('login')} />;

  return (
    <ModalsProvider>
      <AuthProvider>
        <ProtectedRoute fallback={authFallback}>
          <ChatProvider>
            <PageContextProvider>
              <AppContent />
              <ChatWidget />
            </PageContextProvider>
          </ChatProvider>
        </ProtectedRoute>
      </AuthProvider>
      <Notifications position="top-right" zIndex={1000} />
    </ModalsProvider>
  );
}
