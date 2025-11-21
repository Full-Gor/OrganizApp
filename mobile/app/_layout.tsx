import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="project/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Projet',
            presentation: 'card',
          }}
        />
      </Stack>
    </>
  );
}
