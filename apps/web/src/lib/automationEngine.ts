import {
  AutomationRule,
  AutomationTrigger,
  AutomationLog,
  ReminderRecord,
  Task,
  TaskTemplate,
  ClientService,
  ServiceMaster,
  Engagement,
  Invoice,
  Compliance,
} from '../types';

export class AutomationEngine {
  /**
   * Default System Automation Rules
   */
  static getDefaultRules(): AutomationRule[] {
    return [
      {
        id: 'rule-service-task-gen',
        organizationId: 'org-1',
        name: 'Auto Task Generation on Service Activation',
        description: 'Automatically creates recurring operational tasks from templates when a CFO Client Service is activated.',
        trigger: 'SERVICE_ACTIVATED',
        actions: [{ actionType: 'CREATE_TASK' }],
        active: true,
        createdBy: 'System',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'rule-task-completed-notif',
        organizationId: 'org-1',
        name: 'Notify Virtual CFO on Task Completion',
        description: 'Triggers a review notification when an employee completes a task submission.',
        trigger: 'TASK_COMPLETED',
        actions: [{ actionType: 'CREATE_NOTIFICATION', messageTemplate: 'Task completed and submitted for review.' }],
        active: true,
        createdBy: 'System',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'rule-report-released-client',
        organizationId: 'org-1',
        name: 'Client Notification on Report Release',
        description: 'Notifies client when a new financial MIS or cash flow report is released by CFO.',
        trigger: 'REPORT_RELEASED',
        actions: [{ actionType: 'CREATE_NOTIFICATION', messageTemplate: 'A new financial report has been released in your portal.' }],
        active: true,
        createdBy: 'System',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'rule-invoice-due-reminder',
        organizationId: 'org-1',
        name: 'Automated Invoice Due Reminders',
        description: 'Scans upcoming invoice due dates and dispatches reminder notifications.',
        trigger: 'INVOICE_DUE',
        actions: [{ actionType: 'CREATE_NOTIFICATION', messageTemplate: 'Invoice payment due reminder.' }],
        active: true,
        createdBy: 'System',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'rule-compliance-due-reminder',
        organizationId: 'org-1',
        name: 'Statutory Compliance Due Reminders',
        description: 'Scans upcoming GST/TDS statutory filing deadlines and alerts assigned employees.',
        trigger: 'COMPLIANCE_DUE',
        actions: [{ actionType: 'CREATE_NOTIFICATION', messageTemplate: 'Statutory compliance filing deadline approaching.' }],
        active: true,
        createdBy: 'System',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  /**
   * Evaluates automation rules for a triggered event.
   */
  static processEvent(
    trigger: AutomationTrigger,
    payload: any,
    rules: AutomationRule[],
    state: any,
    dispatchAction: (actionType: string, params: any) => void
  ): AutomationLog {
    const activeRules = rules.filter(r => r.active && r.trigger === trigger);

    let createdTasksCount = 0;
    let skippedDuplicatesCount = 0;
    let failedCount = 0;
    let lastError: string | undefined;

    if (activeRules.length === 0) {
      return {
        id: `autolog-${Date.now()}`,
        organizationId: 'org-1',
        trigger,
        status: 'SKIPPED',
        createdTasksCount: 0,
        skippedDuplicatesCount: 0,
        failedCount: 0,
        timestamp: new Date().toISOString(),
      };
    }

    activeRules.forEach(rule => {
      try {
        rule.actions.forEach(actionConfig => {
          if (actionConfig.actionType === 'CREATE_TASK' && trigger === 'SERVICE_ACTIVATED') {
            const { clientService, clientId, engagementId, templates = [] } = payload;

            // Generate period keys
            const periodKeys = payload.periodKeys || [new Date().toISOString().substring(0, 7)]; // e.g. '2026-09'

            templates.forEach((template: TaskTemplate) => {
              periodKeys.forEach((period: string) => {
                // DUPLICATE TASK PROTECTION CHECK
                const existingTask = (state.engagements || []).flatMap((e: Engagement) => e.tasks || []).find((t: Task) =>
                  t.clientId === clientId &&
                  t.clientServiceId === clientService.id &&
                  t.taskTemplateId === template.id &&
                  t.periodKey === period
                );

                if (existingTask) {
                  skippedDuplicatesCount++;
                } else {
                  // Dispatch task creation to store
                  dispatchAction('CREATE_AUTO_TASK', {
                    engagementId,
                    clientId,
                    clientServiceId: clientService.id,
                    taskTemplateId: template.id,
                    title: (template as any).name || template.title || 'Task',
                    description: template.description,
                    estimatedHours: template.estimatedHours || 4,
                    priority: template.priority || 'MEDIUM',
                    periodKey: period,
                    dueDate: payload.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                  });
                  createdTasksCount++;
                }
              });
            });
          } else if (actionConfig.actionType === 'CREATE_NOTIFICATION') {
            dispatchAction('CREATE_NOTIFICATION', {
              title: `Automation: ${rule.name}`,
              message: actionConfig.messageTemplate || `Event ${trigger} triggered automated action.`,
            });
          }
        });
      } catch (err: any) {
        failedCount++;
        lastError = err.message || 'Automation execution error';
      }
    });

    const status = failedCount > 0 ? 'FAILED' : createdTasksCount > 0 || activeRules.length > 0 ? 'SUCCESS' : 'SKIPPED';

    return {
      id: `autolog-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      organizationId: 'org-1',
      ruleId: activeRules[0]?.id,
      ruleName: activeRules[0]?.name,
      trigger,
      status,
      createdTasksCount,
      skippedDuplicatesCount,
      failedCount,
      clientId: payload?.clientId,
      error: lastError,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Automated Reminders Scanner with Duplicate Reminder Protection
   */
  static scanAndDispatchReminders(
    state: any,
    existingReminderRecords: ReminderRecord[],
    dispatchNotification: (title: string, message: string, recipientId?: string) => void
  ): ReminderRecord[] {
    const newRecords: ReminderRecord[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const isAlreadySent = (resourceId: string, reminderType: string) => {
      return (
        existingReminderRecords.some(r => r.resourceId === resourceId && r.reminderType === reminderType) ||
        newRecords.some(r => r.resourceId === resourceId && r.reminderType === reminderType)
      );
    };

    // 1. Scan Open Tasks
    (state.engagements || []).flatMap((e: Engagement) => e.tasks || []).forEach((task: Task) => {
      if (task.status === 'COMPLETED' || !task.dueDate) return;

      const due = new Date(task.dueDate);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

      let reminderType: '7_DAYS_BEFORE' | '3_DAYS_BEFORE' | '1_DAY_BEFORE' | 'DUE_TODAY' | 'OVERDUE' | null = null;

      if (diffDays < 0) reminderType = 'OVERDUE';
      else if (diffDays === 0) reminderType = 'DUE_TODAY';
      else if (diffDays === 1) reminderType = '1_DAY_BEFORE';
      else if (diffDays === 3) reminderType = '3_DAYS_BEFORE';
      else if (diffDays === 7) reminderType = '7_DAYS_BEFORE';

      if (reminderType && !isAlreadySent(task.id, reminderType)) {
        const title = `Task Reminder: ${task.title}`;
        const message = `Task "${task.title}" is ${reminderType.replace(/_/g, ' ').toLowerCase()}. Due: ${task.dueDate}`;
        
        dispatchNotification(title, message, task.employeeId);

        newRecords.push({
          id: `rem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          organizationId: 'org-1',
          reminderType,
          resourceType: 'TASK',
          resourceId: task.id,
          recipientId: task.employeeId || 'all',
          sentAt: new Date().toISOString(),
        });
      }
    });

    // 2. Scan Statutory Compliances
    (state.engagements || []).flatMap((e: Engagement) => e.compliances || []).forEach((c: Compliance) => {
      if (c.status === 'COMPLETED' || !c.dueDate) return;

      const due = new Date(c.dueDate);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

      let reminderType: '7_DAYS_BEFORE' | '3_DAYS_BEFORE' | '1_DAY_BEFORE' | 'DUE_TODAY' | 'OVERDUE' | null = null;

      if (diffDays < 0) reminderType = 'OVERDUE';
      else if (diffDays === 0) reminderType = 'DUE_TODAY';
      else if (diffDays === 1) reminderType = '1_DAY_BEFORE';

      if (reminderType && !isAlreadySent(c.id, reminderType)) {
        const title = `Compliance Due: ${c.type}`;
        const message = `Statutory compliance filing ${c.type} is ${reminderType.replace(/_/g, ' ').toLowerCase()}. Due date: ${c.dueDate}`;
        
        dispatchNotification(title, message, c.responsibleEmployeeId);

        newRecords.push({
          id: `rem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          organizationId: 'org-1',
          reminderType,
          resourceType: 'COMPLIANCE',
          resourceId: c.id,
          recipientId: c.responsibleEmployeeId || 'all',
          sentAt: new Date().toISOString(),
        });
      }
    });

    // 3. Scan Issued Invoices
    (state.standaloneInvoices || []).forEach((inv: Invoice) => {
      if (inv.status === 'PAID' || inv.status === 'DRAFT' || inv.status === 'CANCELLED' || !inv.dueDate) return;

      const due = new Date(inv.dueDate);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

      let reminderType: '7_DAYS_BEFORE' | '3_DAYS_BEFORE' | '1_DAY_BEFORE' | 'DUE_TODAY' | 'OVERDUE' | null = null;

      if (diffDays < 0) reminderType = 'OVERDUE';
      else if (diffDays === 0) reminderType = 'DUE_TODAY';
      else if (diffDays === 3) reminderType = '3_DAYS_BEFORE';

      if (reminderType && !isAlreadySent(inv.id, reminderType)) {
        const title = `Invoice ${reminderType.replace(/_/g, ' ')}: #${inv.invoiceNumber || inv.id}`;
        const message = `Invoice #${inv.invoiceNumber || inv.id} of amount ₹${inv.amount.toLocaleString('en-IN')} is ${reminderType.replace(/_/g, ' ').toLowerCase()}.`;
        
        dispatchNotification(title, message, inv.clientId);

        newRecords.push({
          id: `rem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          organizationId: 'org-1',
          reminderType,
          resourceType: 'INVOICE',
          resourceId: inv.id,
          recipientId: inv.clientId || 'client',
          sentAt: new Date().toISOString(),
        });
      }
    });

    return newRecords;
  }
}
