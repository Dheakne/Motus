import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import WeeklyProgressCard from "../components/WeeklyProgressCard";
import { supabase } from "../services/supabase";

export default function ChallengesScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  async function loadUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .single();
        if (profileData) setUserProfile(profileData);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8E97FD" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Observação da Mente</Text>

        <Text style={styles.pageDescription}>
          Assim como jardineiros observam cada folha de suas plantas, você vai
          aprender a testemunhar sua mente com cuidado. A regra é a mesma, mas
          sua percepção se refinará a cada dia
        </Text>

        <Text style={styles.dayTitle}>Segunda - Feira</Text>

        <Text style={styles.challengeName}>Ao comer, apenas coma</Text>

        <Text style={styles.challengeDescription}>
          Comer distraidamente é um hábito moderno tão arraigado que nem
          percebemos sua estranheza. Comemos correndo, mastigamos distraídos,
          engolimos sem sentir. E, no entanto, esse pequeno ritual diário,
          quando praticado com presença, pode se tornar um poderoso remédio para
          a ansiedade que tanto nos consome.
        </Text>

        <Text style={styles.extraInfoTitle}>
          Em todas as refeições desta semana, coma a primeira mordida com
          extrema atenção.
        </Text>

        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Observe o alimento antes de levar à boca</Text>
          <Text style={styles.bulletItem}>• Sinta seu aroma primeiro</Text>
          <Text style={styles.bulletItem}>• Mastigue lentamente</Text>
          <Text style={styles.bulletItem}>• Note a textura e o sabor se transformando</Text>
        </View>

        <Text style={styles.discoveriesTitle}>Descobertas</Text>
        <Text style={styles.discoveriesIntro}>
          O comer em silêncio é um treino para a vida. Quem pratica descobre que:
        </Text>

        <View style={styles.discoveryCard}>
          <Text style={styles.discoveryItem}>
            • A ansiedade não é um monstro incontrolável, mas uma onda que pode
            ser surfada com atenção
          </Text>
          <Text style={styles.discoveryItem}>
            • O "tédio" de uma refeição sem distrações muitas vezes revela-se
            como paz disfarçada
          </Text>
          <Text style={styles.discoveryItem}>
            • Pequenos momentos de presença (até mesmo com um simples biscoito)
            são como ilhas de sanidade em um mar de caos
          </Text>
        </View>

        <Text style={styles.weeklyTitle}>Acompanhamento semanal</Text>

        <WeeklyProgressCard />

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>⏰</Text>
          <Text style={styles.navLabelActive}>Desafios</Text>
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
          <Text style={styles.navLabel}>
            {userProfile?.display_name || "Perfil"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAFAFA" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 120 },
  pageTitle: { fontSize: 24, fontWeight: "300", color: "#B8B8D1", marginBottom: 16 },
  pageDescription: { fontSize: 14, color: "#3F414E", lineHeight: 22, marginBottom: 30 },
  dayTitle: { fontSize: 18, fontWeight: "600", color: "#B4C77E", marginBottom: 20 },
  challengeName: { fontSize: 16, fontWeight: "600", color: "#3F414E", marginBottom: 12 },
  challengeDescription: { fontSize: 14, color: "#3F414E", lineHeight: 22, marginBottom: 20, textAlign: "justify" },
  extraInfoTitle: { fontSize: 14, fontWeight: "600", color: "#3F414E", marginBottom: 12 },
  bulletList: { backgroundColor: "#E5E5F7", padding: 16, borderRadius: 12, marginBottom: 24 },
  bulletItem: { fontSize: 13, color: "#5D5FEF", marginBottom: 8, lineHeight: 20 },
  discoveriesTitle: { fontSize: 18, fontWeight: "600", color: "#B4C77E", marginBottom: 12 },
  discoveriesIntro: { fontSize: 14, color: "#3F414E", marginBottom: 12 },
  discoveryCard: { backgroundColor: "#E5E5F7", padding: 16, borderRadius: 12, marginBottom: 30 },
  discoveryItem: { fontSize: 13, color: "#5D5FEF", marginBottom: 12, lineHeight: 20 },
  weeklyTitle: { fontSize: 18, fontWeight: "600", color: "#B4C77E", marginBottom: 16 },
  bottomNav: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", backgroundColor: "#FDFCF6",
    paddingVertical: 12, paddingHorizontal: 20,
    justifyContent: "space-around", alignItems: "center", height: 85,
  },
  navItem: { alignItems: "center", justifyContent: "center", flex: 1 },
  navIcon: { fontSize: 24, marginBottom: 4 },
  navLabel: { fontSize: 11, color: "#5A5A5A", fontWeight: "500" },
  navLabelActive: { fontSize: 11, color: "#3F414E", fontWeight: "600" },
  navIconActive: {
    backgroundColor: "#AF7842", width: 65, height: 65, borderRadius: 32.5,
    alignItems: "center", justifyContent: "center", marginTop: -40,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },
  navIconActiveText: { fontSize: 30 },
});
