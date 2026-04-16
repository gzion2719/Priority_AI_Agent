export interface Order {
  ORDNAME: string;
  CUSTNAME: string;
  CDES: string;
  CURDATE: string;
  TOTPRICE: number;
  VAT: number;
  ORDSTATUSDES: string;
  DETAILS: string;
}

export interface PurchaseOrder {
  ORDNAME: string;
  SUPNAME: string;
  CDES: string;
  CURDATE: string;
  TOTPRICE: number;
  STATDES: string;
  DETAILS: string;
}

export interface Document {
  DOCNO: string;
  CUSTNAME: string;
  CDES: string;
  STARTDATE: string;
  TOTPRICE: number;
  CALLSTATUSCODE: string;
  TYPE: string;
  DETAILS: string;
}

export interface Invoice {
  IVNUM: string;
  CUSTNAME: string;
  CDES: string;
  IVDATE: string;
  TOTPRICE: number;
  STATDES: string;
  DETAILS: string;
}

export interface PriorityListResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
}
