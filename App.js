import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { 
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold 
} from '@expo-google-fonts/sora';
import * as Notifications from 'expo-notifications';

import RootNavigator from './src/navigation/RootNavigator';
import useAuthStore from './src/store/authStore';
import { subscribeToAuthState } from './src/services/authService';
import { registerFCMToken } from './src/services/notificationService';
import { colors } from './src/theme';

// Handler saat app di-foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const setUser = useAuthStore((state) => state.setUser);
  const navigationRef = useNavigationContainerRef();
  const notifResponseListener = useRef();
  
  let [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  useEffect(() => {
    let prevUserId = null;

    const unsubscribe = subscribeToAuthState((user) => {
      setUser(user);

      // Register FCM token on login
      if (user?.uid && user.uid !== prevUserId) {
        registerFCMToken(user.uid);
        prevUserId = user.uid;
      } else if (!user) {
        prevUserId = null;
      }
    });

    return unsubscribe;
  }, [setUser]);

  // Deep link dari notifikasi — redirect ke screen yang relevan saat notifikasi diklik
  useEffect(() => {
    notifResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        if (!navigationRef.isReady()) return;

        if (data?.type === 'like' || data?.type === 'comment') {
          if (data.postId) {
            navigationRef.navigate('PostDetail', { postId: data.postId });
          }
        } else if (data?.type === 'follow' || data?.type === 'follow_request' || data?.type === 'follow_accept') {
          if (data.actorId) {
            navigationRef.navigate('UserProfile', { userId: data.actorId });
          }
        } else if (data?.type === 'dm') {
          if (data.conversationId) {
            navigationRef.navigate('Chat', { conversationId: data.conversationId });
          }
        }
      });

    return () => {
      if (notifResponseListener.current) {
        notifResponseListener.current.remove();
      }
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
        <StatusBar style="light" backgroundColor={colors.background} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
