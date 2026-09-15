import { describe, it, expect } from 'vitest';
import { checkScreeningReadiness } from '../server/screening_service.js';

describe('Authoritative Screening Readiness (Fail-Closed Verification)', () => {
  it('strictly returns BLOCKED with SCREENING_SOURCE_MISSING when official sources are absent', () => {
    const status = checkScreeningReadiness();

    // Section 17, 18, 67, 68: If official PDF and metadata are missing,
    // screening must remain BLOCKED without scraping, guessing, or fabricating questions
    expect(status.status).toBe('BLOCKED');
    expect(['SCREENING_SOURCE_MISSING', 'SCREENING_AUTHORIZATION_UNVERIFIED']).toContain(status.error_code);
    expect(status.available_instruments.length).toBe(0);
  });
});
