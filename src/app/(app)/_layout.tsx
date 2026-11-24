import { Stack } from 'expo-router';

// The tabs are always the starting point. In Simple mode (workers) the tabs
// layout redirects to /simple, and /simple redirects back for the detailed
// app, so both homes sit over the same data and screens.
export const unstable_settings = { initialRouteName: '(tabs)' };

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="simple" />
      <Stack.Screen
        name="quick-add"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.75, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 16,
        }}
      />
      <Stack.Screen name="plans" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
