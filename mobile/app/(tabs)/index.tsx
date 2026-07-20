import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { Button } from '../../src/components/Button';
import { TripCard } from '../../src/components/TripCard';
import { Input } from '../../src/components/Input';
import { searchTrips, getStations } from '../../src/api/trips';
import { Trip, Station, City } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

type PickerMode = { type: 'city' | 'station'; side: 'from' | 'to' } | null;

export default function HomeScreen() {
  const [fromCity, setFromCity] = useState<City | null>(null);
  const [toCity, setToCity] = useState<City | null>(null);
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [stations, setStations] = useState<Station[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState<PickerMode>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStations();
  }, []);

  const cities = useMemo(() => {
    const map = new Map<string, City>();
    stations.forEach((s) => {
      const c = typeof s.cityId === 'object' ? s.cityId : null;
      if (c?._id && !map.has(c._id)) map.set(c._id, c);
    });
    return Array.from(map.values());
  }, [stations]);

  const stationsByCity = useMemo(() => {
    const map = new Map<string, Station[]>();
    stations.forEach((s) => {
      const id = typeof s.cityId === 'object' ? s.cityId?._id : null;
      if (id) {
        if (!map.has(id)) map.set(id, []);
        map.get(id)!.push(s);
      }
    });
    return map;
  }, [stations]);

  const loadStations = async () => {
    try { setStations(await getStations()); } catch {}
  };

  const doSearch = async (f: Station, t: Station) => {
    setLoading(true);
    try {
      setTrips(await searchTrips({ fromStation: f._id, toStation: t._id, date }));
    } catch {} finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (fromStation && toStation) await doSearch(fromStation, toStation);
    setRefreshing(false);
  };

  const selectCity = (city: City) => {
    if (picker?.side === 'from') {
      setFromCity(city);
      setFromStation(null);
    } else {
      setToCity(city);
      setToStation(null);
    }
    setPicker(null);
  };

  const selectStation = (station: Station) => {
    if (picker?.side === 'from') {
      setFromStation(station);
      if (toStation && toStation._id === station._id) { setToStation(null); setToCity(null); }
    } else {
      setToStation(station);
      if (fromStation && fromStation._id === station._id) { setFromStation(null); setFromCity(null); }
    }
    setPicker(null);

    const f = picker?.side === 'from' ? station : fromStation;
    const t = picker?.side === 'to' ? station : toStation;
    if (f && t && f._id !== t._id) doSearch(f, t);
  };

  const swapStations = () => {
    const fc = fromCity, tc = toCity;
    const fs = fromStation, ts = toStation;
    setFromCity(tc ?? null);
    setToCity(fc ?? null);
    setFromStation(ts);
    setToStation(fs);
    if (ts && fs && ts._id !== fs._id) doSearch(ts, fs);
  };

  const pickerStations = useMemo(() => {
    if (!picker) return [];
    const city = picker.side === 'from' ? fromCity : toCity;
    return city ? stationsByCity.get(city._id) || [] : [];
  }, [picker, fromCity, toCity, stationsByCity]);

  const pickerSelected = picker?.side === 'from' ? fromStation : toStation;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>Search Trip</Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.pickerBtn, styles.pickerBtnLeft]}
              onPress={() => setPicker({ type: 'city', side: 'from' })}
            >
              <Text style={styles.pickerLabel}>From City</Text>
              <Text style={[styles.pickerValue, !fromCity && styles.placeholder]} numberOfLines={1}>
                {fromCity?.name || 'Select city'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setPicker({ type: 'station', side: 'from' })}
            >
              <Text style={styles.pickerLabel}>From Station</Text>
              <Text style={[styles.pickerValue, !fromStation && styles.placeholder]} numberOfLines={1}>
                {fromStation?.name || 'Select station'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.swapRow}>
            <View style={styles.swapLine} />
            <TouchableOpacity style={styles.swapBtn} onPress={swapStations}>
              <Ionicons name="swap-vertical" size={20} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.swapLine} />
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.pickerBtn, styles.pickerBtnLeft]}
              onPress={() => setPicker({ type: 'city', side: 'to' })}
            >
              <Text style={styles.pickerLabel}>To City</Text>
              <Text style={[styles.pickerValue, !toCity && styles.placeholder]} numberOfLines={1}>
                {toCity?.name || 'Select city'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setPicker({ type: 'station', side: 'to' })}
            >
              <Text style={styles.pickerLabel}>To Station</Text>
              <Text style={[styles.pickerValue, !toStation && styles.placeholder]} numberOfLines={1}>
                {toStation?.name || 'Select station'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          <Input
            value={date}
            onChangeText={setDate}
            placeholder="Date (YYYY-MM-DD)"
            containerStyle={{ marginTop: spacing.md, marginBottom: spacing.md }}
          />

          <Button
            title="Search"
            onPress={() => { if (fromStation && toStation) doSearch(fromStation, toStation); }}
            loading={loading}
            disabled={!fromStation || !toStation}
            size="lg"
          />
        </View>

        {trips.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>
              {trips.length} trip{trips.length > 1 ? 's' : ''} found
            </Text>
            {trips.map((trip) => (
              <TripCard
                key={trip._id}
                trip={trip}
                onPress={(t) => router.push(`/trip/${t._id}`)}
              />
            ))}
          </View>
        )}

        {trips.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="bus-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyTitle}>
              {fromStation && toStation ? 'No trips found' : 'Search for a trip'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {fromStation && toStation ? 'Try changing your search criteria' : 'Select departure and arrival'}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={!!picker} animationType="slide" transparent onRequestClose={() => setPicker(null)}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {picker?.type === 'city' ? 'Select City' : 'Select Station'}
                {picker && ` (${picker.side === 'from' ? 'Departure' : 'Arrival'})`}
              </Text>
              <TouchableOpacity onPress={() => setPicker(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {picker?.type === 'city' && (
              <FlatList
                data={cities}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.listItem} onPress={() => selectCity(item)}>
                    <Ionicons name="business" size={20} color={colors.accent} />
                    <Text style={styles.listItemText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                style={styles.list}
              />
            )}

            {picker?.type === 'station' && (
              pickerStations.length === 0 ? (
                <View style={styles.emptyList}>
                  <Ionicons name="alert-circle-outline" size={32} color={colors.textLight} />
                  <Text style={styles.emptyListText}>Select a city first</Text>
                </View>
              ) : (
                <FlatList
                  data={pickerStations}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.listItem, pickerSelected?._id === item._id && styles.listItemSelected]}
                      onPress={() => selectStation(item)}
                    >
                      <Ionicons
                        name="location"
                        size={20}
                        color={pickerSelected?._id === item._id ? colors.accent : colors.textSecondary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listItemText}>{item.name}</Text>
                        {item.address && <Text style={styles.listItemSub}>{item.address}</Text>}
                      </View>
                      {pickerSelected?._id === item._id && (
                        <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.list}
                />
              )
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: spacing.md,
  },
  searchTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 2,
    gap: spacing.xs,
  },
  pickerBtnLeft: {},
  pickerLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
    position: 'absolute',
    top: -7,
    left: spacing.sm,
    backgroundColor: colors.background,
    paddingHorizontal: 4,
  },
  pickerValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    marginTop: 4,
  },
  placeholder: { color: colors.textLight, fontWeight: '400' },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  swapLine: { flex: 1, height: 1, backgroundColor: colors.border },
  swapBtn: {
    padding: spacing.sm,
    marginHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultsSection: { marginTop: spacing.sm },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.md,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  list: { maxHeight: 400 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  listItemSelected: { backgroundColor: colors.accent + '10' },
  listItemText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  listItemSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyListText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
});
