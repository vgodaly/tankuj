import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button, Copy, Heading, Page, usePalette } from '@/components/tankuj-ui';
import { FuelProvider, useFuel } from '@/state/fuel-store';

export const unstable_settings = { initialRouteName: 'index' };

function AppContent() {
  const { loading, error, retry } = useFuel();
  const c = usePalette();
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  if (loading)
    return (
      <Page brand={false}>
        <Heading title="tankuj." subtitle="Načítavame tvoju históriu." />
        <ActivityIndicator color={c.green} accessibilityLabel="Načítavanie" />
      </Page>
    );
  if (error)
    return (
      <Page brand={false}>
        <Heading title="Údaje sa nepodarilo načítať" />
        <Copy>{error}</Copy>
        <Button title="Skúsiť znova" onPress={retry} />
      </Page>
    );
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: c.background },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FuelProvider>
        <StatusBar style="auto" />
        <AppContent />
      </FuelProvider>
    </SafeAreaProvider>
  );
}
