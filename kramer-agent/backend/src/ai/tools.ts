import Anthropic from '@anthropic-ai/sdk';
import { priorityGet } from '../priority/client';

// Document type codes in DOCUMENTS_Q
// Note: TYPE values are case-sensitive in Priority
export const DOCUMENT_TYPES: Record<string, { en: string; he: string }> = {
  D: { en: 'Customer Shipment',       he: 'תעודת משלוח ללקוח' },
  Q: { en: 'Service Call',            he: 'קריאת שירות' },
  N: { en: 'Customer Return',         he: 'החזרה מלקוח' },
  W: { en: 'Return to Vendor',        he: 'החזרה לספק' },
  Z: { en: 'Service Contract',        he: 'חוזה שירות' },
  m: { en: 'RMA Document',            he: 'מסמך RMA' },
  F: { en: 'Subcontractor Shipment',  he: 'משלוח קבלן משנה' },
  P: { en: 'Receipt of Goods',        he: 'קבלת סחורה' },
};

const DOCUMENT_TYPE_FILTER = Object.keys(DOCUMENT_TYPES)
  .map((t) => `TYPE eq '${t}'`)
  .join(' or ');

// Confirmed field names from Priority sandbox
const FORM_CONFIG: Record<string, { defaultSelect: string; description: string; defaultFilter?: string }> = {
  ORDERS: {
    defaultSelect: 'ORDNAME,CUSTNAME,CDES,CURDATE,TOTPRICE,VAT,ORDSTATUSDES,DETAILS',
    description: 'Sales orders — fields: ORDNAME (order#), CUSTNAME (customer code), CDES (customer name), CURDATE (date), TOTPRICE (total), ORDSTATUSDES (status), DETAILS',
  },
  PORDERS: {
    defaultSelect: 'ORDNAME,SUPNAME,CDES,CURDATE,TOTPRICE,VAT,STATDES,DETAILS',
    description: 'Purchase orders — fields: ORDNAME (PO#), SUPNAME (supplier code), CDES (supplier name), CURDATE (date), TOTPRICE (total), STATDES (status), DETAILS',
  },
  DOCUMENTS_Q: {
    defaultSelect: 'DOCNO,TYPE,CUSTNAME,CDES,STARTDATE,TOTPRICE,CALLSTATUSCODE,DETAILS',
    defaultFilter: `(${DOCUMENT_TYPE_FILTER})`,
    description: `Warehouse & service documents — TYPE field identifies document kind:
${Object.entries(DOCUMENT_TYPES).map(([code, t]) => `      TYPE='${code}': ${t.en} (${t.he})`).join('\n')}
    Fields: DOCNO (doc#), TYPE (type code), CUSTNAME (customer code), CDES (customer name), STARTDATE (date), TOTPRICE (total), CALLSTATUSCODE (status), DETAILS`,
  },
  AINVOICES: {
    defaultSelect: 'IVNUM,CUSTNAME,CDES,IVDATE,TOTPRICE,VAT,STATDES,DETAILS',
    description: 'Customer invoices — fields: IVNUM (invoice#), CUSTNAME (customer code), CDES (customer name), IVDATE (date), TOTPRICE (total), STATDES (status), DETAILS',
  },
};

export const PRIORITY_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: 'query_priority',
    description: `Query read-only data from Priority ERP. Use this for any question about orders, purchase orders, documents, or invoices.

Available forms:
${Object.entries(FORM_CONFIG)
  .map(([form, cfg]) => `- ${form}: ${cfg.description}`)
  .join('\n')}

Tips:
- Filter by customer: CUSTNAME eq 'KRAMER'
- Filter by document type: TYPE eq 'D' (Customer Shipment), TYPE eq 'P' (Receipt of Goods), etc.
- Filter by date range: STARTDATE gt 2024-01-01T00:00:00Z and STARTDATE lt 2024-12-31T00:00:00Z
- Combine filters: (TYPE eq 'D' or TYPE eq 'N') and CUSTNAME eq 'KRAMER'
- For counts/totals, fetch records and aggregate yourself
- Dates are ISO 8601: 2024-06-15T00:00:00Z
- TYPE values are case-sensitive ('m' is RMA, 'M' is something else)`,
    input_schema: {
      type: 'object' as const,
      properties: {
        form: {
          type: 'string',
          enum: Object.keys(FORM_CONFIG),
          description: 'The Priority form to query',
        },
        filter: {
          type: 'string',
          description: "OData $filter expression. For DOCUMENTS_Q, already scoped to configured types unless you override. Example: \"TYPE eq 'D' and CUSTNAME eq 'KRAMER'\"",
        },
        select: {
          type: 'string',
          description: 'Comma-separated field names. If omitted, returns default fields for the form.',
        },
        orderby: {
          type: 'string',
          description: "OData $orderby. Example: \"STARTDATE desc\"",
        },
        top: {
          type: 'number',
          description: 'Max records to return. Default: 20. Max: 100.',
        },
      },
      required: ['form'],
    },
  },
];

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  if (name === 'query_priority') {
    return queryPriority(input as QueryInput);
  }
  throw new Error(`Unknown tool: ${name}`);
}

interface QueryInput {
  form: string;
  filter?: string;
  select?: string;
  orderby?: string;
  top?: number;
}

async function queryPriority(input: QueryInput): Promise<string> {
  const config = FORM_CONFIG[input.form];
  if (!config) {
    return `Unknown form: ${input.form}. Valid forms: ${Object.keys(FORM_CONFIG).join(', ')}`;
  }

  const params = new URLSearchParams();
  params.set('$select', input.select || config.defaultSelect);
  params.set('$top', String(Math.min(input.top ?? 20, 100)));

  // Merge default filter with user-supplied filter
  if (input.filter && config.defaultFilter) {
    params.set('$filter', `(${input.filter}) and ${config.defaultFilter}`);
  } else if (input.filter) {
    params.set('$filter', input.filter);
  } else if (config.defaultFilter) {
    params.set('$filter', config.defaultFilter);
  }

  if (input.orderby) params.set('$orderby', input.orderby);

  const path = `${input.form}?${params.toString()}`;

  try {
    const result = await priorityGet(path) as { value: unknown[] };
    const rows = result.value ?? [];

    if (rows.length === 0) {
      return JSON.stringify({ count: 0, records: [], note: 'No records matched the query' });
    }

    return JSON.stringify({ count: rows.length, records: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return JSON.stringify({ error: message });
  }
}
