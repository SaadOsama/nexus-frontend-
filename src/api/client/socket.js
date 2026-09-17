import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'nexus-backend-production-1bff.up.railway.app';

// 🔴 'export const socket' hona chahiye:
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});