import React from 'react';
import { AppProvider } from './src/components/AppProvider';

// Suppress common React Native warnings for web
if (typeof window !== 'undefined') {
  // Suppress shouldUseNativeDriver warnings
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('shouldUseNativeDriver')) {
      return;
    }
    originalWarn(...args);
  };
}

// Root App Component
export default function App() {
  return <AppProvider />;
}
