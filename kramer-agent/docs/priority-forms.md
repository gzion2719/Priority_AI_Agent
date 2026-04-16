# Priority Forms — KRAMER Agent

## Forms in Scope

### ORDERS — Sales Orders (הזמנות מכירה)
| Field | Type | Description |
|---|---|---|
| ORDNAME | string | Order number (key) |
| CUSTNAME | string | Customer code |
| CDES | string | Customer display name |
| CURDATE | datetime | Order date |
| TOTPRICE | number | Total price (incl. VAT) |
| VAT | number | VAT amount |
| ORDSTATUSDES | string | Order status description |
| DETAILS | string | Free-text details |

---

### PORDERS — Purchase Orders (הזמנות רכש)
| Field | Type | Description |
|---|---|---|
| ORDNAME | string | PO number (key) |
| SUPNAME | string | Supplier code |
| CDES | string | Supplier display name |
| CURDATE | datetime | PO date |
| TOTPRICE | number | Total price |
| VAT | number | VAT amount |
| STATDES | string | Status description |
| DETAILS | string | Free-text details |

---

### DOCUMENTS_Q — Warehouse & Service Documents (מסמכי מחסן ושירות)

**Endpoint:** `DOCUMENTS_Q` (the plain `DOCUMENTS` endpoint returns 404)
**Default filter:** Scoped to the 8 configured TYPE codes below.

#### TYPE codes in scope

| TYPE | English Name | Hebrew Name |
|---|---|---|
| D | Customer Shipment | תעודת משלוח ללקוח |
| Q | Service Call | קריאת שירות |
| N | Customer Return | החזרה מלקוח |
| W | Return to Vendor | החזרה לספק |
| Z | Service Contract | חוזה שירות |
| m | RMA Document | מסמך RMA |
| F | Subcontractor Shipment | משלוח קבלן משנה |
| P | Receipt of Goods | קבלת סחורה |

> **Important:** TYPE values are case-sensitive. `'m'` (RMA) ≠ `'M'` (Assembly Component).

#### Fields
| Field | Type | Description |
|---|---|---|
| DOCNO | string | Document number (key) |
| TYPE | string | Document type code (see table above) |
| CUSTNAME | string | Customer code |
| CDES | string | Customer display name |
| STARTDATE | datetime | Document start date |
| TOTPRICE | number | Total price |
| CALLSTATUSCODE | string | Status code |
| DETAILS | string | Free-text details |

> **Note:** `TYPEDES` field does NOT exist on `DOCUMENTS_Q`. Use the TYPE code lookup table above.

---

### AINVOICES — Customer Invoices (חשבוניות לקוח)

> Use `AINVOICES` — the endpoint `INVOICES` returns 404 in Priority REST API.

| Field | Type | Description |
|---|---|---|
| IVNUM | string | Invoice number (key) |
| CUSTNAME | string | Customer code |
| CDES | string | Customer display name |
| IVDATE | datetime | Invoice date |
| TOTPRICE | number | Total amount |
| VAT | number | VAT amount |
| STATDES | string | Status description |
| DETAILS | string | Free-text details |

---

## OData Patterns

### Date filter
```
CURDATE gt 2024-01-01T00:00:00Z and CURDATE lt 2024-12-31T00:00:00Z
```

### Filter by document type
```
TYPE eq 'D'
TYPE eq 'D' or TYPE eq 'N'
```

### Filter by customer
```
CUSTNAME eq 'KRAMER'
```

### Combined example
```
(TYPE eq 'D' or TYPE eq 'P') and CUSTNAME eq 'KRAMER' and STARTDATE gt 2024-01-01T00:00:00Z
```

---

## Verified Against
- Sandbox: `https://t.eu.priority-connect.online/odata/Priority/tabbtd38.ini/usdemo`
- Last verified: 2026-04-16
