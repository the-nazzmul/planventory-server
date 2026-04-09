import type { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: Record<string, unknown>;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  status = 200,
  meta?: Record<string, unknown>,
): Response<ApiResponse<T>> => {
  return res.status(status).json({ success: true, data, meta });
};

export const sendError = (
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response<ApiResponse<never>> => {
  return res.status(status).json({
    success: false,
    error: { code, message, details },
  });
};
