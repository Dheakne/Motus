import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import WeeklyProgressCard from "../components/WeeklyProgressCard";
import { supabase } from "../services/supabase";

function parseList(text) {
  if (!text) return [];
  return text
    .toString()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function parseDiscoveries(text) {
  return parseList(text).map((line) =>
    line.replace(/^\d+[.)]\s*/, "").trim()
  );
}

export default function ChallengesScreen({ route, navigation }) {
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercise();
  }, []);

  async function loadExercise() {
    try {
      const exerciseId = route?.params?.exercise?.id;
      let query = supabase
        .from("weekly_challenges")
        .select("id,title,description,discoveries,tips");

      if (exerciseId) {
        query = query.eq("id", exerciseId);
      } else {
        query = query
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      setExercise(data);
    } catch (err) {
      console.error("[ChallengesScreen] load error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1066E7" />
      </View>
    );
  }

  const headerTitle = exercise?.title || "Desafio";
  const discoveries = parseDiscoveries(exercise?.discoveries);
  const tips = parseList(exercise?.tips);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#13E698", "#74B8DE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.headerRow}>
          <View style={styles.backButton} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {headerTitle}
          </Text>
          <View style={styles.backButton} />
        </View>
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
          <Text style={styles.breadcrumbText}>Exercícios semanais</Text>
        </TouchableOpacity>

        <View style={styles.welcomeRow}>
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeTitle}>Vamos começar?</Text>
            <Text style={styles.welcomeSubtitle}>
              Toda semana é uma nova chance de cuidar de você
            </Text>
          </View>
          <Image
            source={require("../../assets/images/tutus.png")}
            style={styles.mascot}
            resizeMode="contain"
          />
        </View>

        <WeeklyProgressCard />

        {exercise?.title ? (
          <Text style={styles.exerciseTitle}>{exercise.title}</Text>
        ) : null}

        {exercise?.description ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBox, { backgroundColor: "#FFE3CC" }]}>
                <Ionicons name="book-outline" size={18} color="#F97316" />
              </View>
              <Text style={styles.sectionTitle}>O que é o desafio</Text>
            </View>
            <Text style={styles.sectionBody}>{exercise.description}</Text>
          </View>
        ) : null}

        {discoveries.length > 0 ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBox, { backgroundColor: "#fae5f3" }]}>
                <Ionicons name="sparkles" size={18} color="#e353ba" />
              </View>
              <Text style={styles.sectionTitle}>O que você vai descobrir</Text>
            </View>
            {discoveries.map((item, idx) => (
              <View key={idx} style={styles.discoveryItem}>
                <View style={styles.discoveryNumber}>
                  <Text style={styles.discoveryNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.discoveryText}>{item}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {tips.length > 0 ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBox, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="bulb-outline" size={18} color="#EAB308" />
              </View>
              <Text style={styles.sectionTitle}>Dicas para fazer</Text>
            </View>
            {tips.map((tip, idx) => (
              <View key={idx} style={styles.tipRow}>
                <View style={styles.discoveryNumber}>
                  <Text style={styles.discoveryNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: "#FFFFFF",
  },
  gradient: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontFamily: "Whyte-Bold",
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 31,
  },
  card: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    marginBottom:-35,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    marginBottom: 16,
  },
  breadcrumbText: {
    fontSize: 16,
    fontFamily: "Whyte-Medium",
    color: "#1066E7",
    marginLeft: 4,
    lineHeight: 20,
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  welcomeText: {
    flex: 1,
    marginRight: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontFamily: "Whyte-Bold",
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 6,
     lineHeight: 25,
  },
  welcomeSubtitle: {
    fontSize: 15,
    fontFamily: "Whyte-Regular",
    color: "#6E6E73",
    lineHeight: 17,
  },
  exerciseTitle: {
    fontSize: 22,
    fontFamily: "Whyte-Bold",
    fontWeight: "700",
    color: "#1C1C1E",
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 31,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F1F5",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Whyte-Bold",
    fontWeight: "700",
    color: "#1C1C1E",
     lineHeight: 20,
  },
  sectionBody: {
    fontSize: 15,
    fontFamily: "Whyte-Regular",
    color: "#3F414E",
    lineHeight: 20,
  },
  discoveryItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    backgroundColor: "#F5F7FB",
    borderRadius: 12,
    padding: 12,
  },
  discoveryNumber: {
    width: 35,
    height: 35,
    borderRadius: 6,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  discoveryNumberText: {
    fontSize: 18,
    fontFamily: "Whyte-Bold",
    fontWeight: "700",
    color: "#1066E7",
    marginBottom: -8,
    lineHeight: 20,
  },   
  discoveryText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#3F414E",
    lineHeight: 20,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    backgroundColor: "#F5F7FB",
    borderRadius: 12,
    padding: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#3F414E",
    lineHeight: 22,
  },
  tipSeparator: {
    height: 0,
  },
});
