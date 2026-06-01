// Tela de login. Usa o Supabase Auth para autenticar via e-mail/senha.

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../services/supabase";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Erro no login", error.message);
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Gradiente no topo */}
      <LinearGradient
        colors={["#13E698", "#74B8DE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      />

      {/* Card branco sobrepõe o gradiente */}
      <View style={styles.card}>
        {/* Título */}
        <Text style={styles.title}>Bem-vindo!</Text>
        <Text style={styles.subtitle}>Faça login na sua conta</Text>

        {/* Campo Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="seuemail@gmail.com"
              placeholderTextColor="#A1A4B2"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Campo Senha */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Senha</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#A1A4B2"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Esqueceu senha */}
        <TouchableOpacity
          style={styles.forgotPasswordContainer}
          onPress={() => navigation.navigate("ForgotPassword")}
        >
          <Text style={styles.forgotPassword}>Esqueceu sua senha?</Text>
        </TouchableOpacity>

        {/* Divisor */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Ou</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Continuar com Google */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => Alert.alert("Google", "Em desenvolvimento")}
        >
          <Text style={styles.googleButtonText}>Continuar com o Google</Text>
        </TouchableOpacity>

        {/* Botão Iniciar sessão */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Iniciar sessão</Text>
          )}
        </TouchableOpacity>

        {/* Link para Inscrever-se */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Não tem uma conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
            <Text style={styles.signupLink}>Inscreva-se</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#13E698",
  },
  gradient: {
    height: 120,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 32,
    paddingTop: 56,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: "Whyte-Bold",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#6E6E73",
    textAlign: "center",
    marginBottom: 36,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: "Whyte-Regular",
    color: "#6E6E73",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F1F5",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Whyte-Regular",
    color: "#1C1C1E",
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 16,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 32,
    marginTop: 8,
  },
  forgotPassword: {
    fontSize: 13,
    fontFamily: "Whyte-Regular",
    color: "#1066E7",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E5EA",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    fontFamily: "Whyte-Regular",
    color: "#6E6E73",
  },
  googleButton: {
    alignItems: "center",
    marginBottom: 28,
  },
  googleButtonText: {
    fontSize: 15,
    fontFamily: "Whyte-Medium",
    color: "#1C1C1E",
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#1066E7",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Whyte-Medium",
    fontWeight: "600",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#6E6E73",
  },
  signupLink: {
    fontSize: 14,
    fontFamily: "Whyte-Medium",
    color: "#1066E7",
    fontWeight: "600",
  },
});
