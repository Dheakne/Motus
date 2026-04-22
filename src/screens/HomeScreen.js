// Tela principal do app. Exibe progresso semanal, categorias de áudio e exercícios.

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
import { ChallengesIcon, CheckIcon, HomeIcon, MenuIcon, UserIcon } from "../components/Icons";
import { supabase } from "../services/supabase";

const WEEK_DAYS = ["S", "T", "Q", "Q", "S", "S", "D"];

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const completedDays = 3;

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

  async function handleLogout() {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair", style: "destructive",
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (!error) navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
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
        {/* Gradiente no topo */}
        <LinearGradient
          colors={["#13E698", "#74B8DE"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greetingSmall}>Bem-vindo de volta 👋</Text>
              <Text style={styles.greeting}>
                Olá, {userProfile?.display_name?.split(" ")[0] || ""}
              </Text>
            </View>
            {/* Botão de menu — abre o Drawer */}
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setDrawerOpen(true)}
            >
              <MenuIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Card branco com scroll */}
        <ScrollView
          style={styles.card}
          contentContainerStyle={styles.cardContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Seção: exercício semanal */}
          <Text style={styles.sectionTitle}>Meu exercício semanal</Text>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progresso semanal</Text>
              <Text style={styles.progressCount}>{completedDays}/7</Text>
            </View>

            <View style={styles.progressBarBg}>
              <View
                style={[styles.progressBarFill, { width: `${(completedDays / 7) * 100}%` }]}
              />
            </View>

            <View style={styles.daysRow}>
              {WEEK_DAYS.map((day, index) => (
                <View
                  key={index}
                  style={[styles.dayCircle, index < completedDays && styles.dayCircleCompleted]}
                >
                  {index < completedDays
                    ? <CheckIcon size={16} color="#FFFFFF" />
                    : <Text style={styles.dayLabel}>{day}</Text>
                  }
                </View>
              ))}
            </View>
          </View>

          {/* Seção: áudios */}
          <Text style={styles.sectionTitle}>Áudios</Text>

          <View style={styles.audioGrid}>
            {audioCategories.map((category, index) => {
              const isLastOdd =
                audioCategories.length % 2 !== 0 &&
                index === audioCategories.length - 1;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.audioCard, isLastOdd && styles.audioCardFull]}
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
                  <Text style={styles.audioCardIcon}>{category.icon_emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Seção: exercícios */}
          {exerciseCategory && (
            <>
              <Text style={styles.sectionTitle}>Exercícios</Text>
              <TouchableOpacity
                style={styles.audioCardFull}
                onPress={() => navigation.navigate("Challenges")}
              >
                <View style={styles.audioCardTextWrapper}>
                  <Text style={styles.audioCardTitle}>{exerciseCategory.title}</Text>
                </View>
                <Text style={styles.audioCardIcon}>{exerciseCategory.icon_emoji}</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom Navigation com ícones SVG */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("Challenges")}
          >
            <ChallengesIcon size={24} color="#6E6E73" />
            <Text style={styles.navLabel}>Desafios</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <View style={styles.navIconActive}>
              <HomeIcon size={26} color="#FFFFFF" filled />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("Profile")}
          >
            <UserIcon size={24} color="#6E6E73" />
            <Text style={styles.navLabel}>
              {userProfile?.display_name?.split(" ")[0] || "Perfil"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Drawer lateral (fora do SafeAreaView para cobrir tudo) */}
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
  sectionTitle: { fontSize: 18, fontFamily: "Whyte-Bold", color: "#1C1C1E", marginBottom: 14, marginTop: 8 },
  progressCard: { backgroundColor: "#F0F1F5", borderRadius: 16, padding: 16, marginBottom: 28 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  progressLabel: { fontSize: 14, fontFamily: "Whyte-Regular", color: "#1C1C1E" },
  progressCount: { fontSize: 14, fontFamily: "Whyte-Medium", color: "#1066E7" },
  progressBarBg: { height: 8, backgroundColor: "#DCDDE3", borderRadius: 4, marginBottom: 14 },
  progressBarFill: { height: 8, backgroundColor: "#1066E7", borderRadius: 4 },
  daysRow: { flexDirection: "row", justifyContent: "space-between" },
  dayCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#DCDDE3", alignItems: "center", justifyContent: "center" },
  dayCircleCompleted: { backgroundColor: "#1066E7" },
  dayLabel: { fontSize: 14, fontFamily: "Whyte-Medium", color: "#6E6E73" },
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
  bottomNav: {
    flexDirection: "row", backgroundColor: "#FDFCF6",
    paddingVertical: 12, paddingHorizontal: 20,
    justifyContent: "space-around", alignItems: "center",
    height: 80, borderTopWidth: 1, borderTopColor: "#F0F0F0",
  },
  navItem: { alignItems: "center", justifyContent: "center", flex: 1 },
  navLabel: { fontSize: 11, fontFamily: "Whyte-Medium", color: "#5A5A5A", marginTop: 4 },
  navIconActive: {
    backgroundColor: "#1066E7", width: 60, height: 60, borderRadius: 30,
    alignItems: "center", justifyContent: "center", marginTop: -36,
    shadowColor: "#1066E7", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
  },
});
