import { useCallback, useState } from 'react';
import * as Location from 'expo-location';

/**
 * Mengambil koordinat dan nama tempat dari GPS lokal perangkat.
 * @returns {{ getCurrentLocation: Function, isLoading: boolean }}
 */
export function useCurrentLocation() {
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Izin lokasi belum diberikan.');
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      const place = places?.[0];
      const placeName = place
        ? [place.name, place.street, place.city, place.region].filter(Boolean).slice(0, 2).join(', ')
        : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

      return {
        data: { latitude, longitude, placeName },
        error: null,
      };
    } catch (error) {
      return { data: null, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getCurrentLocation, isLoading };
}
