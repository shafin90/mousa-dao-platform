import React, { memo, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useBooking } from '../../hooks/useBooking';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileMenu } from './components/ProfileMenu';

const INFO_TITLES: Record<string, string> = {
  settings: 'Settings',
  help: 'Help & Support',
  about: 'About',
};

function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const { reset } = useBooking();

  const handleMenuItemPress = useCallback((itemId: string) => {
    switch (itemId) {
      case 'bookings':
        navigation.navigate('Bookings');
        break;
      case 'payments':
        navigation.navigate('PaymentHistory');
        break;
      case 'settings':
      case 'help':
      case 'about':
        navigation.navigate('Info', { title: INFO_TITLES[itemId] });
        break;
    }
  }, [navigation]);

  const handleLogout = useCallback(async () => {
    reset();
    await logout();
  }, [logout, reset]);

  if (!user) return null;

  return (
    <ScreenWrapper>
      <ProfileHeader user={user} />
      <ProfileMenu onMenuItemPress={handleMenuItemPress} onLogout={handleLogout} />
    </ScreenWrapper>
  );
}

export default memo(ProfileScreen);
