import apiClient from './client';
import { Station } from '../../data/types';

export const stationApi = {
  getAll: async (): Promise<Station[]> => {
    const { data } = await apiClient.get('/stations');
    return data.data;
  },
};
