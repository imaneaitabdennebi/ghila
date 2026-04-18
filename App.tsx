import './global.css';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SignupScreen } from './src/screens/SignupScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';

export default function App() {
  const [route, setRoute] = useState<'welcome' | 'signup'>('welcome');

  return (
    <SafeAreaProvider>
      {route === 'welcome' ? (
        <WelcomeScreen onGuideFinished={() => setRoute('signup')} />
      ) : (
        <SignupScreen onBack={() => setRoute('welcome')} />
      )}
      <StatusBar style={route === 'signup' ? 'dark' : 'light'} />
    </SafeAreaProvider>
  );
}
