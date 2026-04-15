// Tela principal do app. Exibe progresso semanal, categorias de áudio e exercícios.

import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../services/supabase";

// Primeiras letras dos dias da semana em português
const WEEK_DAYS = ["S", "T", "Q", "Q", "S", "S", "D"];

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // TODO: buscar dias concluídos do banco futuramente
  const completedDays = 3;

  useEffect(() => {
    loadData();
  }, []);

  // Carrega perfil do usuário e categorias do banco
  async function loadData() {
    try {
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .order("order", { ascending: true });

      if (categoriesData) setCategories(categoriesData);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
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

  const audioCategories = categories.filter(
    (c) => c.title !== "Exercícios Semanais",
  );
  const exerciseCategory = categories.find(
    (c) => c.title === "Exercícios Semanais",
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Gradiente no topo */}
      <LinearGradient
        colors={["#13E698", "#74B8DE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.headerRow}>
          <Text style={styles.greeting}>Olá, {userProfile?.display_name}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            <Text style={styles.menuIcon}>☰</Text>
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

          {/* Barra de progresso */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(completedDays / 7) * 100}%` },
              ]}
            />
          </View>

          {/* Dias da semana */}
          <View style={styles.daysRow}>
            {WEEK_DAYS.map((day, index) => (
              <View
                key={index}
                style={[
                  styles.dayCircle,
                  index < completedDays && styles.dayCircleCompleted,
                ]}
              >
                {index < completedDays ? (
                  <Text style={styles.dayCheck}>✓</Text>
                ) : (
                  <Text style={styles.dayLabel}>{day}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Seção: áudios */}
        <Text style={styles.sectionTitle}>Áudios</Text>

        <View style={styles.audioGrid}>
          {audioCategories.map((category, index) => {
            // Última categoria sozinha → ocupa largura total
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
                <Text style={styles.audioCardTitle}>
                  {exerciseCategory.title}
                </Text>
              </View>
              <Text style={styles.audioCardIcon}>
                {exerciseCategory.icon_emoji}
              </Text>
            </TouchableOpacity>
          </>
        )}
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
    paddingBottom: 52,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 26,
    fontFamily: "Whyte-Bold",
    color: "#FFFFFF",
  },
  menuIcon: {
    fontSize: 26,
    color: "#FFFFFF",
  },

  // Card branco
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 40,
  },

  // Títulos de seção
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Whyte-Bold",
    color: "#1C1C1E",
    marginBottom: 14,
    marginTop: 8,
  },

  // Card de progresso semanal
  progressCard: {
    backgroundColor: "#F0F1F5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#1C1C1E",
  },
  progressCount: {
    fontSize: 14,
    fontFamily: "Whyte-Medium",
    color: "#1066E7",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#DCDDE3",
    borderRadius: 4,
    marginBottom: 14,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: "#1066E7",
    borderRadius: 4,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DCDDE3",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleCompleted: {
    backgroundColor: "#1066E7",
  },
  dayLabel: {
    fontSize: 20,
    fontFamily: "Whyte-Medium",
    color: "#6E6E73",
  },
  dayCheck: {
    fontSize: 20,
    color: "#FFFFFF",
    fontFamily: "Whyte-Bold",
  },

  // Grid de áudios
  audioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  audioCard: {
    width: "48%",
    height: 83,
    backgroundColor: "#F0F1F5",
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  audioCardFull: {
    width: "100%",
    height: 83,
    backgroundColor: "#F0F1F5",
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  audioCardTextWrapper: {
    flex: 1,
    justifyContent: "center",
    marginRight: 12,
  },
  audioCardTitle: {
    fontSize: 15,
    fontFamily: "Whyte-Regular",
    color: "#747474",
    lineHeight: 22,
  },
  audioCardIcon: {
    fontSize: 22,
  },
});
