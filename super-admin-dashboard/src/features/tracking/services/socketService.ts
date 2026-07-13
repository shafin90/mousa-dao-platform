import { io, Socket } from 'socket.io-client';
import type { BusLocation } from '../types';

type GpsCallback = (data: BusLocation) => void;
type ConnectionCallback = (connected: boolean) => void;

class TrackingSocketService {
  private socket: Socket | null = null;
  private gpsSubscribers = new Set<GpsCallback>();
  private connectionSubscribers = new Set<ConnectionCallback>();
  private _isConnected = false;

  get isConnected() {
    return this._isConnected;
  }

  connect(url?: string) {
    if (this.socket?.connected) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://16.171.112.9:3000/api/v1';
    const baseUrl = apiUrl.replace('/api/v1', '');
    this.socket = io(url || import.meta.env.VITE_SOCKET_URL || baseUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      this._isConnected = true;
      this.connectionSubscribers.forEach((cb) => cb(true));
    });

    this.socket.on('disconnect', () => {
      this._isConnected = false;
      this.connectionSubscribers.forEach((cb) => cb(false));
    });

    this.socket.on('gps:live', (data: BusLocation) => {
      this.gpsSubscribers.forEach((cb) => cb(data));
    });

    this.socket.on('connect_error', () => {
      this._isConnected = false;
      this.connectionSubscribers.forEach((cb) => cb(false));
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this._isConnected = false;
    this.connectionSubscribers.forEach((cb) => cb(false));
  }

  subscribeToGps(callback: GpsCallback): () => void {
    this.gpsSubscribers.add(callback);
    return () => {
      this.gpsSubscribers.delete(callback);
    };
  }

  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionSubscribers.add(callback);
    return () => {
      this.connectionSubscribers.delete(callback);
    };
  }
}

export const trackingSocket = new TrackingSocketService();
