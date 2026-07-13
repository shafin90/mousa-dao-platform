import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTrips } from '../../hooks/useTrips';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { HomeHeader } from './components/HomeHeader';
import { SearchBar } from './components/SearchBar';
import { PopularTripList } from './components/PopularTripList';
import { Trip } from '../../data/types';
import { SPACING } from '../../utils/constants';
import { useColors } from '../../hooks/useColors';

interface RouteItem {
  key: string;
  origin: string;
  destination: string;
  count: number;
}

function HomeScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => createHomeScreenStyles(COLORS), [COLORS]);
  const navigation = useNavigation<any>();
  const { fetchPopularTrips, trips, popularTrips, isLoading } = useTrips();

  const handleSearch = useCallback((origin: string, destination: string) => {
    navigation.navigate('TripList', { origin, destination });
  }, [navigation]);

  useEffect(() => {
    fetchPopularTrips();
  }, []);

  const uniqueRoutes = useMemo(() => {
    const map = new Map<string, RouteItem>();
    trips.forEach((t) => {
      const key = `${t.origin}|${t.destination}`;
      if (map.has(key)) {
        map.get(key)!.count++;
      } else {
        map.set(key, { key, origin: t.origin, destination: t.destination, count: 1 });
      }
    });
    return Array.from(map.values());
  }, [trips]);

  return (
    <ScreenWrapper>
      {isLoading && trips.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <View style={styles.container}>
          <View>
            <HomeHeader />
            <SearchBar onSearch={handleSearch} />
            {!isLoading && popularTrips.length > 0 && (
              <PopularTripList trips={popularTrips} />
            )}
          </View>
          {uniqueRoutes.length > 0 && (
            <View style={styles.routesSection}>
              <Text style={styles.sectionTitle}>All Routes</Text>
              <ScrollView style={styles.routesList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                {uniqueRoutes.map((item) => (
                  <RouteListItem
                    key={item.key}
                    origin={item.origin}
                    destination={item.destination}
                    count={item.count}
                    onPress={() => navigation.navigate('TripList', { origin: item.origin, destination: item.destination })}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </ScreenWrapper>
  );
}

const RouteListItem = memo(({ origin, destination, count, onPress }: {
  origin: string; destination: string; count: number; onPress: () => void;
}) => {
  const COLORS = useColors();
  const styles = useMemo(() => createRouteListItemStyles(COLORS), [COLORS]);
  return (
    <TouchableOpacity style={styles.tripItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.routeTextBlock}>
        <Text style={styles.tripRoute}>{origin} → {destination}</Text>
        <Text style={styles.tripTime}>{count} departures</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
});

function createHomeScreenStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    routesSection: {
      flex: 1,
      marginTop: SPACING.lg,
    },
    routesList: {
      flex: 1,
    },
    list: {
      paddingBottom: SPACING.xl,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: COLORS.text,
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.sm,
    },
  });
}

function createRouteListItemStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    tripItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 6,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.cardBorder,
      marginHorizontal: SPACING.md,
    },
    routeTextBlock: {
      flex: 1,
    },
    tripRoute: {
      fontSize: 15,
      fontWeight: '600',
      color: COLORS.text,
    },
    tripTime: {
      fontSize: 13,
      color: COLORS.textSecondary,
      marginTop: 2,
    },
    arrow: {
      fontSize: 22,
      color: COLORS.textTertiary,
      marginLeft: SPACING.sm,
    },
  });
}

export default memo(HomeScreen);
