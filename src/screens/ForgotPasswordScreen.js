import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
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

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  async function handleSubmit() {
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg("Informe seu email.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${process.env.EXPO_PUBLIC_APP_URL || 'exp://127.0.0.1:8081'}/--/ResetPassword`,
    });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || "Não foi possível enviar o email.");
    } else {
      setSuccessMsg("Email enviado! Verifique sua caixa de entrada.");
      setEmail("");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#13E698", "#74B8DE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.headerTitle}>Recuperar senha</Text>
      </LinearGradient>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>{"< Login"}</Text>
        </TouchableOpacity>

        <Text style={styles.instruction}>
          Informe seu email para receber o link de recuperação
        </Text>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>👤</Text>
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

        {successMsg ? (
          <Text style={styles.successMsg}>{successMsg}</Text>
        ) : null}
        {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Enviar</Text>
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
    lineHeight: 31,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    marginBottom: -35,
    paddingHorizontal: 32,
    paddingTop: 24,
    
  },
  backLink: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: {
    fontFamily: "Whyte-Medium",
    fontSize: 16,
    color: "#1066E7",
     lineHeight: 31,
  },
  instruction: {
    fontSize: 17,
    fontFamily: "Whyte-Regular",
    color: "#6E6E73",
    textAlign: "centerleft",
    marginTop: 12,
    marginBottom: 28,
    lineHeight: 20,
  },
  label: {
    fontSize: 15,
    fontFamily: "Whyte-Regular",
    color: "#1C1C1E",
    marginBottom: 6,
    marginTop: 4,
    lineHeight: 20,
  },
  inputWrapper: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1C1C1E",
  },
  successMsg: {
    fontSize: 14,
    fontFamily: "Whyte-Medium",
    color: "#13C77A",
    textAlign: "center",
    marginTop: 16,
     lineHeight: 20,
  },
  errorMsg: {
    fontSize: 14,
    fontFamily: "Whyte-Medium",
    color: "#FF4444",
    textAlign: "center",
    marginTop: 16,
     lineHeight: 20,
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
    lineHeight: 20,
  },
});
