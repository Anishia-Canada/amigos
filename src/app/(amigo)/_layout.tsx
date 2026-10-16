import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Colors } from '@/constants/colors';

export default function AmigoTabs() {
  return (
    <NativeTabs tintColor={Colors.primary}>
      <NativeTabs.Trigger name="offers">
        <NativeTabs.Trigger.Label>Offers</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="tray" md="inbox" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="schedule">
        <NativeTabs.Trigger.Label>Schedule</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="event" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
