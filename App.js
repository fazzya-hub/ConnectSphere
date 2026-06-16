import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { 
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold 
} from '@expo-google-fonts/sora';

import RootNavigator from './src/navigation/RootNavigator';
import useAuthStore from './src/store/authStore';
import { subscribeToAuthState } from './src/services/authService';
import { colors } from './src/theme';

export default function App() {
  const setUser = useAuthStore((state) => state.setUser);
  
  let [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, [setUser]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="light" backgroundColor={colors.background} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
