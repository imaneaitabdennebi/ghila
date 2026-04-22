import './global.css';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { SignupScreen } from './src/screens/SignupScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';

type Route = 'welcome' | 'signup' | 'home';

export default function App() {
  const [route, setRoute] = useState<Route>('welcome');

  return (
    <SafeAreaProvider>
      {route === 'welcome' && (
        <WelcomeScreen onGuideFinished={() => setRoute('signup')} />
      )}
      {route === 'signup' && (
        <SignupScreen
          onBack={() => setRoute('welcome')}
          onAuthenticated={() => setRoute('home')}
        />
      )}
      {route === 'home' && <HomeScreen />}
      <StatusBar
        style={route === 'signup' ? 'dark' : 'light'}
      />
    </SafeAreaProvider>
  );
}
