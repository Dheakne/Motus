import './utils/recoveryDetect';
import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';

function RootApp() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

registerRootComponent(RootApp);