import { Redirect } from 'expo-router';

// The signed-out guard lands on this group's root; send it to the login screen.
export default function AuthIndex() {
  return <Redirect href="/login" />;
}
