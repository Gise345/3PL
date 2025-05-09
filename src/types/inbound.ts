export interface Inbound {
    inboundId: string;
    poNumber: string;
    companyName: string;
    companyCode: string;
    warehouse: string;
    requestedDate: string;
    timeSlot: string;
    transitType: string;
    containerType: string;
    numberPallets?: number;
    numberCartons?: number;
    inboundService: string;
    mrnRequired: boolean;
    mrn?: string;
  }
  
  export interface InboundPhoto {
    type: 'transit' | 'products' | 'mrn_doc';
    uri: string;
    name: string;
  }
  
  export interface InboundProcessingData {
    warehouse: string;
    poNumber: string;
    companyCode: string;
    inboundItemsPhoto?: string;
    transitTypePhoto?: string;
    timeReceived: string;
    receiptLane: string;
    inbound: Inbound;
    printerName: string;
    landedDate: string;
    transitType: string;
    numberOfPackages: number;
    landedBy: string;
    mrn?: string;
    haulierMrnDocPhoto?: string;
  }
  
  export interface UnknownInboundData {
    companyCode: string;
    warehouse: string;
    receiptLane: string;
    poNumber: string;
    carrierName: string;
    transitType: string;
    containerType: string;
    transit: string;
    products: string;
    packageType: string;
    numberOfPackages: number;
    receivedAt: string;
    printerName: string;
    landedBy: string;
    mrn?: string;
    haulierMrnDocPhoto?: string;
  }