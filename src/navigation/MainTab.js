import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
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
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'CreatePost') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
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
