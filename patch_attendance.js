const fs = require('fs');
const file = 'apps/web/src/components/admin/EmployeesView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const [isModalOpen, setIsModalOpen] = useState(false);",
  "const [todaysAttendance, setTodaysAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});\n  const [isModalOpen, setIsModalOpen] = useState(false);"
);

const oldHeader = `<div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Leave Requests & Approvals</h3>
              <button 
                onClick={() => {
                  useDashboardStore.getState().setGlobalSuccessMsg("Today's attendance has been marked as DONE for all active employees.");
                }} 
                className="btn-primary py-2 text-sm flex items-center gap-2"
              >
                <Check size={16} /> Mark Today's Attendance Done
              </button>
            </div>`;

const newHeader = `
            {/* TODAY'S ATTENDANCE */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Today's Attendance</h3>
              <button 
                onClick={() => {
                  useDashboardStore.getState().setGlobalSuccessMsg("Today's attendance has been marked as DONE.");
                }} 
                className="btn-primary py-2 text-sm flex items-center gap-2"
              >
                <Check size={16} /> Submit Attendance
              </button>
            </div>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Mark Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.filter(u => u.role === 'EMPLOYEE').map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{emp.name}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => setTodaysAttendance(prev => ({ ...prev, [emp.id]: 'PRESENT' }))}
                          className={\`text-xs font-bold px-3 py-1.5 rounded transition-colors \${todaysAttendance[emp.id] === 'PRESENT' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
                        >
                          Present
                        </button>
                        <button 
                          onClick={() => setTodaysAttendance(prev => ({ ...prev, [emp.id]: 'ABSENT' }))}
                          className={\`text-xs font-bold px-3 py-1.5 rounded transition-colors \${todaysAttendance[emp.id] === 'ABSENT' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
                        >
                          Absent
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.filter(u => u.role === 'EMPLOYEE').length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-slate-500">No employees found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-b border-t border-slate-100 flex justify-between items-center bg-slate-50/50 mt-4">
              <h3 className="font-bold text-slate-800">Leave Requests & Approvals</h3>
            </div>`;

content = content.replace(oldHeader, newHeader);

fs.writeFileSync(file, content);
console.log("Success");
