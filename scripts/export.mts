import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const outDir = 'out';

// Stap 1: Run Next.js export
execSync('npx next build --no-lint && npx next export', { stdio: 'inherit' });

// Stap 2: Voeg eventueel een lege .nojekyll toe (soms nodig voor statische sites)
if (!existsSync(`${outDir}/.nojekyll`)) {
  writeFileSync(`${outDir}/.nojekyll`, '');
}

// Stap 3: Zorg dat de output-map bestaat (veiligheidshalve)
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

console.log('✅ Export voltooid. Map:', outDir);