import type {
  IntakeData,
  AssessmentResult,
  ScreeningReadiness,
  DemoScenario,
} from '../../server/types.js';

function getApiBase(): string {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string') {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && envUrl.includes('localhost')) {
      return '/api/v1';
    }
    return envUrl;
  }
  return '/api/v1';
}

const API_BASE = getApiBase();
const DEFAULT_TIMEOUT_MS = 12000;

export interface SessionAuth {
  session_id: string;
  session_token: string;
  created_at: string;
}

export interface ApiError {
  error_code: string;
  message: string;
  status: number;
  retry_after_seconds?: number;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw {
        error_code: 'TIMEOUT',
        message: 'The network request timed out. Please try again.',
        status: 408,
      } as ApiError;
    }
    throw {
      error_code: 'NETWORK_ERROR',
      message: 'Unable to connect to the PathFinder server. Check your connection.',
      status: 0,
    } as ApiError;
  }
}

export async function createSession(language: string = 'en'): Promise<SessionAuth> {
  const response = await fetchWithTimeout(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      error_code: errorData.error_code || 'INTERNAL_ERROR',
      message: errorData.message || 'Failed to initialize session.',
      status: response.status,
    } as ApiError;
  }

  return response.json();
}

export async function submitIntake(
  intake: IntakeData,
  sessionAuth?: SessionAuth | null
): Promise<{
  intake: IntakeData;
  candidate_ai_extraction: any;
  safety_check: any;
  is_urgent: boolean;
}> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Idempotency-Key': `intake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };

  if (sessionAuth) {
    headers['X-Session-ID'] = sessionAuth.session_id;
    headers['Authorization'] = `Bearer ${sessionAuth.session_token}`;
  }

  const response = await fetchWithTimeout(`${API_BASE}/intake`, {
    method: 'POST',
    headers,
    body: JSON.stringify(intake),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      error_code: errorData.error_code || 'VALIDATION_ERROR',
      message: errorData.message || 'Failed to submit intake information.',
      status: response.status,
    } as ApiError;
  }

  return response.json();
}

export async function submitAssessment(
  intake: IntakeData,
  sessionAuth: SessionAuth
): Promise<AssessmentResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Session-ID': sessionAuth.session_id,
    'Authorization': `Bearer ${sessionAuth.session_token}`,
    'Idempotency-Key': `score-${sessionAuth.session_id}-${Date.now()}`,
  };

  const response = await fetchWithTimeout(`${API_BASE}/score`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      session_id: sessionAuth.session_id,
      session_token: sessionAuth.session_token,
      intake,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      error_code: errorData.error_code || 'SERVER_ERROR',
      message: errorData.message || 'Assessment scoring failed.',
      status: response.status,
      retry_after_seconds: errorData.retry_after_seconds,
    } as ApiError;
  }

  return response.json();
}

export async function fetchScreeningStatus(): Promise<ScreeningReadiness> {
  const response = await fetchWithTimeout(`${API_BASE}/screening/status`);
  if (!response.ok) {
    return {
      status: 'BLOCKED',
      available_instruments: [],
      error_code: 'SCREENING_UNAVAILABLE',
      error_message_key: 'screening_unavailable',
      verified_at: null,
    };
  }
  return response.json();
}

export async function fetchDemoScenarios(): Promise<DemoScenario[]> {
  const response = await fetchWithTimeout(`${API_BASE}/demo/scenarios`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.scenarios || [];
}

export async function fetchExportDocument(sessionAuth: SessionAuth): Promise<any> {
  const response = await fetchWithTimeout(`${API_BASE}/export/${sessionAuth.session_id}`, {
    headers: {
      'Authorization': `Bearer ${sessionAuth.session_token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw {
      error_code: err.error_code || 'EXPORT_ERROR',
      message: err.message || 'Could not export session record.',
      status: response.status,
    } as ApiError;
  }

  return response.json();
}

export async function deleteSessionRemote(sessionAuth: SessionAuth): Promise<boolean> {
  const response = await fetchWithTimeout(`${API_BASE}/session/${sessionAuth.session_id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${sessionAuth.session_token}`,
    },
  });
  return response.ok;
}
