// Loader so vitest's `tests/**/*.test.ts` include pattern picks up the
// `backend.spec.ts` file requested literally by the acceptance criteria.
// Importing the spec module registers its describe/it blocks with vitest.
import './backend.spec';
