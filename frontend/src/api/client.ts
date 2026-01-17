import type {
    ApiResponse,
    ChatResponseDTO,
    DashboardDTO,
    DebtDTO,
    DebtPayoffPlanDTO,
    ForthnightSummaryDTO,
    FortnightDetailDTO,
    MortgageDTO,
    MortgageOverpaymentPlanDTO,
    ProfileDTO,
    SendChatMessageRequest,
    SkippedDebtPaymentDTO,
    TransactionDTO,
    UpsertMortgageRequest,
} from './types.ts';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const AUTH_BASE = import.meta.env.VITE_AUTH_BASE || '/auth';

let accessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
let refreshToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

export function setAuthTokens(tokens: { accessToken: string; refreshToken: string }): void {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }
}

export function clearAuthTokens(): void {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshToken) return null;
  const response = await fetch(`${AUTH_BASE}/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-refresh-token': refreshToken,
    },
  });
  if (!response.ok) return null;
  const json = (await response.json()) as ApiResponse<{ accessToken: string }>;
  if (!json.success || !json.data?.accessToken) return null;
  accessToken = json.data.accessToken;
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', json.data.accessToken);
  }
  return accessToken;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(
  path: string,
  method: HttpMethod,
  body?: unknown,
  searchParams?: Record<string, string | number | undefined>,
  retry = false
): Promise<T> {
  let url = `${API_BASE}${path}`;
  if (searchParams) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined) {
        params.set(key, String(value));
      }
    });
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 401 && !retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, method, body, searchParams, true);
    }
  }

  if (!response.ok) {
    // Try to read server error body for more context
    try {
      const errJson = (await response.json()) as ApiResponse<unknown>;
      const serverMessage = errJson?.error?.message;
      if (serverMessage) {
        throw new Error(serverMessage);
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as ApiResponse<T>;
  if (!json.success) {
    const message = json.error?.message || 'Unknown error';
    throw new Error(message);
  }

  if (json.data === undefined) {
    throw new Error('No data returned');
  }

  return json.data;
}

async function requestAuth<T>(path: string, method: HttpMethod, body?: unknown): Promise<T> {
  const url = `${AUTH_BASE}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    try {
      const errJson = (await response.json()) as ApiResponse<unknown>;
      const serverMessage = errJson?.error?.message;
      if (serverMessage) {
        throw new Error(serverMessage);
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as ApiResponse<T>;
  if (!json.success) {
    const message = json.error?.message || 'Unknown error';
    throw new Error(message);
  }
  if (json.data === undefined) {
    throw new Error('No data returned');
  }
  return json.data;
}

export const api = {
  signup: (input: { email: string; name: string; password: string }) =>
    requestAuth<{ accessToken: string; refreshToken: string; user: { email: string; name: string } }>('/signup', 'POST', input),

  login: (input: { email: string; password: string }) =>
    requestAuth<{ accessToken: string; refreshToken: string; user: { email: string; name: string } }>('/login', 'POST', input),

  logout: () => requestAuth<{ success: boolean }>('/logout', 'POST'),

  getDashboard: (currentFortnightId?: string) =>
    request<DashboardDTO>('/dashboard', 'GET', undefined, { currentFortnightId }),

  getFortnight: (id: string) =>
    request<FortnightDetailDTO>(`/fortnights/${encodeURIComponent(id)}`, 'GET'),

  listFortnights: () => request<ForthnightSummaryDTO[]>('/fortnights', 'GET'),

  createFortnight: (input: {
    periodStart: string;
    periodEnd: string;
    allocations: Array<{ bucket: string; percent: number }>;
  }) => request<{ fortnightId: string }>('/fortnights', 'POST', input),

  listTransactions: (params?: { 
    bucket?: string; 
    fortnightId?: string;
    startDate?: string;
    endDate?: string;
    kind?: string;
    limit?: number;
    offset?: number;
  }) =>
    request<{ transactions: TransactionDTO[]; total: number; limit: number; offset: number }>(
      '/transactions',
      'GET',
      undefined,
      params || {}
    ),

  recordTransaction: (input: {
    sourceBucket: string;
    destinationBucket?: string | null;
    kind: string;
    description: string;
    amountCents: number;
    occurredAt: string;
    tags?: string[];
    debtId?: string;
  }) => request<{ transactionId: string; success: boolean }>('/transactions', 'POST', input),

  updateTransaction: (
    id: string,
    input: {
      sourceBucket: string;
      destinationBucket?: string | null;
      kind: string;
      description: string;
      amountCents: number;
      occurredAt: string;
      tags?: string[];
    }
  ) => request<TransactionDTO>(`/transactions/${encodeURIComponent(id)}`, 'PUT', input),

  deleteTransaction: (id: string) =>
    request<{ success: boolean }>(`/transactions/${encodeURIComponent(id)}`, 'DELETE'),

  getDebtPayoffPlan: (
    fortnightlyFireExtinguisherCents: number,
    startDate?: Date,
    currentFortnightId?: string
  ) =>
    request<DebtPayoffPlanDTO>(
      '/debts/payoff-plan',
      'GET',
      undefined,
      { 
        fortnightlyFireExtinguisherCents,
        startDate: startDate ? startDate.toISOString().split('T')[0] : undefined,
        currentFortnightId,
      }
    ),

  listDebts: () => request<DebtDTO[]>('/debts', 'GET'),

  createDebt: (input: {
    name: string;
    debtType: string;
    originalAmountCents: number;
    currentBalanceCents: number;
    interestRate: number;
    minimumPaymentCents: number;
    priority?: number;
  }) => request<{ debtId: string }>('/debts', 'POST', input),

  updateDebt: (
    id: string,
    input: {
      name: string;
      debtType: string;
      originalAmountCents: number;
      currentBalanceCents: number;
      interestRate: number;
      minimumPaymentCents: number;
      priority?: number;
    }
  ) => request<{ success: boolean }>(`/debts/${encodeURIComponent(id)}`, 'PUT', input),

  getProfile: () => request<ProfileDTO>('/profile', 'GET'),

  updateProfile: (input: {
    fortnightlyIncomeCents: number;
    defaultFireExtinguisherPercent: number;
    fixedExpenses: Array<{ id?: string; name: string; bucket: string; amountCents: number }>;
  }) => request<ProfileDTO>('/profile', 'PUT', input),

  // User profile (name)
  getUserProfile: () => request<{ email: string; name: string }>('/profile/user', 'GET'),
  updateUserProfile: (input: { name: string }) => request<{ email: string; name: string }>('/profile/user', 'PUT', input),

  // Profile avatar
  getProfileAvatar: () => request<{ url: string | null }>('/profile/avatar', 'GET'),
  uploadProfileAvatar: async (file: Blob): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('avatar', file, 'avatar.jpg');
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE}/profile/avatar`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }
    const result = await response.json();
    return result.data;
  },

  skipDebtPayment: (
    debtId: string,
    input: {
      fortnightId: string;
      paymentDate: string;
      amountCents: number;
      skipReason?: string;
    }
  ) => request<{ skippedPaymentId: string }>(
    `/debts/${encodeURIComponent(debtId)}/skip-payment`,
    'POST',
    input
  ),

  listSkippedDebtPayments: (fortnightId: string) =>
    request<{ skippedPayments: SkippedDebtPaymentDTO[] }>(
      `/fortnights/${encodeURIComponent(fortnightId)}/skipped-debt-payments`,
      'GET'
    ),

  // Chat API
  sendChatMessage: (input: SendChatMessageRequest) =>
    request<ChatResponseDTO>('/chat/message', 'POST', input),

  // Mortgage API
  getMortgage: () =>
    request<MortgageDTO | null>('/debts/mortgage', 'GET'),

  upsertMortgage: (input: UpsertMortgageRequest) =>
    request<{ id: string }>('/debts/mortgage', 'PUT', input),

  getMortgageOverpaymentPlan: (fortnightlyFeCents?: number) =>
    request<MortgageOverpaymentPlanDTO>(
      '/debts/mortgage/overpayment-plan',
      'GET',
      undefined,
      { fortnightlyFeCents }
    ),
};
