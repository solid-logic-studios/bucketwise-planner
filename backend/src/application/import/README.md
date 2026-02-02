# Importers (CSV/QIF)

## How to add a new import format (OCP guideline)
The import system is designed to follow the Open/Closed Principle (OCP):
you should **extend** it by adding a new importer and registering it,
without modifying use cases or controllers.

### Steps
1. Create a new importer that implements `BankCsvImporter`.
   - Implement `name`, `canHandle(headers, sampleRows)`, and `parse(content, options)`.
   - Keep parsing/normalization logic inside the importer (or a helper class).
2. Register the importer in `CsvImporterRegistry`.
   - The registry is the single extension point for new formats.
3. Add unit tests under `backend/tests/unit/application/import/<format>/`.
   - Cover parsing, normalization, and edge cases.

### Important
- Do **not** update `PreviewTransactionCsvImportUseCase` when adding formats.
  It should remain closed for modification and rely on the registry to resolve importers.
