import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from '../../../data/types';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../../utils/constants';
import { useColors } from '../../../hooks/useColors';
import { formatDate } from '../../../utils/format';

interface ProfileHeaderProps {
  user: User;
}

function ProfileHeaderComponent({ user }: ProfileHeaderProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </Text>
      </View>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <Text style={styles.memberSince}>Member since {formatDate(user.createdAt)}</Text>
    </View>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: FONT_SIZE.largeTitle,
    fontWeight: '700',
    color: COLORS.whiteText,
  },
  name: {
    fontSize: FONT_SIZE.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  email: {
    fontSize: FONT_SIZE.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  memberSince: {
    fontSize: FONT_SIZE.caption,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
  },
});
}

export const ProfileHeader = memo(ProfileHeaderComponent);
