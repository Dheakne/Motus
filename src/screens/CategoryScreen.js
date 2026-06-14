import { Ionicons } from "@expo/vector-icons";
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

export default function CategoryScreen({ route, navigation }) {
  const { categoryTitle, categoryColor } = route.params;
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

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

      if (!categoryValue) {
        console.error("Categoria inválida:", categoryTitle);
        setLoading(false);
        return;
      }

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
        <View style={styles.headerRow}>
          <View style={styles.backButton} />
          <Text style={styles.headerTitle}>{categoryTitle}</Text>
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
          <Ionicons name="chevron-back" size={25} color="#1066E7" />
          <Text style={styles.breadcrumbText}>Áudios</Text>
        </TouchableOpacity>

        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Nenhuma sessão disponível ainda
            </Text>
          </View>
        ) : (
          sessions.map((session, index) => {
            const isLast = index === sessions.length - 1;
            return (
              <View key={session.id}>
                <TouchableOpacity
                  style={styles.sessionItem}
                  onPress={() => {
                    navigation.navigate("AudioPlayer", {
                      session: session,
                      categoryColor: categoryColor,
                      categoryTitle: categoryTitle,
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconBox}>
                    <Ionicons name="musical-note" size={24} color="#6E6E6E" />
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text
                      style={styles.sessionTitle}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {session.title}
                    </Text>
                    <Text style={styles.sessionDuration}>
                      {session.duration} min
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
                </TouchableOpacity>
                {!isLast ? <View style={styles.separator} /> : null}
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
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
    fontSize: 22,
    fontFamily: "Whyte-Bold",
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight:31,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    marginBottom: -33,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    marginBottom: 12,
  },
  breadcrumbText: {
    fontSize: 16,
    fontFamily: "Whyte-Medium",
    color: "#1066E7",
    marginLeft: 4,
    lineHeight:31,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#A1A4B2",
    lineHeight:31,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#D9D9D9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 18,
    fontFamily: "Whyte-Bold",
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: -6,
    lineHeight:31,
  },
  sessionDuration: {
    fontSize: 16,
    fontFamily: "Whyte-Regular",
    color: "#6E6E73",
    lineHeight:31,
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F1F5",
    marginHorizontal: 4,
  },
});
