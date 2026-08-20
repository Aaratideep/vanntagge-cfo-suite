const fs = require('fs');
const file = 'apps/web/src/store/dashboardStore.ts';
let content = fs.readFileSync(file, 'utf8');

const splitKey = 'adminSettings: state.adminSettings';
if (content.includes(splitKey)) {
  const parts = content.split(splitKey);
  content = parts[0] + splitKey + ',\n    leaves: state.leaves,\n    payrolls: state.payrolls,\n    onboardingTasks: state.onboardingTasks' + parts[1];
  fs.writeFileSync(file, content);
  console.log("Success");
} else {
  console.log("Failed to find split key");
}
