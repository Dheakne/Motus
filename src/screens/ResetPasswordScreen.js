import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../services/supabase";

export default function ResetPasswordScreen({ navigation }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleSave() {
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!password || !confirmPassword) {
      setErrorMsg("Preencha os dois campos.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setErrorMsg(error.message || "Não foi possível atualizar a senha.");
      return;
    }

    await supabase.auth.signOut();
    setLoading(false);
    setSuccessMsg("Senha alterada com sucesso! Faça login.");

    timeoutRef.current = setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    }, 1500);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#13E698", "#74B8DE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{"< Voltar"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova senha</Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.instruction}>
          Defina uma nova senha para sua conta
        </Text>

        <Text style={styles.label}>Nova senha</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#A1A4B2"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirmar nova senha</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#A1A4B2"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirm(!showConfirm)}
          >
            <Text style={styles.eyeIcon}>{showConfirm ? "👁️" : "👁️‍🗨️"}</Text>
          </TouchableOpacity>
        </View>

        {successMsg ? (
          <Text style={styles.successMsg}>{successMsg}</Text>
        ) : null}
        {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Salvar</Text>
          )}
        </TouchableOpacity>
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
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Whyte-Bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 24,
  },
  instruction: {
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#6E6E73",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: "Whyte-Regular",
    color: "#1C1C1E",
    marginBottom: 6,
    marginTop: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    fontFamily: "Whyte-Regular",
    color: "#1C1C1E",
    padding: 0,
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 16,
  },
  successMsg: {
    fontSize: 13,
    fontFamily: "Whyte-Medium",
    color: "#13C77A",
    textAlign: "center",
    marginTop: 16,
  },
  errorMsg: {
    fontSize: 13,
    fontFamily: "Whyte-Medium",
    color: "#FF4444",
    textAlign: "center",
    marginTop: 16,
  },
  submitButton: {
    backgroundColor: "#1066E7",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Whyte-Medium",
    fontWeight: "600",
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 8,
    zIndex: 10,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Whyte-Regular',
  },
});
