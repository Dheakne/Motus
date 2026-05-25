import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BackIcon } from "../components/Icons";
import { supabase } from "../services/supabase";

const PROBLEM_TYPES = [
  "Bug ou erro",
  "Sugestão de melhoria",
  "Conteúdo inadequado",
  "Outro",
];

export default function ReportProblemScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [type, setType] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data?.user?.email || "");
    });
  }, []);

  async function handleSubmit() {
    const newErrors = {};
    if (!type) newErrors.type = "Selecione o tipo de problema";
    if (!subject.trim()) newErrors.subject = "Informe um assunto";
    if (!description.trim()) newErrors.description = "Descreva o problema";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSuccessMessage("");
      setSubmitError("");
      return;
    }

    setErrors({});
    setSuccessMessage("");
    setSubmitError("");

    const { data: { user } } = await supabase.auth.getUser();

    const { error: insertErr } = await supabase.from("reports").insert({
      user_id: user?.id ?? null,
      email,
      type,
      subject,
      description,
    });

    if (insertErr) {
      console.error("[ReportProblemScreen] insert error:", insertErr);
      setSubmitError("Não foi possível enviar. Tente novamente.");
      return;
    }

    setType("");
    setSubject("");
    setDescription("");
    setSuccessMessage("Relatório enviado! Obrigada pelo feedback.");
  }

  function selectType(option) {
    setType(option);
    setPickerOpen(false);
    if (errors.type) setErrors((prev) => ({ ...prev, type: undefined }));
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={["#13E698", "#74B8DE"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reportar um problema</Text>
            <View style={styles.backButton} />
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.card}
          contentContainerStyle={styles.cardContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.breadcrumb}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={16} color="#1066E7" />
            <Text style={styles.breadcrumbText}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputWrapper, styles.inputReadOnly]}>
            <TextInput
              style={[styles.input, styles.inputReadOnlyText]}
              value={email}
              editable={false}
              placeholder="—"
              placeholderTextColor="#A1A4B2"
            />
          </View>

          <Text style={styles.label}>Tipo de problema</Text>
          <TouchableOpacity
            style={[
              styles.inputWrapper,
              styles.pickerTrigger,
              errors.type && styles.inputError,
            ]}
            onPress={() => setPickerOpen(true)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.pickerValue,
                !type && styles.pickerPlaceholder,
              ]}
            >
              {type || "Selecione uma opção"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#6E6E73" />
          </TouchableOpacity>
          {errors.type ? (
            <Text style={styles.errorText}>{errors.type}</Text>
          ) : null}

          <Text style={styles.label}>Assunto</Text>
          <View
            style={[
              styles.inputWrapper,
              errors.subject && styles.inputError,
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="Resumo do problema"
              placeholderTextColor="#A1A4B2"
              value={subject}
              onChangeText={(v) => {
                setSubject(v);
                if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
              }}
            />
          </View>
          {errors.subject ? (
            <Text style={styles.errorText}>{errors.subject}</Text>
          ) : null}

          <Text style={styles.label}>Descrição</Text>
          <View
            style={[
              styles.inputWrapper,
              styles.textareaWrapper,
              errors.description && styles.inputError,
            ]}
          >
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Descreva o problema em detalhes..."
              placeholderTextColor="#A1A4B2"
              value={description}
              onChangeText={(v) => {
                setDescription(v);
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              multiline
              textAlignVertical="top"
            />
          </View>
          {errors.description ? (
            <Text style={styles.errorText}>{errors.description}</Text>
          ) : null}

          {successMessage ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={18} color="#13A05E" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {submitError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#D32F2F" />
              <Text style={styles.submitErrorText}>{submitError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.submitButtonText}>Enviar relatório</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>

      <Modal
        transparent
        visible={pickerOpen}
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPickerOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Tipo de problema</Text>
            {PROBLEM_TYPES.map((option) => {
              const selected = option === type;
              return (
                <TouchableOpacity
                  key={option}
                  style={styles.modalOption}
                  onPress={() => selectType(option)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selected && styles.modalOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                  {selected ? (
                    <Ionicons name="checkmark" size={20} color="#1066E7" />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#13E698" },
  gradient: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontFamily: "Whyte-Bold",
    fontWeight: "700",
    color: "#FFFFFF",
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
  },
  cardContent: { paddingHorizontal: 24, paddingTop: 24 },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 4,
  },
  breadcrumbText: {
    fontSize: 14,
    fontFamily: "Whyte-Medium",
    color: "#1066E7",
    marginLeft: 4,
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
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputReadOnly: { backgroundColor: "#EFEFF1" },
  inputError: { borderColor: "#FF4444" },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    fontFamily: "Whyte-Regular",
    color: "#1C1C1E",
    padding: 0,
  },
  inputReadOnlyText: { color: "#6E6E73" },
  textareaWrapper: {
    height: 120,
    paddingVertical: 12,
    alignItems: "stretch",
  },
  textarea: {
    height: "100%",
    textAlignVertical: "top",
  },
  pickerTrigger: { justifyContent: "space-between" },
  pickerValue: {
    fontSize: 15,
    fontFamily: "Whyte-Regular",
    color: "#1C1C1E",
  },
  pickerPlaceholder: { color: "#A1A4B2" },
  errorText: {
    fontSize: 12,
    fontFamily: "Whyte-Regular",
    color: "#FF4444",
    marginTop: 6,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F8EE",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 24,
    gap: 8,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Whyte-Medium",
    color: "#13A05E",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDECEC",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 24,
    gap: 8,
  },
  submitErrorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Whyte-Medium",
    color: "#D32F2F",
  },
  submitButton: {
    backgroundColor: "#1066E7",
    borderRadius: 30,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Whyte-Bold",
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  modalTitle: {
    fontSize: 13,
    fontFamily: "Whyte-Medium",
    color: "#A1A4B2",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
  },
  modalOptionText: {
    fontSize: 15,
    fontFamily: "Whyte-Regular",
    color: "#1C1C1E",
  },
  modalOptionTextSelected: {
    color: "#1066E7",
    fontFamily: "Whyte-Medium",
    fontWeight: "600",
  },
});
