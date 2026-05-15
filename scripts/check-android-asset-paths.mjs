import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const indexPath = resolve('dist/index.html');
const html = readFileSync(indexPath, 'utf8');

const forbiddenPatterns = ['src="/assets/', 'href="/assets/'];
const failures = forbiddenPatterns.filter((pattern) => html.includes(pattern));

if (failures.length > 0) {
  console.error(`Android asset path check failed for ${indexPath}.`);
  for (const failure of failures) {
    console.error(`Found forbidden root-absolute reference: ${failure}`);
  }
  process.exit(1);
}

console.log(`Android asset path check passed for ${indexPath}.`);
