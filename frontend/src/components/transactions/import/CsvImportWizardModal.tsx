import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Group,
  Modal,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Stepper,
  Switch,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import { IconAlertCircle, IconCheck, IconFileUpload, IconInfoCircle } from '@tabler/icons-react';
import type {
  CsvImportCommitRequest,
  CsvImportMapping,
  CsvImportPreviewResponse,
  CsvImportPreviewRequest,
} from '../../../api/types.js';
import { api } from '../../../api/client.js';
import { bucketOptions, type BucketType } from '../../../hooks/transactions/types.js';
import { formatCurrency } from '../../../utils/formatters.js';
import { ErrorAlert } from '../../ErrorAlert.js';
import { CsvImportPresetStore } from './csvImportPresetStore.js';
import {
  csvDelimiters,
  csvFormatOptions,
  dateFormatOptions,
  decimalSeparatorOptions,
  defaultColumnMapping,
  mappingModeOptions,
  summarizePreview,
  thousandsSeparatorOptions,
} from './csvImportUtils.js';

interface CsvImportWizardModalProps {
  opened: boolean;
  onClose: () => void;
  onCompleted: () => void;
  isHistoricalFortnight: boolean;
}

const defaultMapping: CsvImportMapping = {
  delimiter: ',',
  hasHeader: false,
  dateColumn: defaultColumnMapping.dateColumn,
  amountColumn: defaultColumnMapping.amountColumn,
  descriptionColumn: defaultColumnMapping.descriptionColumn,
  balanceColumn: defaultColumnMapping.balanceColumn,
  dateFormat: 'DD/MM/YYYY',
  decimalSeparator: '.',
  thousandsSeparator: ',',
};

export function CsvImportWizardModal({
  opened,
  onClose,
  onCompleted,
  isHistoricalFortnight,
}: CsvImportWizardModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formatPreset, setFormatPreset] = useState('cba-au');
  const [qifDateFormat, setQifDateFormat] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YY/MM/DD'>('DD/MM/YYYY');
  const [defaultBucket, setDefaultBucket] = useState<BucketType>('Daily Expenses');
  const [mappingMode, setMappingMode] = useState<'header' | 'index'>('index');
  const [mapping, setMapping] = useState<CsvImportMapping>(defaultMapping);
  const [preview, setPreview] = useState<CsvImportPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(() => new Set());
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState(CsvImportPresetStore.load());

  const previewStats = useMemo(() => summarizePreview(preview?.rows ?? []), [preview]);
  const importableRows = useMemo(
    () => (preview?.rows ?? []).filter((row) => row.errors.length === 0),
    [preview]
  );

  const importableRowIndices = useMemo(
    () => new Set(importableRows.map((row) => row.rowIndex)),
    [importableRows]
  );

  const selectedImportableRows = useMemo(
    () => importableRows.filter((row) => selectedRowIndices.has(row.rowIndex)),
    [importableRows, selectedRowIndices]
  );

  const selectionStats = useMemo(() => {
    const totalImportable = importableRows.length;
    const selected = selectedImportableRows.length;
    return {
      totalImportable,
      selected,
      allSelected: totalImportable > 0 && selected === totalImportable,
      someSelected: selected > 0 && selected < totalImportable,
    };
  }, [importableRows.length, selectedImportableRows.length]);

  const resetWizard = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setFormatPreset('cba-au');
    setQifDateFormat('DD/MM/YYYY');
    setDefaultBucket('Daily Expenses');
    setMappingMode('index');
    setMapping(defaultMapping);
    setPreview(null);
    setPreviewError(null);
    setCommitError(null);
    setSkipDuplicates(true);
    setSelectedRowIndices(new Set());
  };

  const handleClose = () => {
    if (!previewLoading && !commitLoading) {
      resetWizard();
      onClose();
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;
    if (formatPreset === 'custom' && activeStep === 0) {
      setActiveStep(1);
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const payload: CsvImportPreviewRequest = {
        formatPreset,
        mapping: formatPreset === 'custom' ? mapping : undefined,
        defaultBucket,
        qifDateFormat: formatPreset === 'qif' ? qifDateFormat : undefined,
      };
      const result = await api.previewTransactionCsvImport(selectedFile, payload);
      setPreview(result);
      setSelectedRowIndices(new Set(result.rows.filter((row) => row.errors.length === 0).map((row) => row.rowIndex)));
      setActiveStep(2);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Failed to preview CSV');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;
    setCommitLoading(true);
    setCommitError(null);

    try {
      const payload: CsvImportCommitRequest = {
        skipDuplicates,
        rows: selectedImportableRows.map((row) => ({
          rowIndex: row.rowIndex,
          occurredAt: row.occurredAt ?? '',
          kind: row.kind ?? 'expense',
          amountCents: row.amountCents ?? 0,
          description: row.description,
          sourceBucket: row.sourceBucket,
        })),
      };
      await api.commitTransactionCsvImport(payload);
      setActiveStep(3);
    } catch (error) {
      setCommitError(error instanceof Error ? error.message : 'Failed to import CSV');
    } finally {
      setCommitLoading(false);
    }
  };

  const updateMapping = (partial: Partial<CsvImportMapping>) => {
    setMapping((prev) => ({ ...prev, ...partial }));
  };

  const handlePresetSave = () => {
    if (!presetName.trim()) return;
    const next = CsvImportPresetStore.add({
      id: `${Date.now()}`,
      name: presetName.trim(),
      mapping,
    });
    setPresets(next);
    setPresetName('');
  };

  const handlePresetSelect = (id: string | null) => {
    if (!id) return;
    const preset = presets.find((item) => item.id === id);
    if (preset) {
      setMapping(preset.mapping);
      setMappingMode(preset.mapping.hasHeader ? 'header' : 'index');
    }
  };

  const handleRowBucketChange = (rowIndex: number, bucket: BucketType) => {
    setPreview((prev) =>
      prev
        ? {
            ...prev,
            rows: prev.rows.map((row) =>
              row.rowIndex === rowIndex ? { ...row, sourceBucket: bucket } : row
            ),
          }
        : prev
    );
  };

  const handleApplyBucketToAll = (bucket: BucketType) => {
    setPreview((prev) =>
      prev
        ? {
            ...prev,
            rows: prev.rows.map((row) => {
              const canUpdate =
                selectedRowIndices.size > 0
                  ? selectedRowIndices.has(row.rowIndex)
                  : row.errors.length === 0;
              return canUpdate ? { ...row, sourceBucket: bucket } : row;
            }),
          }
        : prev
    );
  };

  const toggleAllImportable = (checked: boolean) => {
    if (!preview) return;
    setSelectedRowIndices((prev) => {
      if (!checked) return new Set();
      const next = new Set(prev);
      importableRowIndices.forEach((idx) => next.add(idx));
      return next;
    });
  };

  const toggleRow = (rowIndex: number, checked: boolean) => {
    setSelectedRowIndices((prev) => {
      const next = new Set(prev);
      if (checked) next.add(rowIndex);
      else next.delete(rowIndex);
      return next;
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size="xl"
      title="Import transactions from CSV"
      overlayProps={{ blur: 2 }}
      closeOnClickOutside={!previewLoading && !commitLoading}
      closeOnEscape={!previewLoading && !commitLoading}
    >
      <Stack gap="lg">
        <Stepper active={activeStep} allowNextStepsSelect={false}>
          <Stepper.Step label="Upload" description="Select file">
            <Stack gap="md">
              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                Upload your bank CSV export. We will parse rows into income and expense transactions.
              </Alert>

              <SimpleGrid cols={2} spacing="md">
                <TextInput
                  label="CSV file"
                  placeholder="Choose a file"
                  readOnly
                  value={selectedFile?.name ?? ''}
                  rightSection={<IconFileUpload size={16} />}
                  onClick={() => document.getElementById('csv-import-input')?.click()}
                />
                <input
                  id="csv-import-input"
                  type="file"
                  accept=".csv,.qif,text/csv,text/plain"
                  hidden
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0] ?? null;
                    setSelectedFile(file);
                    if (file?.name?.toLowerCase().endsWith('.qif')) {
                      setFormatPreset('qif');
                    }
                  }}
                />

                <Select
                  label="Format"
                  data={csvFormatOptions}
                  value={formatPreset}
                  onChange={(value) => setFormatPreset(value || 'cba-au')}
                />
                {formatPreset === 'qif' && (
                  <Select
                    label="QIF date format"
                    data={[
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                      { value: 'YY/MM/DD', label: "YY/MM/DD (e.g. 26/01/31)" },
                    ]}
                    value={qifDateFormat}
                    onChange={(value) => setQifDateFormat((value || 'DD/MM/YYYY') as typeof qifDateFormat)}
                  />
                )}
                <Select
                  label="Default bucket"
                  data={bucketOptions.map((bucket) => ({ value: bucket, label: bucket }))}
                  value={defaultBucket}
                  onChange={(value) => setDefaultBucket(value as BucketType)}
                />
              </SimpleGrid>

              <Group justify="space-between">
                <Button variant="default" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePreview}
                  loading={previewLoading}
                  disabled={!selectedFile || isHistoricalFortnight}
                >
                  Preview
                </Button>
              </Group>
              {isHistoricalFortnight && (
                <Text size="sm" c="dimmed">
                  Imports are disabled for historical fortnights.
                </Text>
              )}
              {previewError && <ErrorAlert message={previewError} />}
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Mapping" description="Columns and formats">
            <Stack gap="md">
              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                Map CSV columns to required fields. Save presets to reuse the mapping later.
              </Alert>

              <SimpleGrid cols={2} spacing="md">
                <Select
                  label="Mapping mode"
                  data={mappingModeOptions}
                  value={mappingMode}
                  onChange={(value) => setMappingMode((value || 'index') as 'header' | 'index')}
                />
                <Select
                  label="Delimiter"
                  data={csvDelimiters}
                  value={mapping.delimiter}
                  onChange={(value) => updateMapping({ delimiter: (value || ',') as CsvImportMapping['delimiter'] })}
                />
                <Select
                  label="Date format"
                  data={dateFormatOptions}
                  value={mapping.dateFormat}
                  onChange={(value) => updateMapping({ dateFormat: value as CsvImportMapping['dateFormat'] })}
                />
                <Select
                  label="Decimal separator"
                  data={decimalSeparatorOptions}
                  value={mapping.decimalSeparator}
                  onChange={(value) => updateMapping({ decimalSeparator: value as CsvImportMapping['decimalSeparator'] })}
                />
                <Select
                  label="Thousands separator"
                  data={thousandsSeparatorOptions}
                  value={mapping.thousandsSeparator}
                  onChange={(value) => updateMapping({ thousandsSeparator: value as CsvImportMapping['thousandsSeparator'] })}
                />
                <Switch
                  label="First row is header"
                  checked={mapping.hasHeader}
                  onChange={(event) => updateMapping({ hasHeader: event.currentTarget.checked })}
                />
              </SimpleGrid>

              <SimpleGrid cols={2} spacing="md">
                <TextInput
                  label="Date column"
                  placeholder={mappingMode === 'header' ? 'Date' : '0'}
                  value={mapping.dateColumn.toString()}
                  onChange={(event) =>
                    updateMapping({
                      dateColumn:
                        mappingMode === 'header'
                          ? event.currentTarget.value
                          : Number(event.currentTarget.value),
                    })
                  }
                />
                <TextInput
                  label="Amount column"
                  placeholder={mappingMode === 'header' ? 'Amount' : '1'}
                  value={mapping.amountColumn.toString()}
                  onChange={(event) =>
                    updateMapping({
                      amountColumn:
                        mappingMode === 'header'
                          ? event.currentTarget.value
                          : Number(event.currentTarget.value),
                    })
                  }
                />
                <TextInput
                  label="Description column"
                  placeholder={mappingMode === 'header' ? 'Description' : '2'}
                  value={mapping.descriptionColumn.toString()}
                  onChange={(event) =>
                    updateMapping({
                      descriptionColumn:
                        mappingMode === 'header'
                          ? event.currentTarget.value
                          : Number(event.currentTarget.value),
                    })
                  }
                />
                <TextInput
                  label="Balance column (optional)"
                  placeholder={mappingMode === 'header' ? 'Balance' : '3'}
                  value={mapping.balanceColumn?.toString() ?? ''}
                  onChange={(event) =>
                    updateMapping({
                      balanceColumn:
                        mappingMode === 'header'
                          ? event.currentTarget.value
                          : Number(event.currentTarget.value),
                    })
                  }
                />
              </SimpleGrid>

              <Group justify="space-between">
                <Group gap="sm">
                  <Select
                    label="Load preset"
                    data={presets.map((preset) => ({ value: preset.id, label: preset.name }))}
                    value={null}
                    onChange={handlePresetSelect}
                  />
                  <TextInput
                    label="Save preset"
                    placeholder="Preset name"
                    value={presetName}
                    onChange={(event) => setPresetName(event.currentTarget.value)}
                  />
                  <Button variant="light" onClick={handlePresetSave}>
                    Save
                  </Button>
                </Group>
                <Group gap="sm">
                  <Button variant="default" onClick={() => setActiveStep(0)}>
                    Back
                  </Button>
                  <Button onClick={handlePreview} loading={previewLoading} disabled={!selectedFile}>
                    Preview
                  </Button>
                </Group>
              </Group>
              {previewError && <ErrorAlert message={previewError} />}
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Preview" description="Review & allocate">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Group gap="sm">
                  <Badge color="blue" variant="light">
                    Rows: {previewStats.total}
                  </Badge>
                  <Badge color={previewStats.errored > 0 ? 'red' : 'green'} variant="light">
                    Errors: {previewStats.errored}
                  </Badge>
                  <Badge color={previewStats.warnings > 0 ? 'yellow' : 'green'} variant="light">
                    Warnings: {previewStats.warnings}
                  </Badge>
                  <Badge color={selectionStats.selected > 0 ? 'blue' : 'gray'} variant="light">
                    Selected: {selectionStats.selected}
                  </Badge>
                </Group>
                <Group gap="sm">
                  <Select
                    label={selectedRowIndices.size > 0 ? 'Apply bucket to selected' : 'Apply bucket to valid'}
                    data={bucketOptions.map((bucket) => ({ value: bucket, label: bucket }))}
                    value={defaultBucket}
                    onChange={(value) => {
                      const bucket = value as BucketType;
                      setDefaultBucket(bucket);
                      handleApplyBucketToAll(bucket);
                    }}
                  />
                  <Switch
                    label="Skip duplicates"
                    checked={skipDuplicates}
                    onChange={(event) => setSkipDuplicates(event.currentTarget.checked)}
                  />
                </Group>
              </Group>

              <ScrollArea type="auto" h={420} offsetScrollbars>
                <Table striped highlightOnHover withColumnBorders style={{ minWidth: 980 }}>
                  <Table.Thead style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--mantine-color-body)' }}>
                    <Table.Tr>
                      <Table.Th style={{ width: 44 }}>
                        <Checkbox
                          aria-label="Select all valid rows"
                          checked={selectionStats.allSelected}
                          indeterminate={selectionStats.someSelected}
                          onChange={(event) => toggleAllImportable(event.currentTarget.checked)}
                        />
                      </Table.Th>
                      <Table.Th>Row</Table.Th>
                      <Table.Th style={{ width: 120 }}>Date</Table.Th>
                      <Table.Th style={{ minWidth: 280 }}>Description</Table.Th>
                      <Table.Th style={{ width: 110 }}>Kind</Table.Th>
                      <Table.Th style={{ width: 140 }}>Amount</Table.Th>
                      <Table.Th style={{ width: 200 }}>Bucket</Table.Th>
                      <Table.Th style={{ width: 120 }}>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {(preview?.rows ?? []).map((row) => (
                      <Table.Tr
                        key={row.rowIndex}
                        style={{
                          opacity:
                            row.errors.length === 0 && !selectedRowIndices.has(row.rowIndex) ? 0.55 : undefined,
                        }}
                      >
                        <Table.Td>
                          <Checkbox
                            aria-label={`Select row ${row.rowIndex}`}
                            checked={row.errors.length === 0 && selectedRowIndices.has(row.rowIndex)}
                            disabled={row.errors.length > 0}
                            onChange={(event) => toggleRow(row.rowIndex, event.currentTarget.checked)}
                          />
                        </Table.Td>
                        <Table.Td>{row.rowIndex}</Table.Td>
                        <Table.Td>{row.date ?? '-'}</Table.Td>
                        <Table.Td>
                          <Tooltip label={row.description} disabled={row.description.length < 40}>
                            <Text lineClamp={1}>{row.description}</Text>
                          </Tooltip>
                        </Table.Td>
                        <Table.Td>{row.kind ?? '-'}</Table.Td>
                        <Table.Td>{row.amountCents ? formatCurrency(row.amountCents) : '-'}</Table.Td>
                        <Table.Td>
                          <Select
                            data={bucketOptions.map((bucket) => ({ value: bucket, label: bucket }))}
                            value={row.sourceBucket}
                            onChange={(value) => handleRowBucketChange(row.rowIndex, value as BucketType)}
                            size="xs"
                          />
                        </Table.Td>
                        <Table.Td>
                          {row.errors.length > 0 ? (
                            <Tooltip label={row.errors.join('; ')}>
                              <Badge color="red" variant="light" leftSection={<IconAlertCircle size={12} />}>
                                Error
                              </Badge>
                            </Tooltip>
                          ) : row.warnings.length > 0 ? (
                            <Tooltip label={row.warnings.join('; ')}>
                              <Badge color="yellow" variant="light" leftSection={<IconInfoCircle size={12} />}>
                                Warning
                              </Badge>
                            </Tooltip>
                          ) : (
                            <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>
                              Ready
                            </Badge>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>

              {commitError && <ErrorAlert message={commitError} />}
              {previewStats.errored > 0 && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                  Rows with errors are not selectable and will not be imported.
                </Alert>
              )}

              <Group justify="space-between">
                <Button variant="default" onClick={() => setActiveStep(formatPreset === 'custom' ? 1 : 0)}>
                  Back
                </Button>
                <Button
                  onClick={handleCommit}
                  loading={commitLoading}
                  disabled={selectedImportableRows.length === 0 || isHistoricalFortnight}
                >
                  Import {selectedImportableRows.length} rows
                </Button>
              </Group>
            </Stack>
          </Stepper.Step>

          <Stepper.Completed>
            <Stack gap="md">
              <Alert icon={<IconCheck size={16} />} color="green" variant="light">
                Import completed. Refreshing transactions now.
              </Alert>
              <Group justify="space-between">
                <Button variant="default" onClick={handleClose}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleClose();
                    onCompleted();
                  }}
                >
                  Refresh Transactions
                </Button>
              </Group>
            </Stack>
          </Stepper.Completed>
        </Stepper>
      </Stack>
    </Modal>
  );
}
