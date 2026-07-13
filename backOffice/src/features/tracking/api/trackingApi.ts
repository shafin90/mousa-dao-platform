import apiClient from "@/shared/services/apiClient";

export interface GpsBus {
  id: string;
  busNumber: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  tripId: string;
  routeName: string;
  status: string;
  lastUpdated: string;
}

export const getActiveBuses = async (): Promise<GpsBus[]> => {
  const response = await apiClient.get("/tracking/active-buses");
  return (response.data.data || []).map((b: any) => ({
    id: b._id || b.id,
    busNumber: b.busId?.busNumber || "",
    latitude: b.latitude || 0,
    longitude: b.longitude || 0,
    speed: b.speed || 0,
    heading: b.heading || 0,
    tripId: typeof b.tripId === "object" ? b.tripId._id : b.tripId || "",
    routeName: "",
    status: b.speed > 0 ? "on_trip" : "idle",
    lastUpdated: b.updatedAt || new Date().toISOString(),
  }));
};
