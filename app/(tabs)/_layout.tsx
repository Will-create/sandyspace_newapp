import { Tabs } from 'expo-router';
import { Package, ShoppingCart, ChartBar as BarChart3, Settings, CreditCard } from 'lucide-react-native';
import { Platform, View } from 'react-native';

const BURGUNDY = '#400605';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: BURGUNDY,
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          borderRadius: 25,
          height: 70,
          paddingBottom: 8,
          paddingTop: 10,
          paddingHorizontal: 10,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 10,
          },
          shadowOpacity: 0.12,
          shadowRadius: 15,
          elevation: 20,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
        tabBarIconStyle: {
          marginBottom: -4,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 11,
          marginTop: 2,
        },
        tabBarBackground: () => (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'white',
              borderRadius: 25,
              ...(Platform.OS === 'ios' && {
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 10,
                },
                shadowOpacity: 0.12,
                shadowRadius: 15,
              }),
            }}
          />
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Produits',
          tabBarIcon: ({ size, color, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                ...(focused && {
                  backgroundColor: `${BURGUNDY}15`,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }),
              }}
            >
              <Package size={focused ? 22 : 20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="pos"
        options={{
          title: 'Caisse',
          tabBarIcon: ({ size, color, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                ...(focused && {
                  backgroundColor: `${BURGUNDY}15`,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }),
              }}
            >
              <CreditCard size={focused ? 22 : 20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Ventes',
          tabBarIcon: ({ size, color, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                ...(focused && {
                  backgroundColor: `${BURGUNDY}15`,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }),
              }}
            >
              <ShoppingCart size={focused ? 22 : 20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ size, color, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                ...(focused && {
                  backgroundColor: `${BURGUNDY}15`,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }),
              }}
            >
              <Settings size={focused ? 22 : 20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}