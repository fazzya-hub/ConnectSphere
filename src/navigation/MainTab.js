import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FeedScreen from '../screens/main/FeedScreen';
import ExploreScreen from '../screens/main/ExploreScreen';
import CreatePostScreen from '../screens/post/CreatePostScreen';
import NotificationScreen from '../screens/main/NotificationScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

export default function MainTab() {
  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      })}
    >
      <Tab.Screen
        name="Home"
        component={FeedScreen}
        options={{ title: 'Feed' }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ title: 'Jelajahi' }}
      />
      <Tab.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ title: 'Buat Post', tabBarLabel: 'Buat' }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{ title: 'Notifikasi' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
}
