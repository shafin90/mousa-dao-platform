import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Trip } from '../../../data/types';
import { PopularTripCard } from './PopularTripCard';
import { SPACING, FONT_SIZE } from '../../../utils/constants';
import { useColors } from '../../../hooks/useColors';

interface PopularTripListProps {
  trips: Trip[];
}

function PopularTripListComponent({ trips }: PopularTripListProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const navigation = useNavigation<any>();

  const handleTripPress = useCallback((tripId: string) => {
    navigation.navigate('TripDetails', { tripId });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: Trip }) => (
    <PopularTripCard trip={item} onPress={handleTripPress} />
  ), [handleTripPress]);

  const keyExtractor = useCallback((item: Trip) => item.id, []);

  if (trips.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Popular Trips</Text>
      <FlatList
        data={trips}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={3}
      />
    </View>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      marginTop: SPACING.sm
    },
    sectionTitle: {
      fontSize: FONT_SIZE.title,
      fontWeight: '700',
      color: COLORS.text,
      paddingHorizontal: SPACING.md,
      marginBottom: SPACING.sm,
    },
    list: {
      paddingHorizontal: SPACING.md,
    },
  });
}

export const PopularTripList = memo(PopularTripListComponent);
