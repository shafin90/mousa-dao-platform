import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Ionicons } from '@expo/vector-icons';

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
    updatedAt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTracking();
    const interval = setInterval(loadTracking, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const loadTracking = async () => {
    try {
      const { getLiveTripLocation } = require('../../src/api/tracking');
      const data = await getLiveTripLocation(id);
      setLocation(data);
    } catch {
      if (loading) {
        Alert.alert('Information', 'Live tracking is not yet available for this trip.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Connecting to live tracking..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map-outline" size={64} color={colors.textLight} />
        <Text style={styles.mapPlaceholderText}>
          Live Tracking Map
        </Text>
        <Text style={styles.mapPlaceholderSubtext}>
          Bus position will be displayed here
        </Text>
      </View>

      {location && (
        <View style={styles.locationInfo}>
          <Text style={styles.infoTitle}>Current Position</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Ionicons name="navigate" size={20} color={colors.accent} />
              <Text style={styles.infoValue}>
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </Text>
              <Text style={styles.infoLabel}>Coordinates</Text>
            </View>
            {location.speed !== undefined && (
              <View style={styles.infoCard}>
                <Ionicons name="speedometer" size={20} color={colors.accent} />
                <Text style={styles.infoValue}>{location.speed} km/h</Text>
                <Text style={styles.infoLabel}>Speed</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.note}>
        <Ionicons name="information-circle" size={16} color={colors.info} />
        <Text style={styles.noteText}>
          Position is updated every 10 seconds
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  mapPlaceholderText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  mapPlaceholderSubtext: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  locationInfo: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    marginTop: 0,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  infoCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.md,
  },
  noteText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
});
