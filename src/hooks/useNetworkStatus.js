import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Memantau koneksi perangkat dengan NetInfo.
 * @returns {{ isConnected: boolean, isInternetReachable: boolean|null }}
 */
export function useNetworkStatus() {
  const [state, setState] = useState({
    isConnected: true,
    isInternetReachable: true,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((nextState) => {
      setState({
        isConnected: !!nextState.isConnected,
        isInternetReachable: nextState.isInternetReachable,
      });
    });

    return () => unsubscribe();
  }, []);

  return state;
}
