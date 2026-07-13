import React, { memo, useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../utils/constants';
import { useColors } from '../../hooks/useColors';
import { useThemeStore } from '../../store/themeStore';

function InfoScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { title } = route.params ?? { title: '' };

  const content = useMemo(() => {
    if (title === 'Settings') return <SettingsContent />;
    if (title === 'Help & Support') return <HelpContent />;
    if (title === 'About') return <AboutContent />;
    return null;
  }, [title]);

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.spacer} />
      </View>
      <View style={styles.content}>{content}</View>
    </ScreenWrapper>
  );
}

function SettingsContent() {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const setDark = useThemeStore((s) => s.setDark);
  const [darkMode, setDarkMode] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);

  const showComingSoon = useCallback((feature: string) => {
    Alert.alert(feature, 'This feature will be available in a future update.');
  }, []);

  return (
    <View>
      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.section}>
        <View style={styles.settingRow}>
          <Ionicons name="notifications" size={22} color={COLORS.textSecondary} style={styles.settingIcon} />
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: COLORS.cardBorder, true: COLORS.primary + '60' }}
            thumbColor={pushEnabled ? COLORS.primary : COLORS.textTertiary}
          />
        </View>
        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <Ionicons name="mail" size={22} color={COLORS.textSecondary} style={styles.settingIcon} />
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Email Notifications</Text>
          </View>
          <Switch
            value={emailNotif}
            onValueChange={setEmailNotif}
            trackColor={{ false: COLORS.cardBorder, true: COLORS.primary + '60' }}
            thumbColor={emailNotif ? COLORS.primary : COLORS.textTertiary}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.section}>
        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <Ionicons name="moon" size={22} color={COLORS.textSecondary} style={styles.settingIcon} />
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={(value) => { setDark(value); setDarkMode(value); }}
            trackColor={{ false: COLORS.cardBorder, true: COLORS.primary + '60' }}
            thumbColor={darkMode ? COLORS.primary : COLORS.textTertiary}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>General</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.settingRow} onPress={() => showComingSoon('Language')} activeOpacity={0.7}>
          <Ionicons name="language" size={22} color={COLORS.textSecondary} style={styles.settingIcon} />
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Language</Text>
            <Text style={styles.settingValue}>English</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow} onPress={() => showComingSoon('Privacy')} activeOpacity={0.7}>
          <Ionicons name="shield-checkmark" size={22} color={COLORS.textSecondary} style={styles.settingIcon} />
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Privacy</Text>
            <Text style={styles.settingValue}>Standard</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]} onPress={() => showComingSoon('Clear Cache')} activeOpacity={0.7}>
          <Ionicons name="trash" size={22} color={COLORS.textSecondary} style={styles.settingIcon} />
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Clear Cache</Text>
            <Text style={styles.settingValue}>0 B</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function HelpContent() {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View>
      <View style={styles.helpCard}>
        <Ionicons name="call" size={28} color={COLORS.primary} />
        <Text style={styles.helpTitle}>Call Us</Text>
        <Text style={styles.helpDetail}>+20 100 123 4567</Text>
        <Text style={styles.helpHint}>Sun–Thu, 8AM – 8PM</Text>
      </View>

      <View style={styles.helpCard}>
        <Ionicons name="mail" size={28} color={COLORS.primary} />
        <Text style={styles.helpTitle}>Email</Text>
        <Text style={styles.helpDetail}>support@busticket.com</Text>
        <Text style={styles.helpHint}>We reply within 24 hours</Text>
      </View>

      <View style={styles.helpCard}>
        <Ionicons name="chatbubbles" size={28} color={COLORS.primary} />
        <Text style={styles.helpTitle}>Live Chat</Text>
        <Text style={styles.helpDetail}>Available on the website</Text>
        <Text style={styles.helpHint}>Instant support</Text>
      </View>

      <View style={styles.faqSection}>
        <Text style={styles.faqTitle}>Frequently Asked</Text>
        {[
          'How do I cancel my booking?',
          'Can I change my seat?',
          'What if I miss the bus?',
          'Is the ticket refundable?',
        ].map((q) => (
          <TouchableOpacity key={q} style={styles.faqItem} activeOpacity={0.7}>
            <Text style={styles.faqText}>{q}</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function AboutContent() {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View>
      <View style={styles.aboutLogo}>
        <Ionicons name="bus" size={48} color={COLORS.primary} />
        <Text style={styles.aboutAppName}>BusTicket</Text>
        <Text style={styles.aboutVersion}>Version 1.0.0</Text>
      </View>

      <View style={styles.aboutCard}>
        <Text style={styles.aboutDesc}>
          Your trusted bus booking platform in Egypt. Book tickets across all major cities
          with real-time availability and secure payments.
        </Text>
      </View>

      <View style={styles.aboutInfo}>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Developer</Text>
          <Text style={styles.aboutValue}>BusTicket Inc.</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Platform</Text>
          <Text style={styles.aboutValue}>iOS & Android</Text>
        </View>
        <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.aboutLabel}>Updated</Text>
          <Text style={styles.aboutValue}>June 2026</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backText: { fontSize: FONT_SIZE.body, color: COLORS.primary, fontWeight: '600' },
  title: { flex: 1, fontSize: FONT_SIZE.headline, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  spacer: { width: 60 },
  content: { flex: 1, padding: SPACING.md },

  // Settings
  sectionTitle: {
    fontSize: FONT_SIZE.caption,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
    marginLeft: SPACING.xs,
  },
  section: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  settingIcon: { marginRight: SPACING.sm },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: FONT_SIZE.body, fontWeight: '600', color: COLORS.text },
  settingValue: { fontSize: FONT_SIZE.caption, color: COLORS.textSecondary, marginTop: 2 },

  // Help
  helpCard: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md + 4,
    marginBottom: SPACING.sm + 4,
  },
  helpTitle: { fontSize: FONT_SIZE.headline, fontWeight: '700', color: COLORS.text, marginTop: SPACING.sm },
  helpDetail: { fontSize: FONT_SIZE.body, color: COLORS.text, marginTop: SPACING.xs },
  helpHint: { fontSize: FONT_SIZE.caption, color: COLORS.textSecondary, marginTop: 2 },
  faqSection: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  faqTitle: {
    fontSize: FONT_SIZE.body,
    fontWeight: '700',
    color: COLORS.text,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  faqText: { flex: 1, fontSize: FONT_SIZE.body, color: COLORS.text },

  // About
  aboutLogo: { alignItems: 'center', paddingVertical: SPACING.lg },
  aboutAppName: { fontSize: FONT_SIZE.title + 2, fontWeight: '700', color: COLORS.text, marginTop: SPACING.sm },
  aboutVersion: { fontSize: FONT_SIZE.body, color: COLORS.textSecondary, marginTop: SPACING.xs },
  aboutCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  aboutDesc: { fontSize: FONT_SIZE.body, color: COLORS.text, lineHeight: 22, textAlign: 'center' },
  aboutInfo: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  aboutLabel: { fontSize: FONT_SIZE.body, color: COLORS.textSecondary },
  aboutValue: { fontSize: FONT_SIZE.body, fontWeight: '600', color: COLORS.text },
});
}

export default memo(InfoScreen);
