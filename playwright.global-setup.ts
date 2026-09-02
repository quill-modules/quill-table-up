import MCR from 'monocart-coverage-reports';
import { coverageOptions } from './src/__tests__/e2e/coverage-options';

export default function globalSetup() {
  const mcr = MCR(coverageOptions);
  mcr.cleanCache();
}
