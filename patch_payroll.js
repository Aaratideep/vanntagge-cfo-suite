const fs = require('fs');
const file = 'apps/web/src/store/dashboardStore.ts';
let content = fs.readFileSync(file, 'utf8');

const interfaceReplacement = `  processPayroll: (id: string) => void;
  updatePayrollRecord: (id: string, updates: Partial<PayrollRecord>) => void;`;

const implReplacement = `  processPayroll: (id) => set((state) => ({ payrolls: state.payrolls.map(p => p.id === id ? { ...p, status: 'PROCESSED' } : p) })),
  updatePayrollRecord: (id, updates) => set((state) => ({ 
    payrolls: state.payrolls.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        updated.netPay = updated.basic + updated.hra + updated.statutoryBonus - updated.deductionsTds - updated.deductionsPfEsi;
        return updated;
      }
      return p;
    }) 
  })),`;

content = content.replace("  processPayroll: (id: string) => void;", interfaceReplacement);
content = content.replace("  processPayroll: (id) => set((state) => ({ payrolls: state.payrolls.map(p => p.id === id ? { ...p, status: 'PROCESSED' } : p) })),", implReplacement);

fs.writeFileSync(file, content);
console.log("Success");
