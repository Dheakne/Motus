/**
 * AppNavigator - controla o fluxo de navegação do app via React Navigation (Stack).
 */

import { useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AudioPlayerScreen from "../screens/AudioPlayerScreen";
import CategoryScreen from "../screens/CategoryScreen";
import ChallengesScreen from "../screens/ChallengesScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import ExerciseListScreen from "../screens/ExerciseListScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import MascotScreen from "../screens/MascotScreen";
import PrivacyScreen from "../screens/PrivacyScreen";
import ReportProblemScreen from "../screens/ReportProblemScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import SignUpScreen from "../screens/SignUpScreen";
import SplashScreen from "../screens/SplashScreen";
import TermsScreen from "../screens/TermsScreen";
import { supabase } from "../services/supabase";

const Stack = createNativeStackNavigator();

// Flag global de fluxo de recuperação. Setada quando PASSWORD_RECOVERY chega
// e lida pelo SplashScreen para não redirecionar o usuário para Home no meio
// do fluxo de reset (a sessão criada pelo link de recuperação dispararia o
// redirect automático).
export const recoveryState = { active: false };

const hasRecoveryHash = typeof window !== 'undefined' &&
  window.__motusIsRecovery === true;

// Escuta eventos de auth do Supabase. Quando o usuário clica no link de
// recuperação de senha, dispara PASSWORD_RECOVERY e redirecionamos para ResetPassword.
function AuthListener() {
  const navigation = useNavigation();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // PASSWORD_RECOVERY agora é tratado no SplashScreen
    });
    return () => subscription.unsubscribe();
  }, [navigation]);
  return null;
}

export default function AppNavigator() {
  const [fontsLoaded] = useFonts({
    "Whyte-Regular": require("../../assets/fonts/Whyte-Regular.ttf"),
    "Whyte-Bold": require("../../assets/fonts/Whyte-Bold.ttf"),
    "Whyte-Medium": require("../../assets/fonts/Whyte-Medium.ttf"),
  });

  // Aguarda o carregamento das fontes para evitar flash de texto sem estilo
  if (!fontsLoaded) return null;

  const skipAuth = process.env.EXPO_PUBLIC_SKIP_AUTH === 'true';

  return (
    <SafeAreaProvider>
      <Stack.Navigator
      initialRouteName={hasRecoveryHash ? 'ResetPassword' : (skipAuth ? 'Home' : 'Splash')}
      screenOptions={{ headerShown: false }}
      screenLayout={({ children }) => (
        <>
          <AuthListener />
          {children}
        </>
      )}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ExerciseList" component={ExerciseListScreen} />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} />
      <Stack.Screen name="Challenges" component={ChallengesScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ReportProblem" component={ReportProblemScreen} />
      <Stack.Screen name="Mascot" component={MascotScreen} />
    </Stack.Navigator>
    </SafeAreaProvider>
  );
}
