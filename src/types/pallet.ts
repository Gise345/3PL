// Operator type definition
export interface Operator {
    id: number;
    operator_first_name: string;
    operator_last_name: string;
  }
  
  // Pallet type definition
  export interface PalletType {
    id: number;
    pallet_size: string;
    length: number;
    width: number;
    weight: number;
  }
  
  // Form for creating/updating pallet types
  export interface PalletTypeForm {
    pallet_size: string;
    length: string | number;
    width: string | number;
    weight: string | number;
  }
  
  // STU on a pallet
  export interface PalletStu {
    id: number;
    pallet_id: number;
    stu_id: string;
    order_number: string;
  }
  
  // Main pallet object
  export interface Pallet {
    id: number;
    pallet_type_id: number;
    description: string;
    closed: boolean;
    height?: number;
    palletStus: PalletStu[];
  }
  
  // Form for generating a new pallet
  export interface PalletForm {
    pallet_type_id: number | null;
    description: string;
  }
  
  // STU details
  export interface StuDetails {
    orderNumber: string;
  }
  
  // Summary information for a completed pallet
  export interface PalletSummary {
    pallet_id: number;
    order_numbers: string[];
    asns: string[];
    pallet_weight: number;
    cartons: number;
  }