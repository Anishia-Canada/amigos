import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Colors } from '@/constants/colors';

export default function HomeownerTabs() {
  return (
    <NativeTabs tintColor={Colors.primary}>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="bookings">
        <NativeTabs.Trigger.Label>My bookings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="event" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
