import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTickets } from '../../hooks/useTickets';
import { useTrips } from '../../hooks/useTrips';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { TicketCard } from './components/TicketCard';
import { Ticket } from '../../data/types';
import { SPACING, FONT_SIZE } from '../../utils/constants';
import { useColors } from '../../hooks/useColors';

function TicketListScreen() {
  const navigation = useNavigation<any>();
  const { tickets, activeTickets, pastTickets, isLoading } = useTickets();
  const { trips } = useTrips();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const handleTicketPress = useCallback((ticketId: string) => {
    navigation.navigate('TicketDetails', { ticketId });
  }, [navigation]);

  const getTripForTicket = useCallback((tripId: string) => {
    return trips.find(t => t.id === tripId);
  }, [trips]);

  const renderActiveItem = useCallback(({ item }: { item: Ticket }) => (
    <TicketCard ticket={item} trip={getTripForTicket(item.tripId)} onPress={handleTicketPress} />
  ), [getTripForTicket, handleTicketPress]);

  const renderPastItem = useCallback(({ item }: { item: Ticket }) => (
    <TicketCard ticket={item} trip={getTripForTicket(item.tripId)} onPress={handleTicketPress} />
  ), [getTripForTicket, handleTicketPress]);

  const keyExtractor = useCallback((item: Ticket) => item.id, []);

  const activeKeyExtractor = useCallback((item: Ticket) => `active-${item.id}`, []);
  const pastKeyExtractor = useCallback((item: Ticket) => `past-${item.id}`, []);

  const ListHeader = useMemo(() => (
    <View style={styles.header}>
      <Text style={styles.title}>My Tickets</Text>
    </View>
  ), [styles]);

  if (isLoading && tickets.length === 0) {
    return (
      <ScreenWrapper>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <FlatList
        ListHeaderComponent={ListHeader}
        data={activeTickets}
        renderItem={renderActiveItem}
        keyExtractor={activeKeyExtractor}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No tickets yet</Text>
            <Text style={styles.emptySubtitle}>Book a trip to see your tickets here</Text>
          </View>
        }
        ListFooterComponent={
          pastTickets.length > 0 ? (
            <View style={styles.pastSection}>
              <Text style={styles.pastTitle}>Past Tickets</Text>
              {pastTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  trip={getTripForTicket(ticket.tripId)}
                  onPress={handleTicketPress}
                />
              ))}
            </View>
          ) : null
        }
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={3}
        showsVerticalScrollIndicator={false}
      />
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
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  title: {
    fontSize: FONT_SIZE.largeTitle,
    fontWeight: '700',
    color: COLORS.text,
  },
  list: {
    paddingBottom: SPACING.lg,
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONT_SIZE.headline,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  pastSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  pastTitle: {
    fontSize: FONT_SIZE.title,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
});
}

export default memo(TicketListScreen);
