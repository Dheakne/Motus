// Responsável por controlar o fluxo de navegação do app. Usa React Navigation com uma pilha de telas (Stack).

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import React from "react";

// Importação de todas as telas do app
import AudioPlayerScreen from "../screens/AudioPlayerScreen";
import CategoryScreen from "../screens/CategoryScreen";
import ChallengesScreen from "../screens/ChallengesScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import ExerciseListScreen from "../screens/ExerciseListScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SignUpScreen from "../screens/SignUpScreen";
import SplashScreen from "../screens/SplashScreen";

// Cria o objeto de navegação em pilha (Stack Navigator)
// Pilha = empilha telas, botão "voltar" desfaz a pilha
const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [fontsLoaded] = useFonts({
    "Whyte-Regular": require("../../assets/fonts/Whyte-Regular.ttf"),
    "Whyte-Bold": require("../../assets/fonts/Whyte-Bold.ttf"),
    "Whyte-Medium": require("../../assets/fonts/Whyte-Medium.ttf"),
  });

  // Aguarda carregamento das fontes para evitar flash de texto sem estilo
  if (!fontsLoaded) return null;

  const skipAuth = process.env.EXPO_PUBLIC_SKIP_AUTH === 'true';

  return (
    // Stack.Navigator define as opções globais e a tela inicial
    <Stack.Navigator
      initialRouteName={skipAuth ? 'Home' : 'Splash'}
      screenOptions={{ headerShown: false }} // Remove a barra de título em todas as telas
    >
      {/* Cada Stack.Screen registra uma tela no sistema de navegação */}
      {/* name = nome usado no navigation.navigate('NomeDaTela') */}
      {/* component = o componente React que será renderizado */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ExerciseList" component={ExerciseListScreen} />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} />
      <Stack.Screen name="Challenges" component={ChallengesScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}
