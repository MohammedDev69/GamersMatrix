import { BadRequestException } from '@nestjs/common';
import { PublicationStatus } from '@prisma/client';
import {
  assertPublicationTransition,
  isPubliclyVisible,
  shouldPublishScheduled,
} from './publication';

describe('publication transitions', () => {
  it('allows draft → published', () => {
    expect(() =>
      assertPublicationTransition(
        PublicationStatus.DRAFT,
        PublicationStatus.PUBLISHED,
      ),
    ).not.toThrow();
  });

  it('rejects archived → published', () => {
    expect(() =>
      assertPublicationTransition(
        PublicationStatus.ARCHIVED,
        PublicationStatus.PUBLISHED,
      ),
    ).toThrow(BadRequestException);
  });

  it('treats only PUBLISHED as publicly visible', () => {
    expect(isPubliclyVisible(PublicationStatus.PUBLISHED)).toBe(true);
    expect(isPubliclyVisible(PublicationStatus.SCHEDULED)).toBe(false);
    expect(isPubliclyVisible(PublicationStatus.DRAFT)).toBe(false);
  });

  it('detects due scheduled items', () => {
    const past = new Date(Date.now() - 60_000);
    const future = new Date(Date.now() + 60_000);
    expect(shouldPublishScheduled(PublicationStatus.SCHEDULED, past)).toBe(
      true,
    );
    expect(shouldPublishScheduled(PublicationStatus.SCHEDULED, future)).toBe(
      false,
    );
    expect(shouldPublishScheduled(PublicationStatus.DRAFT, past)).toBe(false);
  });
});
