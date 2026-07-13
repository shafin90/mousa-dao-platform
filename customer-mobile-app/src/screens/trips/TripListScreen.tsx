import React, { memo, useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTrips } from '../../hooks/useTrips';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { TripHeader } from './components/TripHeader';
import { TripFilterBar } from './components/TripFilterBar';
import { TripCardItem } from './components/TripCardItem';
import { Trip } from '../../data/types';
import { useColors } from '../../hooks/useColors';
import { SPACING } from '../../utils/constants';

function TripListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { trips, isLoading, search } = useTrips();
  const [activeSort, setActiveSort] = useState('Departure');

  const params = route.params;
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleTripPress = useCallback((tripId: string) => {
    navigation.navigate('TripDetails', { tripId });
  }, [navigation]);

  const handleSortChange = useCallback((sort: string) => {
    setActiveSort(sort);
  }, []);

  const sortedTrips = useMemo(() => {
    const sorted = [...trips];
    switch (activeSort) {
      case 'Price':
        return sorted.sort((a, b) => a.price - b.price);
      case 'Departure':
        return sorted.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
      case 'Arrival':
        return sorted.sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime));
      default:
        return sorted;
    }
  }, [trips, activeSort]);

  const renderItem = useCallback(({ item }: { item: Trip }) => (
    <TripCardItem trip={item} onPress={handleTripPress} />
  ), [handleTripPress]);

  const keyExtractor = useCallback((item: Trip) => item.id, []);

  const ListHeader = useMemo(() => (
    <View>
      <TripHeader title={`${params?.origin || ''} → ${params?.destination || ''}`} onBack={handleBack} />
      <TripFilterBar activeSort={activeSort} onSortChange={handleSortChange} />
    </View>
  ), [params?.origin, params?.destination, handleBack, activeSort, handleSortChange]);

  const ListEmpty = useMemo(() => (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>No trips found</Text>
      <Text style={styles.emptySubtext}>Try different route or date</Text>
    </View>
  ), []);

  return (
    <ScreenWrapper>
      {isLoading && trips.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={sortedTrips}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={styles.list}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWrapper>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      paddingBottom: SPACING.lg,
    },
    empty: {
      padding: SPACING.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 17,
      fontWeight: '600',
      color: COLORS.text,
    },
    emptySubtext: {
      fontSize: 15,
      color: COLORS.textSecondary,
      marginTop: SPACING.xs,
    },
  });
}

export default memo(TripListScreen);
