import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../services/supabase";

export default function CategoryScreen({ route, navigation }) {
  const { categoryId, categoryTitle, categoryColor } = route.params;
  const [sessions, setSessions] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
    loadUserProfile();
  }, []);

  async function loadUserProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileData) {
          setUserProfile(profileData);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
  }

  async function loadSessions() {
    try {
      const categoryMap = {
        Gratidão: "gratidao",
        "Atenção Concentrada": "atencao",
        Meditação: "meditacao",
        Reflexão: "reflexao",
        Descanso: "descanso",
      };

      const categoryValue = categoryMap[categoryTitle];

      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("category", categoryValue)
        .order("duration", { ascending: true });

      if (data) {
        setSessions(data);
      }
    } catch (error) {
      console.error("Erro ao carregar sessões:", error);
    } finally {
      setLoading(false);
    }
  }

  // Configurações por categoria
  const categoryConfig = {
    Gratidão: {
      headerText:
        "Feche os olhos e sinta.\nHoje é o dia perfeito para celebrar as pequenas alegrias da vida",
      headerTextColor: "#434184",
      cardBg: "#f2f5e5",
      titleColor: "#4e44a6",
      durationTagBg: "#cdced1",
      durationTagText: "#4e44a6",
      categoryTagOutline: "#cdced1",
      categoryTagText: "#4e44a6",
      playBg: "#9aae50",
    },
    "Atenção Concentrada": {
      headerText:
        "Foco ativado!\nAjuste sua postura, elimine distrações e mergulhe no seu fluxo criativo",
      headerTextColor: "#B87691",
      cardBg: "#FFF5F8",
      titleColor: "#4e600a",
      durationTagBg: "#d3d6a8",
      durationTagText: "#4e600a",
      categoryTagOutline: "#d3d6a8",
      categoryTagText: "#4e600a",
      playBg: "#B87691",
    },
    Meditação: {
      headerText:
        "Encontre seu centro.\nRespire fundo e deixe-se guiar por momentos de paz interior...",
      headerTextColor: "#55716A",
      cardBg: "#ecf5ea",
      titleColor: "#627d76",
      durationTagBg: "#d0e7d6",
      durationTagText: "#627d76",
      categoryTagOutline: "#d0e7d6",
      categoryTagText: "#627d76",
      playBg: "#496760",
    },
    Reflexão: {
      headerText:
        "Um convite à pausa.\nReflita, escute sua voz interior e descubra novos caminhos",
      headerTextColor: "#6c3209",
      cardBg: "#f6ead9",
      titleColor: "#764630",
      durationTagBg: "#ecd8c4",
      durationTagText: "#6c3209",
      categoryTagOutline: "#ecd8c4",
      categoryTagText: "#6c3209",
      playBg: "#6c3209",
    },
    Descanso: {
      headerText:
        "Boa noite\nRelaxe o corpo e a mente e se prepare para dormir",
      headerTextColor: "#101340",
      cardBg: "#cacbcf",
      titleColor: "#101340",
      durationTagBg: "#afafba",
      durationTagText: "#101340",
      categoryTagOutline: "#afafba",
      categoryTagText: "#101340",
      playBg: "#a3a3db",
    },
  };

  const config = categoryConfig[categoryTitle] || categoryConfig["Gratidão"];

  // Loading enquanto dados carregam
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={categoryColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      {/* Header Text */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerText, { color: config.headerTextColor }]}>
          {config.headerText}
        </Text>
      </View>

      {/* Lista de Sessões */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Nenhuma sessão disponível ainda
            </Text>
          </View>
        ) : (
          sessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={[styles.sessionCard, { backgroundColor: config.cardBg }]}
              onPress={() => {
                navigation.navigate("AudioPlayer", {
                  session: session,
                  categoryColor: categoryColor,
                  categoryTitle: categoryTitle,
                });
              }}
            >
              <View style={styles.sessionInfo}>
                <Text
                  style={[styles.sessionTitle, { color: config.titleColor }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {session.title}
                </Text>

                <View style={styles.sessionTags}>
                  {/* Tag de Duração - PREENCHIDA */}
                  <View
                    style={[
                      styles.durationTag,
                      { backgroundColor: config.durationTagBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        { color: config.durationTagText },
                      ]}
                    >
                      {session.duration} min
                    </Text>
                  </View>

                  {/* Tag de Categoria - OUTLINE */}
                  <View
                    style={[
                      styles.categoryTag,
                      {
                        backgroundColor: config.cardBg,
                        borderColor: config.categoryTagOutline,
                        borderWidth: 1.5,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        { color: config.categoryTagText },
                      ]}
                    >
                      {session.subtitle || "Meditação"}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[styles.playButton, { backgroundColor: config.playBg }]}
              >
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: config.bottomNav }]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Challenges")}
        >
          <Text style={styles.navIcon}>⏰</Text>
          <Text style={styles.navLabel}>Desafios</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Home")}
        >
          <View style={styles.navIconActive}>
            <Text style={styles.navIconActiveText}>🏠</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Profile")}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>{userProfile?.display_name}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 24,
    zIndex: 10,
    width: 40,
    height: 40,
  },
  backArrow: {
    fontSize: 24,
    color: "#3F414E",
  },
  headerContainer: {
    paddingTop: 100,
    paddingHorizontal: 28,
    paddingBottom: 25,
    backgroundColor: "#FAFAFA",
  },
  headerText: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 110,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#A1A4B2",
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 18,
    marginBottom: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  sessionInfo: {
    flex: 1,
    marginRight: 16,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  sessionTags: {
    flexDirection: "row",
    gap: 8,
  },
  durationTag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryTag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  playIcon: {
    fontSize: 20,
    color: "#FFFFFF",
    marginLeft: 2,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FDFCF6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: "space-around",
    alignItems: "center",
    height: 85,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 11,
    color: "#5A5A5A",
    fontWeight: "500",
  },
  navLabelActive: {
    fontSize: 11,
    color: "#3F414E",
    fontWeight: "600",
  },
  navIconActive: {
    backgroundColor: "#AF7842",
    width: 65,
    height: 65,
    borderRadius: 32.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  navIconActiveText: {
    fontSize: 30,
  },
});
