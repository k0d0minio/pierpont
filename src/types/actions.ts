/**
 * Shared action response types
 */

export type ActionResponse<T = any> = {
  ok: boolean;
  data?: T;
  error?: string;
  count?: number;
}

export type AuthStatusResponse = {
  ok: boolean;
  authenticated?: boolean;
}
