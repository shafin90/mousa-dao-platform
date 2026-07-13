import apiClient from './client';

export const trackingApi = {
  getLiveTripLocation: async (tripId: string): Promise<any> => {
    const { data } = await apiClient.get(`/tracking/live/${tripId}`);
    return data.data;
  },
};
