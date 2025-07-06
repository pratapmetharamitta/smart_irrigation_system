import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  requestPermission: () => Promise<boolean>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  showLocalNotification: (title: string, body: string, data?: any) => void;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: Date;
  read: boolean;
  type: 'alert' | 'info' | 'warning' | 'error';
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    await requestPermission();
    await getFCMToken();
    setupForegroundHandler();
    setupBackgroundHandler();
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        await notifee.requestPermission();
      }

      return enabled;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const getFCMToken = async () => {
    try {
      const token = await messaging().getToken();
      setFcmToken(token);
      console.log('FCM Token:', token);
      // TODO: Send token to backend for push notifications
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  };

  const setupForegroundHandler = () => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      
      const notification: Notification = {
        id: Date.now().toString(),
        title: remoteMessage.notification?.title || 'Notification',
        body: remoteMessage.notification?.body || 'You have a new notification',
        data: remoteMessage.data,
        timestamp: new Date(),
        read: false,
        type: getNotificationType(remoteMessage.data?.type),
      };

      setNotifications(prev => [notification, ...prev]);
      await showLocalNotification(notification.title, notification.body, notification.data);
    });

    return unsubscribe;
  };

  const setupBackgroundHandler = () => {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message received:', remoteMessage);
      
      const notification: Notification = {
        id: Date.now().toString(),
        title: remoteMessage.notification?.title || 'Notification',
        body: remoteMessage.notification?.body || 'You have a new notification',
        data: remoteMessage.data,
        timestamp: new Date(),
        read: false,
        type: getNotificationType(remoteMessage.data?.type),
      };

      setNotifications(prev => [notification, ...prev]);
    });

    // Handle notification press
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('Notification pressed:', detail);
        // Handle notification press navigation
      }
    });
  };

  const getNotificationType = (type?: string): 'alert' | 'info' | 'warning' | 'error' => {
    switch (type) {
      case 'alert':
        return 'alert';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const showLocalNotification = async (title: string, body: string, data?: any) => {
    try {
      await notifee.displayNotification({
        title,
        body,
        data,
        android: {
          channelId: 'default',
          importance: AndroidImportance.HIGH,
          smallIcon: 'ic_launcher',
        },
        ios: {
          sound: 'default',
        },
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    requestPermission,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    showLocalNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
