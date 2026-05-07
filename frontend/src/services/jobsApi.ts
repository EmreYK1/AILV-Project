// src/services/jobsApi.ts
// API-Calls für das asynchrone Job-System: Status eines laufenden Jobs abfragen.

import type { JobStatusResponse } from '../types/jobs';
import { apiCall, API_BASE_URL } from './apiClient';

// Ruft den aktuellen Status eines asynchronen Jobs ab.
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  return await apiCall<JobStatusResponse>(
    `${API_BASE_URL}/api/jobs/${jobId}`,
    {
      method: 'GET',
    }
  );
}

// Bricht einen laufenden asynchronen Job serverseitig ab.
export async function cancelJob(jobId: string): Promise<JobStatusResponse> {
  return await apiCall<JobStatusResponse>(
    `${API_BASE_URL}/api/jobs/${jobId}`,
    {
      method: 'DELETE',
    }
  );
}
