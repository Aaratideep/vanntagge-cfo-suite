const fs = require('fs');
const file = 'apps/web/src/components/admin/EmployeesView.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<h3 className="font-bold text-slate-800">Leave Requests & Approvals</h3>`;
const replacement = `<h3 className="font-bold text-slate-800">Leave Requests & Approvals</h3>
              <button 
                onClick={() => {
                  useDashboardStore.getState().setGlobalSuccessMsg("Today's attendance has been marked as DONE for all active employees.");
                }} 
                className="btn-primary py-2 text-sm flex items-center gap-2"
              >
                <Check size={16} /> Mark Today's Attendance Done
              </button>`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
