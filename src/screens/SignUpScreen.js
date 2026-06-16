/**
 * SignUpScreen - tela de cadastro de novo usuário.
 */

import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { register } from "../api/authApi";
import { BackIcon, EyeIcon, EyeOffIcon } from "../components/Icons";

/**
 * Aplica a máscara DD/MM/AAAA enquanto o usuário digita.
 */
function formatBirthDate(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedHealth, setAcceptedHealth] = useState(false);

  async function handleSignUp() {
    if (!name || !lastName || !email || !password) {
      Alert.alert("Erro", "Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      await register({
        email,
        password,
        name,
        lastName,
        phone: phone || undefined,
        birthDate: birthDate || undefined,
        consent_terms: acceptedTerms,
        consent_health_data: acceptedHealth,
      });
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (err) {
      const msg =
        err.error === "EMAIL_ALREADY_EXISTS"
          ? "Este email já está cadastrado"
          : err.error === "INVALID_BIRTH_DATE"
            ? "Data de nascimento inválida. Use o formato DD/MM/AAAA"
            : err.message || "Erro ao criar conta";
      Alert.alert("Erro no cadastro", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    // KeyboardAvoidingView evita que o teclado cubra os inputs
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackIcon size={24} color="#1C1C1E" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Inscrever-se</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>
              Já tem uma conta? <Text style={styles.loginLinkBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nome</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor="#A1A4B2"
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={styles.label}>Sobrenome</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Sobrenome(s)"
              placeholderTextColor="#A1A4B2"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
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

          <Text style={styles.label}>Data de nascimento</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#A1A4B2"
              value={birthDate}
              onChangeText={(v) => setBirthDate(formatBirthDate(v))}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>

          <Text style={styles.label}>Numero de celular</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="(00) 90000-0000"
              placeholderTextColor="#A1A4B2"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.label}>Definir palavra-passe</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              placeholder="••••••••"
              placeholderTextColor="#A1A4B2"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? (
                <EyeOffIcon size={20} color="#A1A4B2" />
              ) : (
                <EyeIcon size={20} color="#A1A4B2" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.checkboxGroup}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAcceptedTerms((v) => !v)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  acceptedTerms && styles.checkboxChecked,
                ]}
              >
                {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                Li e aceito os{" "}
                <Text
                  style={styles.link}
                  onPress={() => navigation.navigate("Terms")}
                >
                  Termos de Uso
                </Text>{" "}
                e a{" "}
                <Text
                  style={styles.link}
                  onPress={() => navigation.navigate("Privacy")}
                >
                  Política de Privacidade
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAcceptedHealth((v) => !v)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  acceptedHealth && styles.checkboxChecked,
                ]}
              >
                {acceptedHealth && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                Consinto com o tratamento dos meus dados relacionados a saúde
                mental, conforme descrito na Política de Privacidade (art. 11
                LGPD)
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.registerButton,
              (loading || !acceptedTerms || !acceptedHealth) &&
                styles.registerButtonDisabled,
            ]}
            onPress={handleSignUp}
            disabled={loading || !acceptedTerms || !acceptedHealth}
            activeOpacity={0.85}
          >
            <Text style={styles.registerButtonText}>
              {loading ? "Criando conta..." : "Registrar"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginBottom: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontFamily: "Whyte-Bold",
    color: "#1C1C1E",
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 31,
  },
  loginLink: {
    fontSize: 15,
    fontFamily: "Whyte-Regular",
    color: "#6E6E73",
    textAlign: "center",
    lineHeight: 20,
  },
  loginLinkBold: {
    color: "#1066E7",
    fontFamily: "Whyte-Medium",
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontFamily: "Whyte-Regular",
    color: "#1C1C1E",
    marginBottom: 6,
    marginTop: 14,
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
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1C1C1E",
  },
  inputWithIcon: {
    paddingRight: 8,
  },
  eyeButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  registerButton: {
    backgroundColor: "#1066E7",
    borderRadius: 30,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Whyte-Bold",
    lineHeight: 31,
  },
  checkboxGroup: {
    marginTop: 20,
    marginBottom: 8,
    gap: 14,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#A1A4B2",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: "#1066E7",
    borderColor: "#1066E7",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#1C1C1E",
    lineHeight: 17,
  },
  link: {
    color: "#1066E7",
    fontFamily: "Whyte-Medium",
  },
});
