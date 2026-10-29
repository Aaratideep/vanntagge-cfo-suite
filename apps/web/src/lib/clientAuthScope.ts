import { User, Client, Engagement, Invoice, Document, Report, ClientFinancialStatement } from '../types';

export interface ClientTenantScope {
  clientId: string;
  companyName: string;
  isScoped: boolean;
}

/**
 * Resolves the authenticated client tenant scope from currentUser and client store.
 * Strictly scopes data to prevent any cross-tenant data leakage.
 */
export function getClientTenantScope(
  currentUser: User | null,
  clients: Client[] = []
): ClientTenantScope {
  if (!currentUser) {
    return { clientId: '', companyName: '', isScoped: false };
  }

  // 1. Direct match on client ID or email
  const matchedClient = clients.find(
    (c) =>
      c.id === currentUser.id ||
      (currentUser.email && c.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser.linkedEntity && c.companyName?.toLowerCase() === currentUser.linkedEntity.toLowerCase())
  );

  const clientId = matchedClient?.id || currentUser.id || '';
  const companyName = matchedClient?.companyName || currentUser.linkedEntity || '';

  return {
    clientId,
    companyName,
    isScoped: Boolean(clientId || companyName),
  };
}

/**
 * Checks whether an entity belongs strictly to the scoped client.
 */
export function isOwnedByClient(
  entity: { clientId?: string; clientCompanyName?: string } | null | undefined,
  scope: ClientTenantScope
): boolean {
  if (!entity || !scope.isScoped) return false;

  // Match by clientId if available
  if (entity.clientId && scope.clientId && entity.clientId === scope.clientId) {
    return true;
  }

  // Match by company name
  if (
    entity.clientCompanyName &&
    scope.companyName &&
    entity.clientCompanyName.toLowerCase().trim() === scope.companyName.toLowerCase().trim()
  ) {
    return true;
  }

  return false;
}

/**
 * Strictly filters engagements to only those belonging to the authenticated client tenant.
 */
export function filterClientEngagements(
  engagements: Engagement[] = [],
  scope: ClientTenantScope
): Engagement[] {
  if (!scope.isScoped) return [];
  return engagements.filter((e) => isOwnedByClient(e, scope));
}

/**
 * Strictly filters invoices to only those belonging to the authenticated client tenant,
 * and hides any DRAFT invoices (satisfying Report 5 - Row 6).
 */
export function filterClientInvoices(
  standaloneInvoices: Invoice[] = [],
  engagements: Engagement[] = [],
  scope: ClientTenantScope
): Invoice[] {
  if (!scope.isScoped) return [];
  const list: Invoice[] = [];
  const seenIds = new Set<string>();

  // 1. Standalone invoices
  standaloneInvoices.forEach((inv) => {
    if (inv.status !== 'DRAFT' && isOwnedByClient(inv, scope) && !seenIds.has(inv.id)) {
      list.push(inv);
      seenIds.add(inv.id);
    }
  });

  // 2. Engagement invoices
  const clientEngs = filterClientEngagements(engagements, scope);
  clientEngs.forEach((eng) => {
    (eng.invoices || []).forEach((inv) => {
      if (inv.status !== 'DRAFT' && !seenIds.has(inv.id)) {
        list.push({
          ...inv,
          clientCompanyName: inv.clientCompanyName || eng.clientCompanyName,
          serviceName: inv.serviceName || inv.milestone || eng.name,
        });
        seenIds.add(inv.id);
      }
    });
  });

  return list;
}

