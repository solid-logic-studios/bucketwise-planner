import { Avatar, Group, Menu, Text, UnstyledButton } from '@mantine/core';
import { IconLogout, IconSettings, IconUser } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../contexts/useAuth.ts';
import { usePageDataContext } from '../contexts/usePageDataContext.ts';

export function ProfileMenu() {
  const { userName, logout } = useAuth();
  const { setCurrentPage } = usePageDataContext();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const displayName = useMemo(() => {
    try {
      return userName || localStorage.getItem('userName') || 'User';
    } catch {
      return userName || 'User';
    }
  }, [userName]);

  useEffect(() => {
    const loadAvatar = () => {
      api.getProfileAvatar()
        .then(({ url }) => setAvatarUrl(url))
        .catch(() => {/* ignore */});
    };

    loadAvatar();

    // Listen for avatar upload events
    const handleAvatarUpdate = () => loadAvatar();
    const handleNameUpdate = () => {
      // AuthProvider owns persisted name; this event currently only signals avatar/name may have changed.
      // We intentionally don't set local state here to avoid cascading renders.
    };

    window.addEventListener('avatar-updated', handleAvatarUpdate);
    window.addEventListener('user-name-updated', handleNameUpdate as EventListener);
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate);
      window.removeEventListener('user-name-updated', handleNameUpdate as EventListener);
    };
  }, []);

  const initial = (displayName?.[0] ?? 'U').toUpperCase();

  return (
    <Menu shadow="md" width={220} position="bottom-end">
      <Menu.Target>
        <UnstyledButton>
          <Group gap="xs" align="center">
            <Avatar src={avatarUrl ?? undefined} color="teal" radius="xl" size={28}>{initial}</Avatar>
            <Text size="sm" visibleFrom="sm" c="textSecondary">
              {displayName}
            </Text>
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Account</Menu.Label>
        <Menu.Item leftSection={<IconUser size={16} />} onClick={() => setCurrentPage('profile')}>
          Profile
        </Menu.Item>
        <Menu.Item leftSection={<IconSettings size={16} />} disabled>
          Settings (coming soon)
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={logout}>
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
