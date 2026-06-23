import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuthStore from '../store/authStore';
import Loader from '../components/common/Loader';
import AuthStack from './AuthStack';
import MainDrawer from './MainDrawer';
import ChatScreen from '../screens/dm/ChatScreen';
import PostDetailScreen from '../screens/post/PostDetailScreen';
import UserProfileScreen from '../screens/social/UserProfileScreen';
import FollowersScreen from '../screens/social/FollowersScreen';
import FollowingScreen from '../screens/social/FollowingScreen';
import FollowRequestScreen from '../screens/social/FollowRequestScreen';
import NotificationPreferenceScreen from '../screens/settings/NotificationPreferenceScreen';
import { useAppTheme } from '../theme/themeContext';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { colors } = useAppTheme();

  const modalScreenOptions = {
    headerShown: false,
    contentStyle: { backgroundColor: colors.background },
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainDrawer} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={modalScreenOptions}
          />
          <Stack.Screen
            name="PostDetail"
            component={PostDetailScreen}
            options={modalScreenOptions}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={modalScreenOptions}
          />
          <Stack.Screen
            name="Followers"
            component={FollowersScreen}
            options={modalScreenOptions}
          />
          <Stack.Screen
            name="Following"
            component={FollowingScreen}
            options={modalScreenOptions}
          />
          <Stack.Screen
            name="FollowRequests"
            component={FollowRequestScreen}
            options={modalScreenOptions}
          />
          <Stack.Screen
            name="NotificationPreferences"
            component={NotificationPreferenceScreen}
            options={modalScreenOptions}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
