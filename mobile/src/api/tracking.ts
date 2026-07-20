import apiClient from './client';

export const getLiveTripLocation = async (tripId: string) => {
  const res = await apiClient.get(`/tracking/live/${tripId}`);
  return res.data.data as {
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
    source: string;
    updatedAt: string;
  };
};

export const getActiveBuses = async () => {
  const res = await apiClient.get('/tracking/active-buses');
  return res.data.data as any[];
};
