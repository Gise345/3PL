export interface Operator {
    id: number;
    operator_first_name: string;
    operator_last_name: string;
  }
  
  export interface OrderDetails {
    ShipmentId: string;
    CarrierId: string;
    ShipAddress: Array<{
      Name: string;
      Address1?: string;
      City?: string;
      PostCode?: string;
      Country?: string;
    }>;
  }
  
  export interface ScanToCageParams {
    orderTrackNumber: string;
    operatorId: number;
    cageId: string;
    warehouse: string;
  }