import { BadRequestException } from '@nestjs/common';
import { PublicationStatus } from '@prisma/client';

/** Valid publication transitions (server-enforced). */
const TRANSITIONS: Record<PublicationStatus, PublicationStatus[]> = {
  DRAFT: ['IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'],
  IN_REVIEW: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'],
  SCHEDULED: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['ARCHIVED', 'DRAFT'],
  ARCHIVED: ['DRAFT'],
};

export function assertPublicationTransition(
  from: PublicationStatus,
  to: PublicationStatus,
) {
  if (from === to) return;
  const allowed = TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Invalid publication transition: ${from} → ${to}`,
    );
  }
}

export function isPubliclyVisible(status: PublicationStatus) {
  return status === PublicationStatus.PUBLISHED;
}

/** Promote due scheduled items — caller persists. */
export function shouldPublishScheduled(
  status: PublicationStatus,
  scheduledAt: Date | null | undefined,
  now = new Date(),
) {
  return (
    status === PublicationStatus.SCHEDULED &&
    scheduledAt != null &&
    scheduledAt.getTime() <= now.getTime()
  );
}

export { TRANSITIONS as PUBLICATION_TRANSITIONS };
