import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        findFiles(path.join(dir, file), fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = findFiles(path.join(__dirname, 'src'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // fix TS6133 unused variables (simple removals)
  // this might be tricky with regex, so we just remove the specific ones reported
  if (file.endsWith('AnalyticsPage.tsx')) {
    content = content.replace(/MapPin,?\s*/g, '').replace(/Clock,?\s*/g, '').replace(/PieChartIcon,?\s*/g, '');
    changed = true;
  }
  if (file.endsWith('DashboardPage.tsx')) {
    content = content.replace(/TrendingUp,?\s*/g, '');
    changed = true;
  }
  if (file.endsWith('PaymentsPage.tsx')) {
    content = content.replace(/Search,?\s*/g, '');
    changed = true;
  }
  if (file.endsWith('TripsPage.tsx')) {
    content = content.replace(/MapPin,?\s*/g, '');
    changed = true;
  }
  if (file.endsWith('UsersPage.tsx')) {
    content = content.replace(/Mail,?\s*/g, '');
    changed = true;
  }
  if (file.endsWith('Topbar.tsx')) {
    content = content.replace(/import\s*{\s*cn\s*}\s*from\s*['"]@\/lib\/utils['"];?\n/g, '');
    changed = true;
  }
  if (file.endsWith('router.tsx')) {
    content = '/* eslint-disable react-refresh/only-export-components */\n' + content;
    changed = true;
  }

  // fix TS1484 type imports
  // find import { ... Type ... } from '...'
  // we can use regex: import {([^}]*)} from (['"].*['"])
  // wait, it's easier to just do:
  content = content.replace(/import\s*{([^}]+)}\s*from\s*(['"][^'"]+['"])/g, (match, imports, module) => {
    // If the module is a local file or some specific types
    const importItems = imports.split(',').map(s => s.trim()).filter(Boolean);
    const types = ['Booking', 'DashboardStats', 'Bus', 'Trip', 'User', 'TypedUseSelectorHook', 'LucideIcon'];
    
    const valueImports = [];
    const typeImports = [];
    
    for (const item of importItems) {
      // Remove 'type ' if it already has it to avoid 'type type'
      const cleanItem = item.replace(/^type\s+/, '');
      if (types.includes(cleanItem)) {
        typeImports.push(cleanItem);
      } else {
        if (item.startsWith('type ')) {
           typeImports.push(cleanItem);
        } else {
           valueImports.push(item);
        }
      }
    }
    
    let result = '';
    if (valueImports.length > 0) {
      result += `import { ${valueImports.join(', ')} } from ${module};\n`;
    }
    if (typeImports.length > 0) {
      result += `import type { ${typeImports.join(', ')} } from ${module};`;
    }
    return result.trim();
  });

  // some files had any, let's fix them if we can
  content = content.replace(/:\s*any/g, ': unknown');

  if (content !== fs.readFileSync(file, 'utf-8')) {
    fs.writeFileSync(file, content, 'utf-8');
  }
}
