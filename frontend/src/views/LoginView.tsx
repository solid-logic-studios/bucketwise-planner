import { Anchor, Button, Card, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { useState } from 'react';
import { useAuth } from '../contexts/useAuth.ts';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;

  if (typeof err === 'object' && err !== null && 'message' in err) {
    const maybeMessage = (err as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage;
  }

  return 'Login failed';
}

interface LoginViewProps {
  onSwitch: () => void;
}

export function LoginView({ onSwitch }: LoginViewProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shadow="md" padding="xl" radius="md" maw={420} mx="auto" mt="xl">
      <form onSubmit={handleSubmit}>
        <Stack>
        <Title order={3}>Welcome back</Title>
        <Text size="sm" c="dimmed">Sign in to access your budget</Text>
        <TextInput
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          required
        />
        <PasswordInput
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          required
        />
        {error && (
          <Text c="red" size="sm">{error}</Text>
        )}
        <Button type="submit" loading={loading} fullWidth>
          Log In
        </Button>
        <Text size="sm" ta="center">
          Don’t have an account?{' '}
          <Anchor component="button" type="button" onClick={onSwitch}>
            Sign up
          </Anchor>
        </Text>
        </Stack>
      </form>
    </Card>
  );
}
