import { HttpErrorResponse } from '@angular/common/http';

import { type ApiEnvelope } from './api-envelope.model';

type BackendErrorData = {
  message?: string;
};

type ApiErrorMessageOptions = {
  fallbackMessage: string;
  statusMessages?: Partial<Record<number, string>>;
};

export function resolveApiErrorMessage(
  error: unknown,
  { fallbackMessage, statusMessages = {} }: ApiErrorMessageOptions,
) {
  if (error instanceof HttpErrorResponse) {
    const payload = error.error as
      | ApiEnvelope<BackendErrorData>
      | string
      | null;

    if (typeof payload === 'string') {
      if (payload.trim().length > 0) {
        return payload;
      }
    } else {
      if (payload?.data?.message) {
        return payload.data.message;
      }

      if (payload?.message) {
        return payload.message;
      }
    }

    const statusMessage = statusMessages[error.status];
    if (statusMessage) {
      return statusMessage;
    }

    if (error.status === 0) {
      return 'Could not reach StudyHub. Check your connection and try again.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
