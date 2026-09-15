# PathFinder Health — Authoritative Screening Instruments Directory

Per Section 17, 18, 19, 20, 21, 67, and 68 of the PathFinder Health Specification:

1. Standardized screening instruments (e.g., PHQ-9, GAD-7) require authoritative, verified sources (official PDFs, validated scoring schemas, explicit project authorizations, and cryptographic integrity hashes).
2. The system must NEVER automatically download, scrape, paraphrase, or invent screening questions, translations, or cutoffs.
3. In the absence of cryptographically verified official PDFs and metadata files, the Screening Engine strictly fails-closed:
   - Status: `BLOCKED`
   - Error Code: `SCREENING_UNAVAILABLE` / `SCREENING_SOURCE_MISSING`
4. The core application (Intake, Normalization, Red Flag Safety Gate, Deterministic Classification Engine, Risk Engine, Explainability, and Care Navigation) continues to operate deterministically on structured intake evidence.
