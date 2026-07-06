import MCR from 'monocart-coverage-reports';
import { coverageOptions } from './src/__tests__/e2e/coverage-options';

export default async function globalTeardown() {
  const mcr = MCR(coverageOptions);
  if (mcr.hasCache()) {
    await mcr.generate();
  }
}
