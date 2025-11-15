import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Get the current aissist version from package.json
 */
export function getAissistVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const packagePath = path.join(__dirname, '../../package.json');
    const packageJson = fs.readJSONSync(packagePath);
    return packageJson.version || 'unknown';
  } catch (_error) {
    return 'unknown';
  }
}
