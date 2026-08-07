const fs = require('fs');
const path = require('path');

const BASE = 'c:/Users/Administrator/zhishuai/server/src';

// Collect all files that need fixing
const filesToFix = [];

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.')) walkDir(fullPath);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.disabled')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('new PrismaClient()')) {
        filesToFix.push(fullPath);
      }
    }
  }
}

walkDir(BASE);

console.log(`Found ${filesToFix.length} files with new PrismaClient()`);

let fixed = 0;
let skipped = 0;

for (const filePath of filesToFix) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Determine the correct import path for utils/db
  const relativeToRoutes = path.relative(path.dirname(filePath), path.join(BASE, 'utils/db')).replace(/\\/g, '/');
  const relativeToServices = path.relative(path.dirname(filePath), path.join(BASE, 'utils/db')).replace(/\\/g, '/');
  
  // Check if already imports from utils/db
  if (content.includes("from '../utils/db'") || content.includes('from "../../utils/db"') || content.includes('from "../utils/db"')) {
    // Already has the import, just need to replace usage
    console.log(`  SKIP (already imports): ${path.relative(BASE, filePath)}`);
    skipped++;
    continue;
  }
  
  // Check if file is the db.ts itself
  if (filePath.endsWith('utils/db.ts')) {
    console.log(`  SKIP (db.ts itself): ${path.relative(BASE, filePath)}`);
    skipped++;
    continue;
  }
  
  // Replace `const prisma = new PrismaClient();` with nothing (remove the line)
  // and add import at top
  const importPath = relativeToRoutes.startsWith('..') ? relativeToRoutes : ('./' + relativeToRoutes);
  
  // Remove the line that creates new PrismaClient
  let newContent = content.replace(
    /const\s+prisma\s*=\s*new\s+PrismaClient\s*\(\s*\)\s*;?\s*\n?/g,
    ''
  );
  
  // Remove the PrismaClient import if it exists
  newContent = newContent.replace(
    /import\s+\{\s*PrismaClient\s*\}\s+from\s+['"]@prisma\/client['"]\s*;?\s*\n?/g,
    ''
  );
  
  // Add the shared prisma import at the top of imports
  // Find the last import statement
  const lines = newContent.split('\n');
  let lastImportLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportLine = i;
    }
  }
  
  if (lastImportLine >= 0) {
    // Determine correct relative path
    let relativeImportPath;
    if (filePath.includes('/routes/')) {
      relativeImportPath = '../../utils/db';
    } else if (filePath.includes('/services/')) {
      relativeImportPath = '../utils/db';
    } else {
      relativeImportPath = relativeToRoutes;
    }
    
    // Insert after last import
    lines.splice(lastImportLine + 1, 0, `import { prisma } from '${relativeImportPath}';`);
    newContent = lines.join('\n');
    
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`  FIXED: ${path.relative(BASE, filePath)}`);
    fixed++;
  } else {
    console.log(`  WARN (no imports found): ${path.relative(BASE, filePath)}`);
    skipped++;
  }
}

console.log(`\nDone. Fixed: ${fixed}, Skipped: ${skipped}, Total: ${filesToFix.length}`);
