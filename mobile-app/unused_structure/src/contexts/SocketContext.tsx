import React, {createContext, useContext, useEffect, useState, ReactNode} from 'react';
import {io, Socket} from 'socket.io-client';
import Config from 'react-native-config';
import {useAuth} from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

const SOCKET_URL = Config.API_BASE_URL || 'http://localhost:3000';
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000; // 3 seconds

export const SocketProvider: React.FC<SocketProviderProps> = ({children}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const {token, isAuthenticated} = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token]);

  const connect = () => {
    if (!token) {
      console.log('No token available for socket connection');
      return;
    }

    try {
      const socketOptions = {
        auth: {
          token,
        },
        transports: ['websocket'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: RECONNECT_INTERVAL,
        reconnectionDelayMax: 10000,
        maxReconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      };

      console.log('Connecting to socket server:', SOCKET_URL);
      const newSocket = io(SOCKET_URL, socketOptions);

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, need to reconnect manually
          setTimeout(() => {
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              setReconnectAttempts(prev => prev + 1);
              newSocket.connect();
            }
          }, RECONNECT_INTERVAL);
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionError(error.message);
        setIsConnected(false);
        
        setReconnectAttempts(prev => {
          const newAttempts = prev + 1;
          if (newAttempts >= MAX_RECONNECT_ATTEMPTS) {
            setConnectionError('Failed to connect after maximum attempts');
          }
          return newAttempts;
        });
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Socket reconnection attempt:', attemptNumber);
        setReconnectAttempts(attemptNumber);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error);
        setConnectionError(error.message);
      });

      newSocket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed');
        setConnectionError('Failed to reconnect to server');
        setIsConnected(false);
      });

      // Authentication events
      newSocket.on('authenticated', () => {
        console.log('Socket authenticated successfully');
      });

      newSocket.on('unauthorized', (error) => {
        console.error('Socket authentication failed:', error);
        setConnectionError('Authentication failed');
        disconnect();
      });

      // General error handler
      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        setConnectionError(error.message || 'Socket error occurred');
      });

      setSocket(newSocket);
    } catch (error: any) {
      console.error('Error creating socket connection:', error);
      setConnectionError(error.message || 'Failed to create socket connection');
    }
  };

  const disconnect = () => {
    if (socket) {
      console.log('Disconnecting socket');
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      setReconnectAttempts(0);
    }
  };

  const emit = (event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Cannot emit event: socket not connected', event, data);
    }
  };

  const on = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event: string, callback?: (data: any) => void) => {
    if (socket) {
      if (callback) {
        socket.off(event, callback);
      } else {
        socket.off(event);
      }
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    connectionError,
    reconnectAttempts,
    connect,
    disconnect,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
