import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: '@mousa_token',
  USER: '@mousa_user',
  FIREBASE_PHONE: '@mousa_firebase_phone',
} as const;

export const storage = {
  async setToken(token: string) {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
  },
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.TOKEN);
  },
  async removeToken() {
    await AsyncStorage.removeItem(KEYS.TOKEN);
  },

  async setUser(user: any) {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },
  async getUser(): Promise<any | null> {
    const data = await AsyncStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  async removeUser() {
    await AsyncStorage.removeItem(KEYS.USER);
  },

  async setFirebasePhone(phone: string) {
    await AsyncStorage.setItem(KEYS.FIREBASE_PHONE, phone);
  },
  async getFirebasePhone(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.FIREBASE_PHONE);
  },
  async removeFirebasePhone() {
    await AsyncStorage.removeItem(KEYS.FIREBASE_PHONE);
  },

  async clearAll() {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
