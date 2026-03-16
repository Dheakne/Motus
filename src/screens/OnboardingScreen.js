// Tela de boas-vindas. Apresenta o app e direciona o usuário para o Login ao clicar em "Começar".

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// "navigation" é passado automaticamente pelo Stack Navigator e permite navegar entre telas
export default function OnboardingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo ao Motus</Text>
      <Text style={styles.description}>
        Sua jornada de bem-estar mental começa aqui.
      </Text>

      {/* Botão que navega para a tela de Login */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.buttonText}>Começar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
