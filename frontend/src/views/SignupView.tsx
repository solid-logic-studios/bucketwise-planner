import { Anchor, Button, Card, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { useState } from 'react';
import { useAuth } from '../contexts/useAuth.ts';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;

  if (typeof err === 'object' && err !== null && 'message' in err) {
    const maybeMessage = (err as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage;
  }

  return 'Signup failed';
}

interface SignupViewProps {
  onSwitch: () => void;
}

export function SignupView({ onSwitch }: SignupViewProps) {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(email, name, password);
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
        <Title order={3}>Create your account</Title>
        <Text size="sm" c="dimmed">Start budgeting with Barefoot</Text>
        <TextInput
          label="Name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
        />
        <TextInput
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          required
        />
        <PasswordInput
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          required
        />
        {error && (
          <Text c="red" size="sm">{error}</Text>
        )}
        <Button type="submit" loading={loading} fullWidth>
          Sign Up
        </Button>
        <Text size="sm" ta="center">
          Already have an account?{' '}
          <Anchor component="button" type="button" onClick={onSwitch}>
            Log in
          </Anchor>
        </Text>
        </Stack>
      </form>
    </Card>
  );
}
