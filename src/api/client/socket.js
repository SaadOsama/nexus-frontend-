import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://nexus-backend-fbcotg.fly.dev/api/health';

// 🔴 'export const socket' hona chahiye:
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});