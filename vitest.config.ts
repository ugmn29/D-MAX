import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: [
        'app/api/staff/route.ts',
        'app/api/patients/route.ts',
        'app/api/patients/authenticate/route.ts',
        'app/api/sales-import/route.ts',
        'lib/auth/verify-request.ts',
        'lib/utils/date.ts',
        'lib/utils/time-validation.ts',
        'lib/utils/contract-history.ts',
        'lib/validation/api-schemas.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
