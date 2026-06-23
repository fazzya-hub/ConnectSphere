import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold
} from '@expo-google-fonts/sora';
import * as Notifications from 'expo-notifications';

import RootNavigator from './src/navigation/RootNavigator';
import OfflineBanner from './src/components/common/OfflineBanner';
import useAuthStore from './src/store/authStore';
import { subscribeToAuthState } from './src/services/authService';
import { registerForPushNotificationsAsync, saveFCMToken } from './src/services/notificationService';
import { ThemeProvider, lightColors, darkColors } from './src/theme/themeContext';
import useThemeStore from './src/store/themeStore';

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
    const unsubscribe = subscribeToAuthState(async (user) => {
      setUser(user);
      if (user?.uid) {
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await saveFCMToken(user.uid, token);
          }
        } catch (error) {
          console.error('Error setting up push notifications:', error);
        }
      }
    });
    return unsubscribe;
  }, [setUser]);

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

  const themeMode = useThemeStore((state) => state.mode);
  const isDark = themeMode === 'dark';
  const themeColors = isDark ? darkColors : lightColors;

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationContainer ref={navigationRef}>
            <OfflineBanner />
            <RootNavigator />
            <StatusBar style={isDark ? "light" : "dark"} backgroundColor={themeColors.background} />
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
