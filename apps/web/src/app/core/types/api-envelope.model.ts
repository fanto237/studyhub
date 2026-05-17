export interface ApiEnvelope<T> {
  status: 'success' | 'fail' | 'error' | string;
  data?: T;
  message?: string;
  code?: number;
}
