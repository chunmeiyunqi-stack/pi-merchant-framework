import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export interface ApiResponse<T = any> {
  code: number;
  data: T | null;
  msg: string;
  traceId: string;
}

export function getTraceId(req?: Request): string {
  if (!req) return randomUUID();
  return req.headers.get('x-trace-id') || randomUUID();
}

export function logServerError(context: string, error: unknown, traceId: string) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(`[API ERROR] [traceId:${traceId}] [${context}]`, {
    message,
    stack,
    timestamp: new Date().toISOString(),
  });
}

export function apiSuccess<T>(
  data: T,
  msg = 'success',
  status = 200,
  traceId?: string
): NextResponse<ApiResponse<T>> {
  const tId = traceId || randomUUID();
  const res = NextResponse.json(
    {
      code: 0,
      data,
      msg,
      traceId: tId,
    },
    { status }
  );
  res.headers.set('x-trace-id', tId);
  return res;
}

export function apiError(
  msg: string,
  code = 500,
  status = 500,
  traceId?: string,
  errorObj?: unknown
): NextResponse<ApiResponse<null>> {
  const tId = traceId || randomUUID();

  if (errorObj) {
    logServerError(msg, errorObj, tId);
  } else {
    console.error(`[API ERROR] [traceId:${tId}] ${msg} (code: ${code})`);
  }

  const res = NextResponse.json(
    {
      code,
      data: null,
      msg,
      traceId: tId,
    },
    { status }
  );
  res.headers.set('x-trace-id', tId);
  return res;
}
