import {
  ActionIcon,
  Avatar,
  Button,
  Card,
  FileInput,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useHotkeys } from '@mantine/hooks';
import { IconDeviceFloppy, IconPlus, IconQuestionMark, IconTrash, IconUpload } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import type { ProfileDTO } from '../api/types.js';
import { ErrorAlert } from '../components/ErrorAlert.js';
import { useHelp } from '../components/HelpDrawer.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { formatCurrency } from '../utils/formatters.js';

const bucketOptions = [
  'Daily Expenses',
  'Splurge',
  'Smile',
  'Fire Extinguisher',
  'Mojo',
  'Grow',
] as const;

interface FixedExpenseForm {
  id?: string;
  name: string;
  bucket: (typeof bucketOptions)[number];
  amountDollars: number;
}

interface ProfileFormValues {
  fortnightlyIncomeDollars: number;
  defaultFireExtinguisherPercent: number;
  timezone: string;
  fixedExpenses: FixedExpenseForm[];
}

interface ProfilePayload {
  fortnightlyIncomeCents: number;
  defaultFireExtinguisherPercent: number;
  timezone: string;
  fixedExpenses: Array<{
    id?: string;
    name: string;
    bucket: (typeof bucketOptions)[number];
    amountCents: number;
  }>;
}

function mapDtoToForm(dto: ProfileDTO): ProfileFormValues {
  return {
    fortnightlyIncomeDollars: dto.fortnightlyIncomeCents / 100,
    defaultFireExtinguisherPercent: dto.defaultFireExtinguisherPercent,
    timezone: dto.timezone || 'UTC',
    fixedExpenses: dto.fixedExpenses.map((fx) => ({
      id: fx.id,
      name: fx.name,
      bucket: fx.bucket as FixedExpenseForm['bucket'],
      amountDollars: fx.amountCents / 100,
    })),
  };
}

function mapFormToPayload(values: ProfileFormValues): ProfilePayload {
  return {
    fortnightlyIncomeCents: Math.round(values.fortnightlyIncomeDollars * 100),
    defaultFireExtinguisherPercent: values.defaultFireExtinguisherPercent,
    timezone: values.timezone,
    fixedExpenses: values.fixedExpenses.map((fx) => ({
      id: fx.id,
      name: fx.name,
      bucket: fx.bucket,
      amountCents: Math.round(fx.amountDollars * 100),
    })),
  };
}

export function ProfileView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const { openHelp } = useHelp();
  useHotkeys([
    ['mod+/', () => openHelp('profile')],
  ]);

  const form = useForm<ProfileFormValues>({
    initialValues: {
      fortnightlyIncomeDollars: 0,
      defaultFireExtinguisherPercent: 0,
      timezone: 'UTC',
      fixedExpenses: [],
    },
    validate: {
      fortnightlyIncomeDollars: (value) => (value < 0 ? 'Income must be zero or greater' : null),
      defaultFireExtinguisherPercent: (value) => (value < 0 || value > 100 ? 'Percent must be between 0 and 100' : null),
      timezone: (value) => (!value ? 'Timezone is required' : null),
      fixedExpenses: {
        name: (value) => (!value.trim() ? 'Name is required' : null),
        amountDollars: (value) => (value <= 0 ? 'Amount must be greater than 0' : null),
      },
    },
  });

  useEffect(() => {
    let cancelled = false;
    api
      .getProfile()
      .then((dto) => {
        if (cancelled) return;
        form.setValues(mapDtoToForm(dto));
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        setLoading(false);
      });

    // Load user profile
    api
      .getUserProfile()
      .then((user) => {
        if (cancelled) return;
        setUserName(user.name);
        setUserEmail(user.email);
      })
      .catch(() => {
        // ignore errors
      });

    // Load avatar URL if present
    api
      .getProfileAvatar()
      .then(({ url }) => {
        if (cancelled) return;
        setAvatarUrl(url);
      })
      .catch(() => {
        // ignore avatar errors
      });

    return () => {
        cancelled = true;
    };
  }, []);

  const handleAddFixedExpense = () => {
    form.insertListItem('fixedExpenses', {
      id: crypto.randomUUID(),
      name: '',
      bucket: bucketOptions[0],
      amountDollars: 0,
    });
  };

  const handleRemoveFixedExpense = (index: number) => {
    form.removeListItem('fixedExpenses', index);
  };

  const handleSubmit = async (values: ProfileFormValues) => {
    setSaving(true);
    setError(undefined);

    try {
      const payload = mapFormToPayload(values);
      const saved = await api.updateProfile(payload);
      form.setValues(mapDtoToForm(saved));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;

    // Resize and compress image to max 256x256 before upload
    const resizeImage = (file: File, maxSize: number = 256): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }

            // Calculate dimensions (maintain aspect ratio, fit within maxSize)
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
              }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to Blob with 0.8 quality for compression
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to create image blob'));
                }
              },
              'image/jpeg',
              0.8
            );
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    };

    try {
      const resizedBlob = await resizeImage(avatarFile, 256);
      const { url } = await api.uploadProfileAvatar(resizedBlob);
      setAvatarUrl(url);
      setAvatarFile(null);
      setError(undefined);
      // Notify ProfileMenu to refresh avatar
      window.dispatchEvent(new Event('avatar-updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    }
  };

  const handleSaveName = async () => {
    try {
      const result = await api.updateUserProfile({ name: tempName });
      setUserName(result.name);
      setEditingName(false);
      setError(undefined);
      // Update localStorage and dispatch event for ProfileMenu
      localStorage.setItem('userName', result.name);
      window.dispatchEvent(new CustomEvent('user-name-updated', { detail: { name: result.name } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update name');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const computedFireExtinguisherCents = Math.floor(
    Math.max(form.values.fortnightlyIncomeDollars, 0) * 100 * (Math.max(form.values.defaultFireExtinguisherPercent, 0) / 100)
  );

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between" align="center">
        <Group gap="xs" align="center">
          <Title order={2}>Profile</Title>
          <Tooltip label="Open Profile help (⌘/Ctrl + /)" withArrow position="bottom">
            <ActionIcon variant="light" onClick={() => openHelp('profile')} aria-label="Open help">
              <IconQuestionMark size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Button leftSection={<IconDeviceFloppy size={16} />} loading={saving} onClick={() => form.onSubmit(handleSubmit)()}>
          Save Profile
        </Button>
      </Group>

      {error && <ErrorAlert title="Error" message={error} />}

      {/* User Profile Card */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={4}>User Profile</Title>
          <Group align="center" gap="md">
            <Avatar src={avatarUrl ?? undefined} radius="xl" size={64} color="teal">
              {!avatarUrl && (userName?.[0] ?? 'U').toUpperCase()}
            </Avatar>
            <Stack gap="xs" style={{ flex: 1 }}>
              {!editingName ? (
                <Group>
                  <Text size="lg" fw={600}>{userName || 'User'}</Text>
                  <Button size="xs" variant="light" onClick={() => { setEditingName(true); setTempName(userName); }}>
                    Edit
                  </Button>
                </Group>
              ) : (
                <Group>
                  <TextInput
                    value={tempName}
                    onChange={(e) => setTempName(e.currentTarget.value)}
                    placeholder="Your name"
                    style={{ flex: 1 }}
                  />
                  <Button size="xs" onClick={handleSaveName}>Save</Button>
                  <Button size="xs" variant="subtle" onClick={() => setEditingName(false)}>Cancel</Button>
                </Group>
              )}
              <Text size="sm" c="dimmed">{userEmail}</Text>
              <FileInput
                label="Upload avatar"
                description="Images are automatically resized to 256x256"
                placeholder="Select image file (PNG/JPEG)"
                accept="image/png,image/jpeg"
                value={avatarFile}
                onChange={setAvatarFile}
                clearable
              />
              <Button size="xs" leftSection={<IconUpload size={16} />} onClick={handleUploadAvatar} disabled={!avatarFile}>
                Upload Avatar
              </Button>
            </Stack>
          </Group>
        </Stack>
      </Card>

      {/* Budget Configuration Card */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={4}>Budget Configuration</Title>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <NumberInput
              label="Fortnightly Income (AUD)"
              description="Your typical take-home amount every two weeks"
              min={0}
              decimalScale={2}
              fixedDecimalScale
              prefix="$"
              required
              {...form.getInputProps('fortnightlyIncomeDollars')}
            />

            <NumberInput
              label="Default Fire Extinguisher (%)"
              description="Percent of your fortnightly income allocated to fire extinguisher"
              min={0}
              max={100}
              decimalScale={2}
              fixedDecimalScale
              suffix="%"
              required
              {...form.getInputProps('defaultFireExtinguisherPercent')}
            />

            <Text size="sm" c="dimmed">
              ≈ {formatCurrency(computedFireExtinguisherCents)} per fortnight at this percent
            </Text>
              {/* TODO: This should not be hardcoded, should pull from a source or static file */}
            <Select
              label="Timezone"
              description="Your local timezone for accurate transaction date boundaries"
              required
              searchable
              data={[
                { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
                { value: 'Australia/Melbourne', label: 'Australia/Melbourne (AEDT/AEST)' },
                { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT/AEST)' },
                { value: 'Australia/Brisbane', label: 'Australia/Brisbane (AEST)' },
                { value: 'Australia/Perth', label: 'Australia/Perth (AWST)' },
                { value: 'Europe/Copenhagen', label: 'Europe/Copenhagen (CEST/CET)' },
                { value: 'Europe/London', label: 'Europe/London (BST/GMT)' },
                { value: 'Europe/Paris', label: 'Europe/Paris (CEST/CET)' },
                { value: 'America/New_York', label: 'America/New_York (EDT/EST)' },
                { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PDT/PST)' },
                { value: 'America/Chicago', label: 'America/Chicago (CDT/CST)' },
                { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
                { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
                { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZDT/NZST)' },
              ]}
              {...form.getInputProps('timezone')}
            />

            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Text fw={600}>Fixed Expenses</Text>
                <Button leftSection={<IconPlus size={16} />} variant="light" onClick={handleAddFixedExpense}>
                  Add Expense
                </Button>
              </Group>

              {form.values.fixedExpenses.length === 0 && (
                <Text size="sm" c="dimmed">
                  No fixed expenses yet. Add your recurring bills to see them here.
                </Text>
              )}

              {form.values.fixedExpenses.map((expense, index) => (
                <Card key={expense.id ?? index} withBorder radius="md" shadow="xs" padding="md">
                  <Stack gap="sm">
                    <Group justify="space-between" align="flex-start">
                      <Text fw={600}>Expense {index + 1}</Text>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleRemoveFixedExpense(index)}
                        aria-label="Remove expense"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>

                    <TextInput
                      label="Name"
                      placeholder="e.g., Rent"
                      required
                      {...form.getInputProps(`fixedExpenses.${index}.name`)}
                    />

                    <Group grow align="flex-start">
                      <Select
                        label="Bucket"
                        required
                        data={bucketOptions.map((bucket) => ({ value: bucket, label: bucket }))}
                        {...form.getInputProps(`fixedExpenses.${index}.bucket`)}
                      />

                      <NumberInput
                        label="Amount (AUD)"
                        min={0}
                        decimalScale={2}
                        fixedDecimalScale
                        prefix="$"
                        required
                        {...form.getInputProps(`fixedExpenses.${index}.amountDollars`)}
                      />
                    </Group>
                  </Stack>
                </Card>
              ))}
            </Stack>

            <Group justify="flex-end">
              <Button type="submit" loading={saving} leftSection={<IconDeviceFloppy size={16} />}>
                Save Profile
              </Button>
            </Group>
          </Stack>
        </form>
        </Stack>
      </Card>
    </Stack>
  );
}
