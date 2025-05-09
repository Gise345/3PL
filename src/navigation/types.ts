import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Define the parameters for each screen
export type RootStackParamList = {
  // Auth Screens
  Login: undefined;
  
  // Main Screens
  Home: undefined;
  
  // Inbound Screens
  Inbound: undefined;
  InboundDetail: { inbound: any };
  UnknownInbound: undefined;
  
  // Outbound Screens
  CarrierOutbound: undefined;
  AdHocOutbound: undefined;
  
  // Cage Management
  ScanToCage: undefined;
  DispatchCages: undefined;
  
  // Quality Control
  VendorOrderChecklist: undefined;

  // Pallet Consolidation
  PalletConsolidation: undefined;
};

// Export screen props types for each screen
export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type InboundScreenProps = NativeStackScreenProps<RootStackParamList, 'Inbound'>;
export type InboundDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'InboundDetail'>;
export type UnknownInboundScreenProps = NativeStackScreenProps<RootStackParamList, 'UnknownInbound'>;
export type CarrierOutboundScreenProps = NativeStackScreenProps<RootStackParamList, 'CarrierOutbound'>;
export type AdHocOutboundScreenProps = NativeStackScreenProps<RootStackParamList, 'AdHocOutbound'>;
export type ScanToCageScreenProps = NativeStackScreenProps<RootStackParamList, 'ScanToCage'>;
export type DispatchCagesScreenProps = NativeStackScreenProps<RootStackParamList, 'DispatchCages'>;
export type VendorOrderChecklistScreenProps = NativeStackScreenProps<RootStackParamList, 'VendorOrderChecklist'>;
export type PalletConsolidationScreenProps = NativeStackScreenProps<RootStackParamList, 'PalletConsolidation'>;