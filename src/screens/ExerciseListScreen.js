/**
 * ExerciseListScreen - lista os exercícios semanais disponíveis.
 */

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BackIcon } from "../components/Icons";
import { supabase } from "../services/supabase";
import { DAY_COLUMNS } from '../utils/dayColumns';

function getWeekStart() {
  const today = new Date();
  const dow = today.getDay();
  const daysBack = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysBack);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeText(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

const EXERCISE_ICONS = {
  "caminhada consciente": { lib: "ion", name: "walk", color: "#13E698" },
  "refeicao em silencio": { lib: "mci", name: "silverware-fork-knife", color: "#F39C12" },
  "escuta profunda": { lib: "mci", name: "ear-hearing", color: "#1066E7" },
  "pausa das notificacoes": { lib: "ion", name: "notifications-off", color: "#9B59B6" },
  "respiracao consciente": { lib: "mci", name: "weather-windy", color: "#1ABC9C" },
  "observacao de pensamentos": { lib: "mci", name: "head-lightbulb-outline", color: "#5D5FEF" },
};

function getCategoryIcon(category) {
  const key = normalizeText(category);
  const map = {
    meditacao: { lib: "mci", name: "meditation", color: "#9B59B6" },
    sono: { lib: "ion", name: "moon-outline", color: "#5D5FEF" },
    concentracao: { lib: "mci", name: "brain", color: "#E67E22" },
    foco: { lib: "mci", name: "brain", color: "#E67E22" },
    gratidao: { lib: "mci", name: "heart-outline", color: "#E74C3C" },
    reflexao: { lib: "mci", name: "thought-bubble-outline", color: "#1066E7" },
    relacionamentos: { lib: "ion", name: "chatbubbles-outline", color: "#13E698" },
    respiracao: { lib: "mci", name: "weather-windy", color: "#74B8DE" },
    movimento: { lib: "ion", name: "walk-outline", color: "#13E698" },
    alimentacao: { lib: "mci", name: "silverware-fork-knife", color: "#F39C12" },
  };
  return map[key] || { lib: "ion", name: "leaf-outline", color: "#13E698" };
}

function getExerciseIcon(exercise) {
  const titleKey = normalizeText(exercise?.title);
  if (EXERCISE_ICONS[titleKey]) return EXERCISE_ICONS[titleKey];
  return getCategoryIcon(exercise?.category);
}

function ExerciseIcon({ exercise, size = 26 }) {
  const def = getExerciseIcon(exercise);
  if (def.lib === "mci") {
    return <MaterialCommunityIcons name={def.name} size={size} color={def.color} />;
  }
  return <Ionicons name={def.name} size={size} color={def.color} />;
}

export default function ExerciseListScreen({ navigation }) {
  const [exercises, setExercises] = useState([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFreemium, setShowFreemium] = useState(false);
  const [alreadyChosenId, setAlreadyChosenId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const weekStart = getWeekStart();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: existingRow } = await supabase
          .from("user_challenge_progress")
          .select("challenge_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday")
          .eq("user_id", user.id)
          .eq("week_start", weekStart)
          .maybeSingle();

        if (existingRow) {
          const count = DAY_COLUMNS.reduce((acc, col) => acc + (existingRow[col] ? 1 : 0), 0);
          setStreak(count);
          if (count > 0) {
            navigation.replace("Challenges", { exercise: { id: existingRow.challenge_id } });
            return;
          }
        }
      }

      const { data: list, error: listErr } = await supabase
        .from("weekly_challenges")
        .select("id,title,description,duration_minutes,category,is_free")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (listErr) throw listErr;
      setExercises(list || []);
    } catch (err) {
      console.error("[ExerciseListScreen] load error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function checkAndChooseExercise(exercise) {
    if (!exercise.is_free) {
      setShowFreemium(true);
      return;
    }

    try {
      const weekStart = getWeekStart();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from("user_challenge_progress")
        .select("challenge_id")
        .eq("user_id", user.id)
        .eq("week_start", weekStart)
        .maybeSingle();

      if (existing) {
        setAlreadyChosenId(existing.challenge_id);
        return;
      }

      // A escolha (INSERT) acontece na ChallengesScreen, ao tocar em
      // "Escolher este exercício". Aqui apenas navegamos com o exercício.
      navigation.navigate("Challenges", { exercise });
    } catch (err) {
      console.error("[ExerciseListScreen] press error:", err);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={["#13E698", "#74B8DE"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
            </TouchableOpacity>
          </View>

          <Text selectable={false} style={styles.headerTitle}>Exercícios semanais</Text>
          <Text selectable={false} style={styles.headerSubtitle}>Continue sua jornada!</Text>
        </LinearGradient>

        <ScrollView
          style={styles.card}
          contentContainerStyle={styles.cardContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.breadcrumb}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={16} color="#1066E7" />
            <Text selectable={false} style={styles.breadcrumbText}>Exercícios semanais</Text>
          </TouchableOpacity>

          <Text selectable={false} style={styles.sectionTitle}>Seus exercícios</Text>

          {exercises.map((exercise) => {
            const iconDef = getExerciseIcon(exercise);
            const isFree = !!exercise.is_free;
            const descPreview = (exercise.description || "").split("\n")[0];

            return (
              <TouchableOpacity
                key={exercise.id}
                style={styles.exerciseCard}
                onPress={() => checkAndChooseExercise(exercise)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: isFree ? "#FFFFFF" : "#E5E7EB",
                    },
                  ]}
                >
                  {isFree ? (
                    <ExerciseIcon exercise={exercise} size={28} />
                  ) : (
                    <Ionicons name="lock-closed" size={24} color="#9CA3AF" />
                  )}
                </View>

                <View style={styles.exerciseInfo}>
                  <Text
                    selectable={false}
                    style={[
                      styles.exerciseTitle,
                      !isFree && styles.exerciseTitleLocked,
                    ]}
                    numberOfLines={1}
                  >
                    {exercise.title}
                  </Text>
                  {descPreview ? (
                    <Text
                      selectable={false}
                      style={[
                        styles.exerciseDesc,
                        !isFree && styles.exerciseDescLocked,
                      ]}
                      numberOfLines={1}
                    >
                      {descPreview}
                    </Text>
                  ) : null}

                  <View style={styles.pillsRow}>
                    {exercise.duration_minutes ? (
                      <View
                        style={[
                          styles.pill,
                          !isFree && styles.pillLocked,
                        ]}
                      >
                        <Text
                          selectable={false}
                          style={[
                            styles.pillText,
                            !isFree && styles.pillTextLocked,
                          ]}
                        >
                          {exercise.duration_minutes} min
                        </Text>
                      </View>
                    ) : null}
                    {exercise.category ? (
                      <View
                        style={[
                          styles.pill,
                          !isFree && styles.pillLocked,
                        ]}
                      >
                        <Text
                          selectable={false}
                          style={[
                            styles.pillText,
                            !isFree && styles.pillTextLocked,
                          ]}
                        >
                          {exercise.category}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {showFreemium && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setShowFreemium(false)}
          activeOpacity={1}
        >
          <View style={styles.freemiumDrawer}>
            <View style={styles.freemiumHandle} />
            <Text selectable={false} style={styles.freemiumTitle}>Conteúdo Premium</Text>
            <Text selectable={false} style={styles.freemiumText}>
              Este exercício faz parte do plano Premium. Assine para desbloquear
              todos os exercícios e conteúdos exclusivos.
            </Text>
            <TouchableOpacity
              style={styles.premiumButton}
              onPress={() => setShowFreemium(false)}
            >
              <Text selectable={false} style={styles.premiumButtonText}>Ver planos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFreemium(false)}
            >
              <Text selectable={false} style={styles.closeButtonText}>Agora não</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {alreadyChosenId && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setAlreadyChosenId(null)}
          activeOpacity={1}
        >
          <View style={styles.alreadyChosenCard}>
            <Text style={styles.alreadyChosenTitle}>
              Você já escolheu um exercício!
            </Text>
            <Text style={styles.alreadyChosenText}>
              Você já escolheu um exercício para esta semana. Continue com ele para construir seu progresso.
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                setAlreadyChosenId(null);
                navigation.replace("Challenges", { exercise: { id: alreadyChosenId } });
              }}
            >
              <Text style={styles.continueButtonText}>Ir para meu exercício</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeAlreadyChosen}
              onPress={() => setAlreadyChosenId(null)}
            >
              <Text style={styles.closeAlreadyChosenText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#13E698" },
  loadingContainer: { alignItems: "center", justifyContent: "center" },
  gradient: { paddingHorizontal: 24, paddingBottom: 65, paddingTop: 8 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: { width: 40, height: 40, justifyContent: "center", cursor: "default" },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Whyte-Bold",
    color: "#FFFFFF",
    marginBottom: 9,
    lineHeight:25,
  },
  headerSubtitle: {
    fontSize: 18,
    fontFamily: "Whyte-Regular",
    color: "#FFFFFF",
    lineHeight:20,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -40,
    marginBottom: -33,
  },
  cardContent: { paddingHorizontal: 24, paddingTop: 24 },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
    paddingVertical: 4,
    cursor: "default",
  },
  breadcrumbText: {
    fontSize: 18,
    fontFamily: "Whyte-Medium",
    color: "#1066E7",
    marginLeft: 4,
     lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "Whyte-Bold",
    fontWeight: "700",
    color: "#252525",
    marginBottom: 26,
    lineHeight:31,
  },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F1F5",
    borderRadius: 21,
    height: 115,
    marginBottom: 16,
  },
  iconContainer: {
    width: 65,
    height: 65,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 20,
    marginRight: 0,
  },
  exerciseInfo: { flex: 1, marginLeft: 21, justifyContent: "center", marginBottom: 10, marginRight:21, },
  exerciseTitle: {
    fontSize: 17,
    fontFamily: "Whyte-Bold",
    color: "#333333",
    marginBottom: 0,
    marginTop: 13,
    lineHeight:31,
  },
  exerciseTitleLocked: { color: "#9CA3AF" },
  exerciseDesc: {
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#94979A",
    marginBottom: 11,
    lineHeight:16,
  },
  exerciseDescLocked: { color: "#C4C4C4" },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d8e0ef",
    borderRadius: 18,
    paddingHorizontal: 17,
    paddingVertical: 9,
  },
  pillLocked: { backgroundColor: "#eaeaee" },
  pillText: {
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#8f8fbe",
    lineHeight: 14,
  
  },
  pillTextLocked: { color: "#C7C7CC" },
  rightIndicator: {
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    width: 24,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    cursor: "default",
  },
  freemiumDrawer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    alignItems: "center",
  },
  freemiumHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E5EA",
    borderRadius: 2,
    marginBottom: 24,
  },
  freemiumTitle: {
    fontSize: 20,
    fontFamily: "Whyte-Bold",
    color: "#1C1C1E",
    marginBottom: 12,
     lineHeight: 21,
  },
  freemiumText: {
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#6E6E73",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  premiumButton: {
    backgroundColor: "#1066E7",
    borderRadius: 25,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
    cursor: "default",
  },
  premiumButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Whyte-Medium",
     lineHeight: 20,
  },
  closeButton: { paddingVertical: 10, cursor: "default" },
  closeButtonText: {
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#A1A4B2",
  },
  alreadyChosenCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    borderColor: "#B8D4F1",
    
  },
  alreadyChosenTitle: {
    fontSize: 18,
    fontFamily: "Whyte-Bold",
    fontWeight: "700",
    color: "#282a2d",
    marginBottom: 12,
    lineHeight:31,
  },
  alreadyChosenText: {
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#393c40",
    lineHeight: 22,
    marginBottom: 20,
    lineHeight:31,
  },
  continueButton: {
    backgroundColor: "#1066E7",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Whyte-Medium",
    fontWeight: "600",
    lineHeight:31,
  },
  closeAlreadyChosen: {
    paddingVertical: 12,
    alignItems: "center",
  },
  closeAlreadyChosenText: {
    color: "#1066E7",
    fontSize: 14,
    fontFamily: "Whyte-Medium",
    lineHeight:31,
  },
});
