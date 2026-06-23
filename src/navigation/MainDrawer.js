import { createDrawerNavigator } from '@react-navigation/drawer';
import MainTab from './MainTab';
import InboxScreen from '../screens/dm/InboxScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { colors } from '../theme';

const Drawer = createDrawerNavigator();

export default function MainDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceLight },
        headerTintColor: colors.primary,
        drawerStyle: { backgroundColor: colors.surface },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        headerShown: true,
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={MainTab}
        options={{
          title: 'ConnectSphere',
            drawerLabel: 'Home',  
        }}
      />
      <Drawer.Screen
        name="Inbox"
        component={InboxScreen}
        options={{ title: 'Inbox' }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Pengaturan' }}
      />
    </Drawer.Navigator>
  );
}
