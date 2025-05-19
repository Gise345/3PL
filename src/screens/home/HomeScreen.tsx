import React, { useState, useEffect, ReactNode } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  StatusBar,
  Image,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { logout } from '../../store/slices/authSlice';
import { setWarehouse, detectWarehouse } from '../../store/slices/settingsSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadows, typography, spacing } from '../../utils/theme';

// Get device dimensions for responsive sizing
const { width, height } = Dimensions.get('window');

// Define modern color palette
const COLORS = {
  background: '#F5F7FA',
  headerBackground: '#FFFFFF',
  card: '#FFFFFF',
  cardActive: '#F0F9F6',
  primary: '#00A9B5', // Changed to teal to match login screen
  secondary: '#333333', // Adjusted to match login screen
  accent: '#ff6f00',
  text: '#333333',
  textLight: '#888888',
  border: '#E0E0E0',
  shadow: 'rgba(0, 0, 0, 0.1)',
  danger: '#ff3b30',
};
// Define interface for MenuOption props
interface MenuOptionProps {
  title: string;
  icon: ReactNode;
  onPress: () => void;
}

const ModernHomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { warehouse, isWifiConnected, ssid } = useAppSelector((state) => state.settings);
  
  // State for expanded sections
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Warehouse options
  const warehouses = ['TFH', 'RDC'];
  
  // Animation values for each section
  const [receiveAnim] = useState(new Animated.Value(1));
  const [prepAnim] = useState(new Animated.Value(1));
  const [outboundAnim] = useState(new Animated.Value(1));
  const [logoutAnim] = useState(new Animated.Value(1));
  const [titleScale] = useState(new Animated.Value(1));
  const [titleRotate] = useState(new Animated.Value(0));
  
  // Setup continuous WiFi detection
  useEffect(() => {
    // Initial detection
    dispatch(detectWarehouse());
    
    // Set up interval to check WiFi periodically
    const interval = setInterval(() => {
      dispatch(detectWarehouse());
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [dispatch]);
  
  // Handle warehouse selection
  const handleWarehouseSelect = (selectedWarehouse: string) => {
    dispatch(setWarehouse(selectedWarehouse));
  };
  
  // Animate title on component mount
  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleScale, {
        toValue: 1.1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(titleScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
    
    // Subtle rotation animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(titleRotate, {
          toValue: 0.01,
          duration: 2000,
          useNativeDriver: true
        }),
        Animated.timing(titleRotate, {
          toValue: -0.01,
          duration: 2000,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);
  
  // Handle logout
  const handleLogout = () => {
    // Animate logout button before dispatching logout
    Animated.sequence([
      Animated.timing(logoutAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(logoutAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Confirm logout with dialog
      Alert.alert(
        'Logout Confirmation',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          { 
            text: 'Logout', 
            style: 'destructive',
            onPress: () => dispatch(logout())
          }
        ],
        { cancelable: true }
      );
    });
  };
  
  // Navigate to screens
  const navigateTo = (screen: string) => {
    // Close section before navigating
    setExpandedSection(null);
    resetAnimations();
    navigation.navigate(screen as never);
  };
  
  // Handle section toggle
  const toggleSection = (section: string) => {
    // If already expanded, collapse
    if (expandedSection === section) {
      setExpandedSection(null);
      resetAnimations();
      return;
    }
    
    // Expand the selected section
    setExpandedSection(section);
    
    // Animate the selected section
    if (section === 'receive') {
      animateSection(receiveAnim, 1.05);
      animateSection(prepAnim, 0.95);
      animateSection(outboundAnim, 0.95);
    } else if (section === 'prep') {
      animateSection(receiveAnim, 0.95);
      animateSection(prepAnim, 1.05);
      animateSection(outboundAnim, 0.95);
    } else if (section === 'outbound') {
      animateSection(receiveAnim, 0.95);
      animateSection(prepAnim, 0.95);
      animateSection(outboundAnim, 1.05);
    }
  };
  
  // Animate section
  const animateSection = (anim: Animated.Value, toValue: number) => {
    Animated.spring(anim, {
      toValue,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  // Reset all animations
  const resetAnimations = () => {
    Animated.parallel([
      Animated.spring(receiveAnim, { toValue: 1, useNativeDriver: true, friction: 5 }),
      Animated.spring(prepAnim, { toValue: 1, useNativeDriver: true, friction: 5 }),
      Animated.spring(outboundAnim, { toValue: 1, useNativeDriver: true, friction: 5 }),
    ]).start();
  };
  
  // Menu option component
  const MenuOption: React.FC<MenuOptionProps> = ({ title, icon, onPress }) => (
    <TouchableOpacity 
      style={styles.menuOption} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <View style={styles.menuIconContainer}>{icon}</View>}
      <Text style={styles.menuOptionText}>{title}</Text>
      <View style={styles.arrowContainer}>
        <Text style={styles.arrowIcon}>→</Text>
      </View>
    </TouchableOpacity>
  );
  
  // Convert degrees to radians for the rotation animation
  const spin = titleRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-2deg', '2deg']
  });
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.headerBackground} />
      
      <View style={styles.container}>
        {/* Header with solid background */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
            <Animated.Text 
              style={[
                styles.headerTitle,
                { 
                  transform: [
                    { scale: titleScale },
                    { rotate: spin }
                  ] 
                }
              ]}
            >
              <Text style={styles.headerTitleText}>3PL </Text>
              <Text style={[styles.headerTitleText, styles.warehouseText]}>Door</Text>
            </Animated.Text>
            </View>
            
            <View style={styles.profileIcon}>
              <Text style={styles.profileIconText}>{user?.email?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
          </View>
          
          {/* Warehouse Selector - Now more subtle */}
          <View style={styles.warehouseSelector}>
            {warehouses.map((wh) => (
              <TouchableOpacity
                key={wh}
                style={[
                  styles.warehouseOption,
                  warehouse === wh && styles.warehouseOptionActive
                ]}
                onPress={() => handleWarehouseSelect(wh)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.warehouseOptionText,
                    warehouse === wh && styles.warehouseOptionTextActive
                  ]}
                >
                  {wh}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Main content area with gap from header */}
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Receive Section */}
          <Animated.View 
            style={[
              styles.sectionCard,
              { transform: [{ scale: receiveAnim }] },
              expandedSection === 'receive' && styles.sectionCardActive
            ]}
          >
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('receive')}
              activeOpacity={0.9}
            >
              <View style={[styles.sectionIcon, { backgroundColor: 'rgba(0, 169, 181, 0.1)' }]}>
                <Text style={[styles.sectionIconText, { color: COLORS.primary }]}>📦</Text>
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Receive</Text>
                <Text style={styles.sectionSubtitle}>Manage inbound deliveries</Text>
              </View>
              <Text style={styles.expandIcon}>
                {expandedSection === 'receive' ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            
            {expandedSection === 'receive' && (
              <View style={styles.sectionContent}>
                <MenuOption 
                  title="Inbound" 
                  icon={<Text style={styles.menuIcon}>📅</Text>}
                  onPress={() => navigateTo('Inbound')}
                />
                <MenuOption 
                  title="Unknown Inbound" 
                  icon={<Text style={styles.menuIcon}>❓</Text>}
                  onPress={() => navigateTo('UnknownInbound')}
                />
              </View>
            )}
          </Animated.View>
          
          {/* Prep Section */}
          <Animated.View 
            style={[
              styles.sectionCard,
              { transform: [{ scale: prepAnim }] },
              expandedSection === 'prep' && styles.sectionCardActive
            ]}
          >
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('prep')}
              activeOpacity={0.9}
            >
              <View style={[styles.sectionIcon, { backgroundColor: 'rgba(24, 89, 230, 0.1)' }]}>
                <Text style={[styles.sectionIconText, { color: COLORS.secondary }]}>🔧</Text>
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Prep</Text>
                <Text style={styles.sectionSubtitle}>Organize and prepare items</Text>
              </View>
              <Text style={styles.expandIcon}>
                {expandedSection === 'prep' ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            
            {expandedSection === 'prep' && (
              <View style={styles.sectionContent}>
                <MenuOption 
                  title="Pallet Consolidation" 
                  icon={<Text style={styles.menuIcon}>📚</Text>}
                  onPress={() => navigateTo('PalletConsolidation')}
                />
                <MenuOption 
                  title="Scan To Cage" 
                  icon={<Text style={styles.menuIcon}>📱</Text>}
                  onPress={() => navigateTo('ScanToCage')}
                />
                <MenuOption 
                  title="Vendor Order Checklist" 
                  icon={<Text style={styles.menuIcon}>✓</Text>}
                  onPress={() => navigateTo('VendorOrderChecklist')}
                />
              </View>
            )}
          </Animated.View>
          
          {/* Outbound Section */}
          <Animated.View 
            style={[
              styles.sectionCard,
              { transform: [{ scale: outboundAnim }] },
              expandedSection === 'outbound' && styles.sectionCardActive
            ]}
          >
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('outbound')}
              activeOpacity={0.9}
            >
              <View style={[styles.sectionIcon, { backgroundColor: 'rgba(255, 111, 0, 0.1)' }]}>
                <Text style={[styles.sectionIconText, { color: COLORS.accent }]}>🚚</Text>
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Outbound</Text>
                <Text style={styles.sectionSubtitle}>Process outgoing shipments</Text>
              </View>
              <Text style={styles.expandIcon}>
                {expandedSection === 'outbound' ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            
            {expandedSection === 'outbound' && (
              <View style={styles.sectionContent}>
                <MenuOption 
                  title="Carrier Load Out" 
                  icon={<Text style={styles.menuIcon}>🚛</Text>}
                  onPress={() => navigateTo('CarrierOutbound')}
                />
                <MenuOption 
                  title="Dispatch Cages" 
                  icon={<Text style={styles.menuIcon}>📤</Text>}
                  onPress={() => navigateTo('DispatchCages')}
                />
                <MenuOption 
                  title="Ad-Hoc Load Out" 
                  icon={<Text style={styles.menuIcon}>📝</Text>}
                  onPress={() => navigateTo('AdHocOutbound')}
                />
              </View>
            )}
          </Animated.View>
          
          {/* User info and connection status */}
          <View style={styles.userInfoContainer}>
            <Text style={styles.userEmail}>{user?.email || 'User'}</Text>
            <Text style={styles.connectionStatus}>
              {isWifiConnected 
                ? `🟢 Connected to ${ssid || 'Wi-Fi'}` 
                : `🔴 No network connection`}
            </Text>
            <Text style={styles.warehouseStatus}>
              Current warehouse: <Text style={styles.warehouseValue}>{warehouse}</Text>
              {isWifiConnected && (
                <TouchableOpacity onPress={() => dispatch(detectWarehouse())}>
                  <Text style={styles.refreshText}> 🔄</Text>
                </TouchableOpacity>
              )}
            </Text>
          </View>
          
          {/* Modern Logout Button */}
          <Animated.View 
            style={[
              styles.logoutButtonContainer,
              { transform: [{ scale: logoutAnim }] }
            ]}
          >
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutIcon}>🔒</Text>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={styles.versionText}>v1.0.0</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.headerBackground, // Match header background
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    backgroundColor: COLORS.headerBackground,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  titleContainer: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    marginBottom: 2,
  },
  headerTitleText: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 169, 181, 0.3)', // Update to match teal color
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  warehouseText: {
    color: COLORS.secondary,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  profileIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  warehouseSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginTop: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
  },
  warehouseSelectorLabel: {
    color: COLORS.textLight,
    fontSize: 12,
    marginRight: 10,
  },
  warehouseOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  warehouseOptionActive: {
    backgroundColor: COLORS.card,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  warehouseOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  warehouseOptionTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: 24, // Add margin between header and content
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12, // Add padding at top of content
    paddingBottom: 30,
  },
  sectionCard: {
    marginBottom: 20,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  sectionCardActive: {
    backgroundColor: COLORS.cardActive,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'rgba(0, 169, 181, 0.1)', // Update to teal theme
    marginRight: 15,
  },
  sectionIconText: {
    fontSize: 20,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  sectionContent: {
    paddingBottom: 10,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuIconContainer: {
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuOptionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  arrowIcon: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  userInfoContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 5,
  },
  connectionStatus: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  warehouseStatus: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 5,
  },
  warehouseValue: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  refreshText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  logoutButtonContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 169, 181, 0.1)', // Changed from red to teal
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '60%',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary, // Changed from danger to primary
  },
  versionText: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ModernHomeScreen;