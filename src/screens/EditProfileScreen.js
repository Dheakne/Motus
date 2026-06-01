import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { EyeIcon, EyeOffIcon } from "../components/Icons";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../services/supabase";
import { convertToSQLDate } from "../utils/dateFormat";

export default function EditProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [birthDateError, setBirthDateError] = useState("");

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
    } catch (_error) {
      Alert.alert("Erro", "Não foi possível carregar seus dados");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    if (!year || !month || !day) return "";
    return `${day}/${month}/${year}`;
  }

  function formatBirthDate(value) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  function isValidBirthDate(dateString) {
    if (!dateString) return true;
    const digits = dateString.replace(/\D/g, "");
    if (digits.length !== 8) return false;
    const day = parseInt(digits.substring(0, 2), 10);
    const month = parseInt(digits.substring(2, 4), 10);
    const year = parseInt(digits.substring(4, 8), 10);
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    const d = new Date(year, month - 1, day);
    return (
      d.getFullYear() === year &&
      d.getMonth() === month - 1 &&
      d.getDate() === day
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Erro", "O nome é obrigatório");
      return;
    }

    if (!isValidBirthDate(birthDate)) {
      setBirthDateError("Data de nascimento inválida");
      return;
    }
    setBirthDateError("");

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

      setSuccessMessage("Perfil atualizado com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (_error) {
      Alert.alert("Erro", "Não foi possível salvar as alterações");
    } finally {
      setSaving(false);
    }
  }

  async function handleExportData() {
    setExporting(true);
    try {
      const { data, error } = await supabase.rpc("export_user_data", {
        target_user_id: userId,
      });
      if (error) throw error;

      const formatted = JSON.stringify(data, null, 2);
      await Share.share({
        message: `Meus dados Motus:\n\n${formatted}`,
        title: "Exportar meus dados",
      });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível exportar seus dados.");
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_user_account", {
        target_user_id: userId,
      });
      if (error) throw error;

      await supabase.auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      Alert.alert(
        "Erro",
        "Não foi possível excluir a conta. Tente novamente."
      );
      console.error("Delete error:", error);
      setDeleting(false);
      setShowDeleteConfirm(false);
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
            <View style={[styles.inputRow, birthDateError && styles.inputRowError]}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={birthDate}
                onChangeText={(v) => {
                  setBirthDate(formatBirthDate(v));
                  if (birthDateError) setBirthDateError("");
                }}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#A1A4B2"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            {birthDateError ? (
              <Text style={styles.errorText}>{birthDateError}</Text>
            ) : null}
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
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeOffIcon size={20} color="#A1A4B2" />
                ) : (
                  <EyeIcon size={20} color="#A1A4B2" />
                )}
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

          {successMessage ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={18} color="#13A05E" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportData}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#1066E7" size="small" />
            ) : (
              <Text style={styles.exportButtonText}>Exportar meus dados</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteConfirm(true)}
          >
            <Text style={styles.deleteButtonText}>Excluir minha conta</Text>
          </TouchableOpacity>

          {showDeleteConfirm && (
            <View style={styles.deleteConfirmBox}>
              <Text style={styles.deleteConfirmText}>
                Tem certeza? Todos os seus dados serão permanentemente excluídos. Esta ação não pode ser desfeita.
              </Text>
              <View style={styles.deleteConfirmButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmDeleteButton}
                  onPress={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmDeleteText}>Excluir permanentemente</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

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
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputRowError: {
    borderColor: "#FF4444",
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Whyte-Regular",
    color: "#FF4444",
    marginTop: 6,
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
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F8EE",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Whyte-Medium",
    color: "#13A05E",
  },
  exportButton: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: "#1066E7",
  },
  exportButtonText: {
    color: "#1066E7",
    fontSize: 16,
    fontFamily: "Whyte-Medium",
    fontWeight: "600",
  },
  deleteButton: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#FF3B30",
  },
  deleteButtonText: {
    color: "#FF3B30",
    fontSize: 16,
    fontFamily: "Whyte-Medium",
    fontWeight: "600",
  },
  deleteConfirmBox: {
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  deleteConfirmText: {
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#1C1C1E",
    lineHeight: 22,
    marginBottom: 16,
  },
  deleteConfirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#E5E5EA",
  },
  cancelButtonText: {
    color: "#1C1C1E",
    fontSize: 14,
    fontFamily: "Whyte-Medium",
  },
  confirmDeleteButton: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#FF3B30",
  },
  confirmDeleteText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Whyte-Medium",
  },
});
