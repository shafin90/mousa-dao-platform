import { getAuth, signInWithPhoneNumber, getIdToken as getFirebaseIdToken } from '@react-native-firebase/auth';

const auth = getAuth();

let _confirmation: any = null;

export const sendOtp = async (phoneNumber: string) => {
  _confirmation = await signInWithPhoneNumber(auth, phoneNumber);
  return _confirmation;
};

export const confirmOtp = async (code: string) => {
  if (!_confirmation) throw new Error('No confirmation. Request OTP first.');
  return _confirmation.confirm(code);
};

export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return getFirebaseIdToken(user);
};

export const signOutFirebase = async () => {
  await auth.signOut();
  _confirmation = null;
};
