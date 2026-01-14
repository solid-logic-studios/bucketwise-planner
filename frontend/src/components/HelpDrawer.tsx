import {
  ActionIcon,
  Badge,
  Button,
  Drawer,
  Group,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import { helpContent } from '../constants/helpContent.js';
import { useThemeColors } from '../hooks/useThemeColors.js';
import type { HelpPageContent, HelpPageKey } from '../types/help.js';

interface HelpContextValue {
  openHelp: (key: HelpPageKey) => void;
  closeHelp: () => void;
  isOpen: boolean;
  currentPage: HelpPageKey;
}

const HelpContext = createContext<HelpContextValue | undefined>(undefined);

export function useHelp(): HelpContextValue {
  const ctx = useContext(HelpContext);
  if (!ctx) {
    throw new Error('useHelp must be used within HelpProvider');
  }
  return ctx;
}

export function HelpProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<HelpPageKey>('transactions');
  const [searchTerm, setSearchTerm] = useState('');
  const { textMuted, badgeSecondary } = useThemeColors();

  const openHelp = (key: HelpPageKey) => {
    setCurrentPage(key);
    setSearchTerm('');
    setIsOpen(true);
  };

  const closeHelp = () => setIsOpen(false);

  const content: HelpPageContent = helpContent[currentPage];
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return content.sections;
    const term = searchTerm.toLowerCase();
    return content.sections.filter(
      (section) =>
        section.title.toLowerCase().includes(term) ||
        section.body.toLowerCase().includes(term)
    );
  }, [content.sections, searchTerm]);

  const crossPageMatches = useMemo(() => {
    if (!searchTerm.trim()) return [] as Array<{ page: HelpPageContent; title: string; body: string }>;
    const term = searchTerm.toLowerCase();
    return Object.values(helpContent)
      .filter((page) => page.key !== currentPage)
      .flatMap((page) =>
        page.sections
          .filter((section) =>
            section.title.toLowerCase().includes(term) || section.body.toLowerCase().includes(term)
          )
          .map((section) => ({ page, title: section.title, body: section.body }))
      );
  }, [currentPage, searchTerm]);

  return (
    <HelpContext.Provider value={{ openHelp, closeHelp, isOpen, currentPage }}>
      {children}
      <Drawer
        opened={isOpen}
        onClose={closeHelp}
        position="right"
        size={380}
        padding="md"
        title={
          <Group justify="space-between" align="center" style={{ width: '100%' }}>
            <div>
              <Text size="xs" c={textMuted} fw={600}>
                Help
              </Text>
              <Title order={4}>{content.title}</Title>
              {content.description && (
                <Text size="sm" c={textMuted}>
                  {content.description}
                </Text>
              )}
            </div>
            <ActionIcon variant="subtle" aria-label="Close help" onClick={closeHelp}>
              <IconX size={16} />
            </ActionIcon>
          </Group>
        }
        styles={{ content: { borderLeft: '1px solid var(--mantine-color-dark-5)' } }}
      >
        <Stack gap="md" h="100%">
          <TextInput
            placeholder="Search help..."
            leftSection={<IconSearch size={14} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
          />

          {content.tags && content.tags.length > 0 && (
            <Group gap="xs">
              {content.tags.map((tag) => (
                <Badge key={tag} size="xs" variant="light" color={badgeSecondary}>
                  {tag}
                </Badge>
              ))}
            </Group>
          )}

          <ScrollArea style={{ flex: 1 }}>
            <Stack gap="md">
              {filteredSections.length === 0 && (
                <Text size="sm" c={textMuted}>
                  No help topics match your search.
                </Text>
              )}

              {filteredSections.map((section) => (
                <Stack key={section.title} gap={4} p="xs" style={{ borderRadius: 8, background: 'var(--mantine-color-default-hover)' }}>
                  <Text fw={700}>{section.title}</Text>
                  <Text size="sm" c={textMuted}>
                    {section.body}
                  </Text>
                </Stack>
              ))}

              {content.quickLinks && content.quickLinks.length > 0 && (
                <Stack gap={4}>
                  <Text fw={700}>Quick links</Text>
                  {content.quickLinks.map((link) => (
                    <Text key={link.label} size="sm">
                      {link.label}
                      {link.note ? ` — ${link.note}` : ''}
                    </Text>
                  ))}
                </Stack>
              )}

              {crossPageMatches.length > 0 && (
                <Stack gap={6}>
                  <Text fw={700}>Matches in other pages</Text>
                  {crossPageMatches.map((match) => (
                    <Group key={`${match.page.key}-${match.title}`} justify="space-between" align="flex-start">
                      <Stack gap={2} style={{ flex: 1 }}>
                        <Text fw={600}>{match.title}</Text>
                        <Text size="xs">
                          {match.body}
                        </Text>
                        <Badge size="xs" color={badgeSecondary} variant="light" style={{ width: 'fit-content' }}>
                          {match.page.title}
                        </Badge>
                      </Stack>
                      <Button size="xs" variant="light" onClick={() => openHelp(match.page.key)}>
                        Open
                      </Button>
                    </Group>
                  ))}
                </Stack>
              )}
            </Stack>
          </ScrollArea>
        </Stack>
      </Drawer>
    </HelpContext.Provider>
  );
}
