// Tela de carregamento exibida brevemente ao abrir o app.

import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace("Onboarding");
    }, 2000);
  }, []);

  return (
    // Centraliza tudo na tela com fundo na cor do app e mostra o logo
    <View style={styles.container}>
      <Text style={styles.logo}>🧘 Motus</Text>
      {/* <Image 
        source={require('../../assets/logo.png')} 
        style={styles.logo}
        resizeMode="contain"
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ocupa toda a tela
    backgroundColor: "#F5F5DC", // Cor de fundo do Motus
    alignItems: "center", // Centraliza horizontalmente
    justifyContent: "center", // Centraliza verticalmente
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#8B7355",
  },
});
