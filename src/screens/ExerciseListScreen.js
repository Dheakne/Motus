import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BackIcon,
  BellOffIcon,
  EarIcon,
  ForkKnifeIcon,
  LockIcon,
  NotebookIcon,
  ThoughtIcon,
  WalkingIcon,
  WindIcon,
} from "../components/Icons";

const EXERCISES = [
  { id: 1, title: "Caminhada Consciente", icon: WalkingIcon, color: "#13E698", isFree: true },
  { id: 2, title: "Refeição em Silêncio", icon: ForkKnifeIcon, color: "#1066E7", isFree: true },
  { id: 3, title: "Escuta Profunda", icon: EarIcon, color: "#9B59B6", isFree: true },
  { id: 4, title: "Pausa das Notificações", icon: BellOffIcon, color: "#E67E22", isFree: false },
  { id: 5, title: "Respiração Consciente", icon: WindIcon, color: "#E74C3C", isFree: false },
  { id: 6, title: "Diário de Gratidão", icon: NotebookIcon, color: "#F39C12", isFree: false },
  { id: 7, title: "Observação de Pensamentos", icon: ThoughtIcon, color: "#2ECC71", isFree: false },
];

export default function ExerciseListScreen({ navigation }) {
  const [showFreemium, setShowFreemium] = useState(false);

  function handleExercisePress(exercise) {
    if (exercise.isFree) {
      navigation.navigate("Challenges", { exercise });
    } else {
      setShowFreemium(true);
    }
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <BackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exercícios Semanais</Text>
          <Text style={styles.headerSubtitle}>
            Escolha um exercício para praticar esta semana
          </Text>
        </LinearGradient>

        <ScrollView
          style={styles.card}
          contentContainerStyle={styles.cardContent}
          showsVerticalScrollIndicator={false}
        >
          {EXERCISES.map((exercise) => {
            const IconComponent = exercise.icon;
            return (
              <TouchableOpacity
                key={exercise.id}
                style={[
                  styles.exerciseCard,
                  !exercise.isFree && styles.exerciseCardLocked,
                ]}
                onPress={() => handleExercisePress(exercise)}
              >
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: exercise.isFree
                        ? exercise.color + "20"
                        : "#F0F1F5",
                    },
                  ]}
                >
                  {exercise.isFree ? (
                    <IconComponent size={24} color={exercise.color} />
                  ) : (
                    <LockIcon size={22} color="#A1A4B2" />
                  )}
                </View>

                <View style={styles.exerciseInfo}>
                  <Text
                    style={[
                      styles.exerciseTitle,
                      !exercise.isFree && styles.exerciseTitleLocked,
                    ]}
                  >
                    {exercise.title}
                  </Text>
                  <Text style={styles.exerciseTag}>
                    {exercise.isFree ? "Gratuito" : "Plano Premium"}
                  </Text>
                </View>

                {exercise.isFree && (
                  <View style={styles.arrowContainer}>
                    <Text style={[styles.arrow, { color: exercise.color }]}>
                      →
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Freemium Drawer */}
      {showFreemium && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setShowFreemium(false)}
          activeOpacity={1}
        >
          <View style={styles.freemiumDrawer}>
            <View style={styles.freemiumHandle} />
            <Text style={styles.freemiumTitle}>Conteúdo Premium 🔒</Text>
            <Text style={styles.freemiumText}>
              Este exercício faz parte do plano Premium. Assine para desbloquear
              todos os exercícios e conteúdos exclusivos.
            </Text>
            <TouchableOpacity
              style={styles.premiumButton}
              onPress={() => setShowFreemium(false)}
            >
              <Text style={styles.premiumButtonText}>Ver planos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFreemium(false)}
            >
              <Text style={styles.closeButtonText}>Agora não</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#13E698" },
  gradient: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 },
  backButton: { marginBottom: 16, width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 26, fontFamily: "Whyte-Bold", color: "#FFFFFF", marginBottom: 6 },
  headerSubtitle: { fontSize: 13, fontFamily: "Whyte-Regular", color: "rgba(255,255,255,0.85)" },
  card: { flex: 1, backgroundColor: "#FFFFFF", borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
  cardContent: { paddingHorizontal: 24, paddingTop: 32 },
  exerciseCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFFFFF", borderRadius: 16,
    padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  exerciseCardLocked: { backgroundColor: "#FAFAFA" },
  iconContainer: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: "center", justifyContent: "center", marginRight: 14,
  },
  exerciseInfo: { flex: 1 },
  exerciseTitle: { fontSize: 15, fontFamily: "Whyte-Medium", color: "#1C1C1E", marginBottom: 4 },
  exerciseTitleLocked: { color: "#A1A4B2" },
  exerciseTag: { fontSize: 12, fontFamily: "Whyte-Regular", color: "#A1A4B2" },
  arrowContainer: { paddingLeft: 8 },
  arrow: { fontSize: 20, fontFamily: "Whyte-Bold" },
  overlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end",
  },
  freemiumDrawer: {
    backgroundColor: "#FFFFFF", borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 32, alignItems: "center",
  },
  freemiumHandle: {
    width: 40, height: 4, backgroundColor: "#E5E5EA",
    borderRadius: 2, marginBottom: 24,
  },
  freemiumTitle: { fontSize: 20, fontFamily: "Whyte-Bold", color: "#1C1C1E", marginBottom: 12 },
  freemiumText: {
    fontSize: 14, fontFamily: "Whyte-Regular", color: "#6E6E73",
    textAlign: "center", lineHeight: 22, marginBottom: 24,
  },
  premiumButton: {
    backgroundColor: "#1066E7", borderRadius: 25,
    paddingVertical: 14, width: "100%",
    alignItems: "center", marginBottom: 12,
  },
  premiumButtonText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Whyte-Medium" },
  closeButton: { paddingVertical: 10 },
  closeButtonText: { fontSize: 14, fontFamily: "Whyte-Regular", color: "#A1A4B2" },
});