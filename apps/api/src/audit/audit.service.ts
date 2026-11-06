import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const REDACT_KEYS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'hmac',
  'apiKey',
  'authorization',
  'code',
  'rawPayload',
  'clientSecret',
  'card',
  'cvv',
];

function redactValue(key: string, value: unknown): unknown {
  const lower = key.toLowerCase();
  if (REDACT_KEYS.some((k) => lower.includes(k.toLowerCase()))) {
    return '[REDACTED]';
  }
  if (Array.isArray(value)) {
    return value.map((v, i) => redactValue(String(i), v));
  }
  if (value && typeof value === 'object') {
    return redactObject(value as Record<string, unknown>);
  }
  return value;
}

export function redactObject(
  input: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  if (!input) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    out[k] = redactValue(k, v);
  }
  return out;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    summary: string;
    metadata?: Record<string, unknown> | null;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        summary: params.summary,
        metadata: params.metadata
          ? (redactObject(params.metadata) as Prisma.InputJsonValue)
          : undefined,
      },
    });
  }
}
