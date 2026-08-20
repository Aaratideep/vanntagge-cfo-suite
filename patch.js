const fs = require('fs');
const file = 'apps/web/src/types/index.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "createdAt: string;\n}",
  "createdAt: string;\n  targetRoles?: string[];\n}"
);
fs.writeFileSync(file, content);
