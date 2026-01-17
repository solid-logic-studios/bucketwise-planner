import type { Application } from 'express';
import express, { json, urlencoded } from 'express';
import * as path from 'node:path';
import { CalculateMortgageOverpaymentPlanUseCase } from '../../application/use-cases/calculate-mortgage-overpayment-plan.use-case.js';
import { CreateDebtUseCase } from '../../application/use-cases/create-debt.use-case.js';
import { CreateFortnightUseCase } from '../../application/use-cases/create-fortnight.use-case.js';
import { DeleteTransactionUseCase } from '../../application/use-cases/delete-transaction.use-case.js';
import { ExportDataUseCase } from '../../application/use-cases/export-data.use-case.js';
import { GetDashboardUseCase } from '../../application/use-cases/get-dashboard.use-case.js';
import { GetDebtPayoffPlanUseCase } from '../../application/use-cases/get-debt-payoff-plan.use-case.js';
import { GetFortnightUseCase } from '../../application/use-cases/get-fortnight.use-case.js';
import { GetMortgageUseCase } from '../../application/use-cases/get-mortgage.use-case.js';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case.js';
import { ListDebtsUseCase } from '../../application/use-cases/list-debts.use-case.js';
import { ListForthnightsUseCase } from '../../application/use-cases/list-fortnights.use-case.js';
import { ListSkippedDebtPaymentsUseCase } from '../../application/use-cases/list-skipped-debt-payments.use-case.js';
import { ListTransactionsUseCase } from '../../application/use-cases/list-transactions.use-case.js';
import { LoginUseCase } from '../../application/use-cases/login.use-case.js';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case.js';
import { RecordTransactionUseCase } from '../../application/use-cases/record-transaction.use-case.js';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case.js';
import { SendChatMessageUseCase } from '../../application/use-cases/send-chat-message.use-case.js';
import { SignupUseCase } from '../../application/use-cases/signup.use-case.js';
import { SkipDebtPaymentUseCase } from '../../application/use-cases/skip-debt-payment.use-case.js';
import { UpdateDebtUseCase } from '../../application/use-cases/update-debt.use-case.js';
import { UpdateTransactionUseCase } from '../../application/use-cases/update-transaction.use-case.js';
import { UpsertMortgageUseCase } from '../../application/use-cases/upsert-mortgage.use-case.js';
import { UpsertProfileUseCase } from '../../application/use-cases/upsert-profile.use-case.js';
import { BarefootAdvisorService } from '../../domain/services/barefoot-advisor.service.js';
import { GeminiAiProvider } from '../../infrastructure/ai/gemini-ai-provider.js';
import { BcryptPasswordService } from '../../infrastructure/auth/BcryptPasswordService.js';
import { JsonWebTokenProvider } from '../../infrastructure/auth/JsonWebTokenProvider.js';
import { TokenBlacklist } from '../../infrastructure/auth/TokenBlacklist.js';
import { runMigrations } from '../../infrastructure/database/migrations.js';
import { createPgPool, ensureSchema } from '../../infrastructure/database/pg.js';
import { MemoryBudgetProfileRepository } from '../../infrastructure/persistence/memory/memory-budget-profile.repository.js';
import { MemoryDebtRepository } from '../../infrastructure/persistence/memory/memory-debt.repository.js';
import { MemoryFortnightSnapshotRepository } from '../../infrastructure/persistence/memory/memory-fortnight-snapshot.repository.js';
import { MemorySkippedDebtPaymentRepository } from '../../infrastructure/persistence/memory/memory-skipped-debt-payment.repository.js';
import { MemoryTransactionRepository } from '../../infrastructure/persistence/memory/memory-transaction.repository.js';
import { MemoryUnitOfWork } from '../../infrastructure/persistence/memory/memory-unit-of-work.js';
import { MemoryUserRepository } from '../../infrastructure/persistence/memory/memory-user.repository.js';
import { PostgresBudgetProfileRepository } from '../../infrastructure/persistence/postgres/postgres-budget-profile.repository.js';
import { PostgresDebtRepository } from '../../infrastructure/persistence/postgres/postgres-debt.repository.js';
import { PostgresFortnightSnapshotRepository } from '../../infrastructure/persistence/postgres/postgres-fortnight-snapshot.repository.js';
import { PostgresSkippedDebtPaymentRepository } from '../../infrastructure/persistence/postgres/postgres-skipped-debt-payment.repository.js';
import { PostgresTransactionRepository } from '../../infrastructure/persistence/postgres/postgres-transaction.repository.js';
import { PostgresUserRepository } from '../../infrastructure/persistence/postgres/postgres-user.repository.js';
import { AdminExportController } from './controllers/admin.export.controller.js';
import { AuthController } from './controllers/auth.controller.js';
import { ChatController } from './controllers/chat.controller.js';
import { DashboardController } from './controllers/dashboard.controller.js';
import { DebtController } from './controllers/debt.controller.js';
import { FortnightController } from './controllers/fortnight.controller.js';
import { ProfileController } from './controllers/profile.controller.js';
import { TransactionController } from './controllers/transaction.controller.js';
import { createAuthMiddleware } from './middleware/auth.middleware.js';
import { contentTypeMiddleware, corsPrefixMiddleware, requestLoggingMiddleware } from './middlewares/common.middleware.js';
import { globalErrorMiddleware, notFoundMiddleware } from './middlewares/error.middleware.js';
import { buildAdminRouter } from './routes/admin.routes.js';
import { buildAuthRouter } from './routes/auth.routes.js';
import { buildChatRouter } from './routes/chat.routes.js';
import { buildDashboardRouter } from './routes/dashboard.routes.js';
import { buildDebtRouter } from './routes/debt.routes.js';
import { buildFortnightRouter, buildTransactionRouter } from './routes/fortnight.routes.js';
import { buildProfileRouter } from './routes/profile.routes.js';
import { buildTransactionRouter as buildRecordTransactionRouter } from './routes/transaction.routes.js';

/**
 * createApp: Composition root for the HTTP API.
 * Wires repositories, use-cases, controllers, and middleware into an Express app.
 */
export async function createApp(): Promise<Application> {
  const storageMethod = (process.env.STORAGE_METHOD || 'memory').toLowerCase();

  const isPostgres = storageMethod === 'postgres';

  const pool = isPostgres ? createPgPool() : null;

  if (pool) {
    await ensureSchema(pool);
    await runMigrations(pool);
  }

  // Log storage strategy for visibility
  console.log(`Storage method: ${isPostgres ? 'postgres' : 'memory'}`);

  // Repositories
  const transactionRepo = isPostgres && pool
    ? new PostgresTransactionRepository(pool)
    : new MemoryTransactionRepository();

  const fortnightRepo = isPostgres && pool
    ? new PostgresFortnightSnapshotRepository(pool)
    : new MemoryFortnightSnapshotRepository();

  const debtRepo = isPostgres && pool
    ? new PostgresDebtRepository(pool)
    : new MemoryDebtRepository();

  const skippedDebtPaymentRepo = isPostgres && pool
    ? new PostgresSkippedDebtPaymentRepository(pool)
    : new MemorySkippedDebtPaymentRepository();

  const profileRepo = isPostgres && pool
    ? new PostgresBudgetProfileRepository(pool)
    : new MemoryBudgetProfileRepository();

  const userRepo = isPostgres && pool
    ? new PostgresUserRepository(pool)
    : new MemoryUserRepository();

  const unitOfWork = new MemoryUnitOfWork();

  // Application layer - Use cases
  const recordTransactionUseCase = new RecordTransactionUseCase(transactionRepo, debtRepo);
  const updateTransactionUseCase = new UpdateTransactionUseCase(transactionRepo);
  const deleteTransactionUseCase = new DeleteTransactionUseCase(transactionRepo);
  const createFortnightUseCase = new CreateFortnightUseCase(fortnightRepo);
  const getFortnightUseCase = new GetFortnightUseCase(fortnightRepo, transactionRepo, profileRepo);
  const listForthnightsUseCase = new ListForthnightsUseCase(fortnightRepo, transactionRepo);
  const listTransactionsUseCase = new ListTransactionsUseCase(transactionRepo);
  const listSkippedDebtPaymentsUseCase = new ListSkippedDebtPaymentsUseCase(skippedDebtPaymentRepo);
  const getDebtPayoffPlanUseCase = new GetDebtPayoffPlanUseCase(debtRepo, fortnightRepo, transactionRepo);
  const createDebtUseCase = new CreateDebtUseCase(debtRepo);
  const listDebtsUseCase = new ListDebtsUseCase(debtRepo);
  const updateDebtUseCase = new UpdateDebtUseCase(debtRepo);
  const skipDebtPaymentUseCase = new SkipDebtPaymentUseCase(debtRepo, skippedDebtPaymentRepo);
  const getDashboardUseCase = new GetDashboardUseCase(fortnightRepo, debtRepo, transactionRepo);
  const getProfileUseCase = new GetProfileUseCase(profileRepo);
  const upsertProfileUseCase = new UpsertProfileUseCase(profileRepo);
  // Mortgage use cases
  const getMortgageUseCase = new GetMortgageUseCase(debtRepo);
  const upsertMortgageUseCase = new UpsertMortgageUseCase(debtRepo);
  const calculateMortgageOverpaymentPlanUseCase = new CalculateMortgageOverpaymentPlanUseCase(debtRepo);

  // AI Chat feature (optional, only initialize if enabled and API key provided)
  let sendChatMessageUseCase: SendChatMessageUseCase | null = null;
  const aiEnabled = process.env.AI_ENABLED === 'true';
  const apiKey = process.env.GEMINI_API_KEY;

  if (aiEnabled && apiKey) {
    const advisorService = new BarefootAdvisorService();
    const systemInstruction = advisorService.getSystemPrompt(); // Get strict Barefoot methodology
    const aiProvider = new GeminiAiProvider(apiKey, systemInstruction);
    sendChatMessageUseCase = new SendChatMessageUseCase(
      profileRepo,
      debtRepo,
      fortnightRepo,
      aiProvider
    );
    console.log('AI Chat advisor enabled');
  } else if (aiEnabled && !apiKey) {
    console.warn('AI_ENABLED=true but GEMINI_API_KEY not set. AI Chat advisor disabled. To enable, set both AI_ENABLED=true and GEMINI_API_KEY.');
  }

  // Controllers
  const transactionController = new TransactionController(recordTransactionUseCase, updateTransactionUseCase, deleteTransactionUseCase);
  const fortnightController = new FortnightController(
    createFortnightUseCase,
    getFortnightUseCase,
    listForthnightsUseCase,
    listTransactionsUseCase,
    listSkippedDebtPaymentsUseCase
  );
  const debtController = new DebtController(
    getDebtPayoffPlanUseCase,
    createDebtUseCase,
    listDebtsUseCase,
    updateDebtUseCase,
    skipDebtPaymentUseCase,
    getMortgageUseCase,
    upsertMortgageUseCase,
    calculateMortgageOverpaymentPlanUseCase
  );
  const dashboardController = new DashboardController(getDashboardUseCase);
  const profileController = new ProfileController(getProfileUseCase, upsertProfileUseCase, userRepo);
  const chatController = sendChatMessageUseCase ? new ChatController(sendChatMessageUseCase) : null;

  // Routers
  const recordTransactionRouter = buildRecordTransactionRouter(transactionController);
  const fortnightRouter = buildFortnightRouter(fortnightController);
  const transactionQueryRouter = buildTransactionRouter(fortnightController);
  const debtRouter = buildDebtRouter(debtController);
  const dashboardRouter = buildDashboardRouter(dashboardController);
  const profileRouter = buildProfileRouter(profileController);
  const chatRouter = chatController ? buildChatRouter(chatController) : null;
  const exportDataUseCase = new ExportDataUseCase(pool);
  const adminExportController = new AdminExportController(exportDataUseCase);
  const adminRouter = buildAdminRouter(adminExportController);

  // Auth wiring
  const jwtProvider = new JsonWebTokenProvider();
  const passwordService = new BcryptPasswordService();
  const blacklist = new TokenBlacklist();
  const signupUC = new SignupUseCase(userRepo, passwordService, jwtProvider);
  const loginUC = new LoginUseCase(userRepo, passwordService, jwtProvider);
  const logoutUC = new LogoutUseCase(blacklist);
  const refreshUC = new RefreshTokenUseCase(jwtProvider);
  const authController = new AuthController(signupUC, loginUC, logoutUC, refreshUC);
  const authRouter = buildAuthRouter(authController);

  const app = express();

  // Global middlewares
  app.use(requestLoggingMiddleware);
  app.use(corsPrefixMiddleware);
  app.use(contentTypeMiddleware);
  // Increase JSON body limit to support base64 image uploads (avatars)
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ extended: true, limit: '2mb' }));

  // Static file serving for uploaded assets (e.g., avatars)
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  // Public routes (no auth)
  app.use('/auth', authRouter);

  // Auth middleware for protected /api/* routes
  const authMiddleware = createAuthMiddleware(jwtProvider, blacklist);
  app.use('/api', authMiddleware);

  // Protected API routes
  app.use('/api/transactions', recordTransactionRouter);
  app.use('/api/transactions', transactionQueryRouter);
  app.use('/api/fortnights', fortnightRouter);
  app.use('/api/debts', debtRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/profile', profileRouter);
  if (chatRouter) {
    app.use('/api/chat', chatRouter);
  }
  app.use('/api/admin', adminRouter);

  // Health check endpoint (no auth required)
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404 handler
  app.use(notFoundMiddleware);
  // Error handler
  app.use(globalErrorMiddleware);

  return app;
}

