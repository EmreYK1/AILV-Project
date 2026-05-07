import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getJobStatus } from '../services/jobsApi';

type JobType = 'generate_questions' | 'generate_slides';
type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ActiveJob {
  jobId: string;
  jobType: JobType;
  status: JobStatus;
  progress: number;
  stageLabel: string | null;
  resultData: unknown | null;
  errorMessage: string | null;
}

interface JobContextValue {
  activeJob: ActiveJob | null;
  addJob: (jobId: string, jobType: JobType) => void;
  dismissJob: () => void;
}

const JobContext = createContext<JobContextValue | undefined>(undefined);
const POLLING_INTERVAL_MS = 2000;
const COMPLETED_VISIBILITY_MS = 30000;

interface JobContextProviderProps {
  children: React.ReactNode;
}

export function JobContextProvider({ children }: JobContextProviderProps) {
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);

  function addJob(jobId: string, jobType: JobType): void {
    setActiveJob({
      jobId,
      jobType,
      status: 'pending',
      progress: 0,
      stageLabel: null,
      resultData: null,
      errorMessage: null,
    });
  }

  function dismissJob(): void {
    setActiveJob(null);
  }

  useEffect(function () {
    if (!activeJob?.jobId) {
      return;
    }

    const intervalId = window.setInterval(async function () {
      try {
        const statusResponse = await getJobStatus(activeJob.jobId);
        const normalizedStatus = statusResponse.status as JobStatus;

        setActiveJob(function (previousJob) {
          if (!previousJob || previousJob.jobId !== activeJob.jobId) {
            return previousJob;
          }

          return {
            ...previousJob,
            status: normalizedStatus,
            progress: statusResponse.progress,
            stageLabel: statusResponse.stage_label,
            resultData: statusResponse.result_data,
            errorMessage: statusResponse.error_message,
          };
        });

        if (normalizedStatus === 'completed' || normalizedStatus === 'failed') {
          window.clearInterval(intervalId);
        }
      } catch (error) {
        window.clearInterval(intervalId);
        setActiveJob(function (previousJob) {
          if (!previousJob || previousJob.jobId !== activeJob.jobId) {
            return previousJob;
          }

          return {
            ...previousJob,
            status: 'failed',
            errorMessage:
              error instanceof Error
                ? error.message
                : 'Fehler beim Abrufen des Job-Status.',
          };
        });
      }
    }, POLLING_INTERVAL_MS);

    return function cleanupPolling() {
      window.clearInterval(intervalId);
    };
  }, [activeJob?.jobId]);

  useEffect(
    function keepCompletedJobVisibleTemporarily() {
      if (!activeJob || activeJob.status !== 'completed') {
        return;
      }

      const timeoutId = window.setTimeout(function () {
        setActiveJob(function (previousJob) {
          if (!previousJob || previousJob.jobId !== activeJob.jobId) {
            return previousJob;
          }

          return null;
        });
      }, COMPLETED_VISIBILITY_MS);

      return function cleanupCompletedTimeout() {
        window.clearTimeout(timeoutId);
      };
    },
    [activeJob]
  );

  const value = useMemo<JobContextValue>(
    function () {
      return { activeJob, addJob, dismissJob };
    },
    [activeJob]
  );

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
}

export function useJobContext(): JobContextValue {
  const context = useContext(JobContext);

  if (!context) {
    throw new Error('useJobContext must be used within a JobContextProvider');
  }

  return context;
}
