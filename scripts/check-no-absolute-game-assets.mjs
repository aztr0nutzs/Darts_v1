import {execSync} from 'node:child_process';

try {
  const output = execSync("rg -n \"['\\\"]/game-assets/\" src", {encoding: 'utf8'}).trim();
  if (output.length > 0) {
    console.error('Found forbidden hardcoded root-absolute /game-assets/ paths in src/:');
    console.error(output);
    process.exit(1);
  }
} catch (error) {
  if (error.status === 1) {
    console.log('No forbidden hardcoded root-absolute /game-assets/ paths found in src/.');
    process.exit(0);
  }
  throw error;
}
