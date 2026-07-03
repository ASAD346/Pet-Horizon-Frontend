import { ProfileHubView } from '@/components/profile';
import { StatusBar } from 'expo-status-bar';

export default function ProfileScreen() {
  return (
    <>
      <StatusBar style="dark" />
      <ProfileHubView />
    </>
  );
}
