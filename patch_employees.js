const fs = require('fs');
const file = 'apps/web/src/components/admin/EmployeesView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add updatePayrollRecord to destructuring
content = content.replace(
  "processPayroll,",
  "processPayroll,\n    updatePayrollRecord,"
);

// Add state variables for editing
const statesToAdd = `
  const [editingPayrollId, setEditingPayrollId] = useState<string | null>(null);
  const [editBasic, setEditBasic] = useState<number>(0);
  const [editHra, setEditHra] = useState<number>(0);
  const [editDeductions, setEditDeductions] = useState<number>(0);

  const startEditPayroll = (pay: any) => {
    setEditingPayrollId(pay.id);
    setEditBasic(pay.basic);
    setEditHra(pay.hra + pay.statutoryBonus);
    setEditDeductions(pay.deductionsPfEsi + pay.deductionsTds);
  };

  const saveEditPayroll = (id: string) => {
    updatePayrollRecord(id, {
      basic: editBasic,
      hra: editHra,
      statutoryBonus: 0,
      deductionsPfEsi: editDeductions,
      deductionsTds: 0
    });
    setEditingPayrollId(null);
  };
`;

content = content.replace(
  "const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);",
  "const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);\n" + statesToAdd
);

// Update table cells
const tableRowRegex = /<td className="px-6 py-4 text-slate-600 text-right">\{formatINR\(pay\.basic\)\}<\/td>[\s\S]*?<td className="px-6 py-4 text-right">[\s\S]*?<\/td>/;

const newTableRow = `<td className="px-6 py-4 text-slate-600 text-right">
                        {editingPayrollId === pay.id ? (
                          <input type="number" value={editBasic} onChange={(e) => setEditBasic(Number(e.target.value))} className="w-24 px-2 py-1 border rounded text-right text-sm" />
                        ) : (
                          formatINR(pay.basic)
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-right">
                        {editingPayrollId === pay.id ? (
                          <input type="number" value={editHra} onChange={(e) => setEditHra(Number(e.target.value))} className="w-24 px-2 py-1 border rounded text-right text-sm" />
                        ) : (
                          formatINR(pay.hra + pay.statutoryBonus)
                        )}
                      </td>
                      <td className="px-6 py-4 text-rose-600 font-medium text-right">
                        {editingPayrollId === pay.id ? (
                          <input type="number" value={editDeductions} onChange={(e) => setEditDeductions(Number(e.target.value))} className="w-24 px-2 py-1 border border-rose-200 rounded text-right text-sm text-rose-600" />
                        ) : (
                          \`-\${formatINR(pay.deductionsPfEsi + pay.deductionsTds)}\`
                        )}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-blue-700 text-right">
                        {editingPayrollId === pay.id ? (
                          formatINR(editBasic + editHra - editDeductions)
                        ) : (
                          formatINR(pay.netPay)
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={\`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border \${
                          pay.status === 'PROCESSED' || pay.status === 'DISBURSED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }\`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingPayrollId === pay.id ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => saveEditPayroll(pay.id)} className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition-colors">Save</button>
                            <button onClick={() => setEditingPayrollId(null)} className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded transition-colors">Cancel</button>
                          </div>
                        ) : pay.status === 'PENDING' ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => startEditPayroll(pay)} className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded transition-colors border border-slate-200">Edit</button>
                            <button onClick={() => processPayroll(pay.id)} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded transition-colors">Process Pay</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleDownloadSlip(pay)}
                            className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded transition-colors border border-slate-200"
                          >
                            Download Slip
                          </button>
                        )}
                      </td>`;

content = content.replace(tableRowRegex, newTableRow);

fs.writeFileSync(file, content);
console.log("Success");
