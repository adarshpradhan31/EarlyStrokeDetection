import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SensorData } from '../types';

const BACKEND_URL = 'http://localhost:5000';
const PI_TIMEOUT_MS = 5000; // If no Pi data for 5s, switch to simulated

export type ConnectionMode = 'connecting' | 'pi' | 'simulated';

export function useSensorSocket() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('connecting');
  const lastPiUpdateRef = useRef<number>(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[StrokeGuard] WebSocket connected to backend');
    });

    socket.on('disconnect', () => {
      console.log('[StrokeGuard] WebSocket disconnected');
    });

    socket.on('sensor_update', (data: SensorData) => {
      lastPiUpdateRef.current = Date.now();
      setConnectionMode('pi');
      setSensorData(data);
    });

    socket.on('connect_error', (err) => {
      console.warn('[StrokeGuard] Socket connection error:', err.message);
    });

    // Watchdog: if no Pi data arrives for PI_TIMEOUT_MS, switch to simulated
    const watchdog = setInterval(() => {
      const elapsed = Date.now() - lastPiUpdateRef.current;
      if (lastPiUpdateRef.current === 0 || elapsed > PI_TIMEOUT_MS) {
        setConnectionMode('simulated');
      }
    }, 2000);

    return () => {
      socket.disconnect();
      clearInterval(watchdog);
    };
  }, []);

  return { sensorData, connectionMode };
}
