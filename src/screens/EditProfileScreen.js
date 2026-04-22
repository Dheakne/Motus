import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../services/supabase";

export default function EditProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        setEmail(user.email || "");

        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileData) {
          const fullNameParts = profileData.full_name?.split(" ") || [];
          setUsername(profileData.display_name || "");
          setName(fullNameParts[0] || "");
          setLastName(fullNameParts.slice(1).join(" ") || "");
          setPhone(profileData.phone || "");
          setBirthDate(
            profileData.birth_date ? formatDate(profileData.birth_date) : "",
          );
        }
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar seus dados");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function convertToSQLDate(dateString) {
    if (!dateString || dateString.length < 8) return null;
    const cleaned = dateString.replace(/\D/g, "");
    if (cleaned.length === 8) {
      return `${cleaned.substring(4, 8)}-${cleaned.substring(2, 4)}-${cleaned.substring(0, 2)}`;
    }
    return null;
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Erro", "O nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          display_name: username.trim() || name.trim(),
          full_name: `${name.trim()} ${lastName.trim()}`.trim(),
          phone: phone.trim() || null,
          birth_date: convertToSQLDate(birthDate),
        })
        .eq("user_id", userId);

      if (profileError) throw profileError;

      if (password.trim()) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: password.trim(),
        });
        if (passwordError) throw passwordError;
      }

      Alert.alert("Sucesso!", "Perfil atualizado com sucesso", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar as alterações");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1066E7" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header com gradiente */}
      <LinearGradient
        colors={["#13E698", "#74B8DE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.headerTitle}>Editar Perfil</Text>
      </LinearGradient>

      {/* Card branco */}
      <View style={styles.card}>
        {/* Botão voltar */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>{"< Inicio"}</Text>
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Field label="Usuário">
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Amanda123"
              placeholderTextColor="#A1A4B2"
              autoCapitalize="none"
            />
          </Field>

          <Field label="Nome">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Amanda"
              placeholderTextColor="#A1A4B2"
            />
          </Field>

          <Field label="Sobrenome">
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Silva Costa Souza"
              placeholderTextColor="#A1A4B2"
            />
          </Field>

          <Field label="Email">
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
              placeholderTextColor="#A1A4B2"
            />
          </Field>

          <Field label="Data de nascimento">
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#A1A4B2"
                keyboardType="numeric"
                maxLength={10}
              />
              <Text style={styles.fieldIcon}>🗓</Text>
            </View>
          </Field>

          <Field label="Numero de celular">
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="(62) 0726-0592"
              placeholderTextColor="#A1A4B2"
              keyboardType="phone-pad"
            />
          </Field>

          <Field label="Palavra-passe">
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#A1A4B2"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.fieldIcon}>
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </Text>
              </TouchableOpacity>
            </View>
          </Field>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Field({ label, children }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#13E698",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  gradient: {
    paddingTop: 16,
    paddingBottom: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Whyte-Bold",
    fontWeight: "700",
    color: "#FFFFFF",
  },
  card: {
    flex: 1,
    backgroundColor: "#F0F1F5",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  backText: {
    fontSize: 15,
    fontFamily: "Whyte-Medium",
    color: "#1066E7",
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: "Whyte-Regular",
    color: "#6E6E73",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Whyte-Regular",
    color: "#1C1C1E",
  },
  inputDisabled: {
    color: "#A1A4B2",
  },
  inputFlex: {
    flex: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  fieldIcon: {
    fontSize: 18,
    paddingHorizontal: 14,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  saveButton: {
    backgroundColor: "#1066E7",
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Whyte-Medium",
    fontWeight: "600",
  },
});
