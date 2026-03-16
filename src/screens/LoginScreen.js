// Tela de login e cadastro. Usa o Supabase Auth para autenticar via e-mail/senha.

import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../services/supabase"; // Cliente Supabase configurado

export default function LoginScreen({ navigation }) {
  // Estados locais para os campos do formulário e loading
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Função de LOGIN
  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    setLoading(true);
    // Chama o Supabase Auth para autenticar o usuário
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
        routes: [{ name: "Home" }], // Navega para Home em caso de sucesso
      });
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Título */}
        <Text style={styles.title}>Iniciar sessão na sua conta</Text>

        {/* Subtítulo */}
        <Text style={styles.subtitle}>
          Introduza o seu e-mail e palavra-passe para iniciar sessão
        </Text>

        {/* Campo Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="seuemail@gmail.com"
              placeholderTextColor="#A1A4B2"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none" // Evita capitalização automática no e-mail
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Campo Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>🔒</Text>
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

        {/* Lembrar de mim e Esqueceu senha */}
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={styles.rememberMe}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={styles.checkbox}>
              {rememberMe && <View style={styles.checkboxFilled} />}
            </View>
            <Text style={styles.rememberMeText}>Lembrar de mim</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Alert.alert("Recuperar senha", "Em desenvolvimento")}
          >
            <Text style={styles.forgotPassword}>Esqueceu sua senha ?</Text>
          </TouchableOpacity>
        </View>

        {/* Divisor OR */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 12,
    textAlign: "left",
  },
  subtitle: {
    fontSize: 14,
    color: "#6E6E73",
    marginBottom: 40,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: "#6E6E73",
    marginBottom: 8,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
    color: "#1C1C1E",
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D1D1D6",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxFilled: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#C8A882",
  },
  rememberMeText: {
    fontSize: 14,
    color: "#1C1C1E",
  },
  forgotPassword: {
    fontSize: 14,
    color: "#8B7DD8",
    fontWeight: "500",
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
    color: "#6E6E73",
  },
  loginButton: {
    backgroundColor: "#AF7842",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    fontSize: 14,
    color: "#6E6E73",
  },
  signupLink: {
    fontSize: 14,
    color: "#8B7DD8",
    fontWeight: "600",
  },
});
