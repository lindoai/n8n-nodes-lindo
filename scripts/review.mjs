import { analyzePackage } from '@n8n/scan-community-package/scanner/scanner.mjs';

for (const patterns of [
  ['credentials/**/*.ts', 'nodes/**/*.ts', 'package.json'],
  ['dist/**/*.js', 'package.json'],
]) {
  const result = await analyzePackage(process.cwd(), patterns);
  if (!result.passed) {
    console.error(result.details || result.message);
    process.exit(1);
  }
}
console.log('n8n community review checks passed for source and compiled package.');
