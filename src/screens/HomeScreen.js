import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DrawerMenu from "../components/DrawerMenu";
import WeeklyProgressCard from "../components/WeeklyProgressCard";
import { MenuIcon } from "../components/Icons";
import { supabase } from "../services/supabase";

function normalizeText(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

const CATEGORY_VISUALS = {
  "gratidao": { lib: "ion", name: "heart", iconColor: "#DA289F", bg: "#FFE1EC" },
  "atencao concentrada": { lib: "ion", name: "hourglass-outline", iconColor: "#2F1ECE", bg: "#DCEEFF" },
  "meditacao": { lib: "ion", name: "leaf", iconColor: "#83CC1D", bg: "#D9F5E4" },
  "reflexao": { lib: "mci", name: "head-lightbulb", iconColor: "#F26F29", bg: "#FFE3CC" },
  "descanso": { lib: "ion", name: "moon", iconColor: "#0AAEC0", bg: "#D6DCF7" },
  "exercicios semanais": { lib: "ion", name: "book", iconColor: "#EE2525", bg: "#FCDADA" },
};

function getCategoryVisual(title) {
  return CATEGORY_VISUALS[normalizeText(title)] || null;
}

function CategoryVisualIcon({ visual, size = 26 }) {
  if (!visual) return null;
  if (visual.lib === "mci") {
    return <MaterialCommunityIcons name={visual.name} size={size} color={visual.iconColor} />;
  }
  return <Ionicons name={visual.name} size={size} color={visual.iconColor} />;
}

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data: categoriesData } = await supabase
        .from("categories").select("*").order("order", { ascending: true });
      if (categoriesData) setCategories(categoriesData);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from("user_profiles").select("*").eq("user_id", user.id).single();
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleExercisesPress() {
    if (userProfile?.has_seen_tutus) {
      navigation.navigate("ExerciseList");
    } else {
      navigation.navigate("Mascot");
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (!error) navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1066E7" />
      </View>
    );
  }

  const audioCategories = categories.filter((c) => c.title !== "Exercícios Semanais");
  const exerciseCategory = categories.find((c) => c.title === "Exercícios Semanais");

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={["#13E698", "#74B8DE"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greetingSmall}>Bem-vindo de volta</Text>
              <Text style={styles.greeting}>
                Olá, {userProfile?.display_name?.split(" ")[0] || ""}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setDrawerOpen(true)}
            >
              <MenuIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.card}
          contentContainerStyle={styles.cardContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Meu exercício semanal</Text>

          <WeeklyProgressCard readOnly />

          <Text style={styles.sectionTitle}>Áudios</Text>

          <View style={styles.audioGrid}>
            {audioCategories.map((category, index) => {
              const isLastOdd =
                audioCategories.length % 2 !== 0 &&
                index === audioCategories.length - 1;
              const visual = getCategoryVisual(category.title);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.audioCard,
                    isLastOdd && styles.audioCardFull,
                  ]}
                  onPress={() =>
                    navigation.navigate("Category", {
                      categoryId: category.id,
                      categoryTitle: category.title,
                      categoryColor: category.color,
                    })
                  }
                >
                  <View style={styles.audioCardTextWrapper}>
                    <Text style={styles.audioCardTitle}>{category.title}</Text>
                  </View>
                  {visual ? (
                    <CategoryVisualIcon visual={visual} size={26} />
                  ) : (
                    <Text style={styles.audioCardIcon}>{category.icon_emoji}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {exerciseCategory && (() => {
            const exerciseVisual = getCategoryVisual(exerciseCategory.title);
            return (
              <>
                <Text style={styles.sectionTitle}>Exercícios</Text>
                <TouchableOpacity
                  style={styles.audioCardFull}
                  onPress={handleExercisesPress}
                >
                  <View style={styles.audioCardTextWrapper}>
                    <Text style={styles.audioCardTitle}>{exerciseCategory.title}</Text>
                  </View>
                  {exerciseVisual ? (
                    <CategoryVisualIcon visual={exerciseVisual} size={26} />
                  ) : (
                    <Text style={styles.audioCardIcon}>{exerciseCategory.icon_emoji}</Text>
                  )}
                </TouchableOpacity>
              </>
            );
          })()}

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>

      <DrawerMenu
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navigation={navigation}
        profile={userProfile}
        onLogout={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#13E698" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  gradient: { paddingHorizontal: 24, paddingBottom: 52, paddingTop: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greetingSmall: { fontSize: 13, fontFamily: "Whyte-Regular", color: "rgba(255,255,255,0.85)", marginBottom: 2 },
  greeting: { fontSize: 26, fontFamily: "Whyte-Bold", color: "#FFFFFF" },
  menuButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  card: { flex: 1, backgroundColor: "#FFFFFF", borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
  cardContent: { paddingHorizontal: 24, paddingTop: 44, paddingBottom: 100 },
  sectionTitle: { fontSize: 20, fontFamily: "Whyte-Bold", color: "#1C1C1E", marginBottom: 20, marginTop: 8 },
  audioGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 8 },
  audioCard: {
    width: "48%", height: 83, backgroundColor: "#F0F1F5",
    borderRadius: 14, paddingHorizontal: 14,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
  },
  audioCardFull: {
    width: "100%", height: 83, backgroundColor: "#F0F1F5",
    borderRadius: 14, paddingHorizontal: 14,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
  },
  audioCardTextWrapper: { flex: 1, justifyContent: "center", marginRight: 12 },
  audioCardTitle: { fontSize: 15, fontFamily: "Whyte-Regular", color: "#747474", lineHeight: 22 },
  audioCardIcon: { fontSize: 22 },
});
