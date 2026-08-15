const fs = require('fs');
const path = 'apps/web/src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `      // Ensure cookies are set BEFORE navigating to protected routes
      document.cookie = \`userRole=\${currentUser.role}; path=/; max-age=\${60 * 60 * 24 * 7}\`;
      document.cookie = \`userId=\${currentUser.id}; path=/; max-age=\${60 * 60 * 24 * 7}\`;

      if (currentUser.role === 'SUPER_ADMIN') {`;

content = content.replace("      if (currentUser.role === 'SUPER_ADMIN') {", replacement);

fs.writeFileSync(path, content);
