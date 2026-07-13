import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../../utils/constants';
import { useColors } from '../../../hooks/useColors';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'bookings', label: 'My Bookings', icon: 'receipt' },
  { id: 'payments', label: 'Payment History', icon: 'card' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'help', label: 'Help & Support', icon: 'help-circle' },
  { id: 'about', label: 'About', icon: 'information-circle' },
];

interface ProfileMenuProps {
  onMenuItemPress: (itemId: string) => void;
  onLogout: () => void;
}

function ProfileMenuComponent({ onMenuItemPress, onLogout }: ProfileMenuProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.container}>
      <View style={styles.menuSection}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => onMenuItemPress(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name={item.icon as any} size={22} color={COLORS.textSecondary} style={styles.menuIcon} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.7}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  menuSection: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  menuIcon: {
    width: 28,
    marginRight: SPACING.sm,
  },
  menuLabel: {
    flex: 1,
    fontSize: FONT_SIZE.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuArrow: {
    fontSize: FONT_SIZE.title,
    color: COLORS.textTertiary,
  },
  logoutButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: FONT_SIZE.headline,
    fontWeight: '600',
    color: COLORS.error,
  },
});
}

export const ProfileMenu = memo(ProfileMenuComponent);
