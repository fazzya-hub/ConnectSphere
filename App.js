import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import useAuthStore from './src/store/authStore';
import { subscribeToAuthState } from './src/services/authService';
import { colors } from './src/theme';

export default function App() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, [setUser]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="light" backgroundColor={colors.background} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
