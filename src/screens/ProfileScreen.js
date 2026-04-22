// Tela de perfil do usuário. Exibe foto, nome, username e opções da conta.

import { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import {
  BellIcon, ChallengesIcon, ChevronRightIcon, CloudIcon,
  EditIcon, FlagIcon, HomeIcon, LockIcon, LogoutIcon,
  TrashIcon, UserIcon,
} from "../components/Icons";
import { supabase } from "../services/supabase";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProfile(); }, []);
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => loadProfile());
    return unsubscribe;
  }, [navigation]);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profileData } = await supabase
          .from("user_profiles").select("*").eq("user_id", user.id).single();
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Sair", "Tem certeza que deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair", style: "destructive",
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) { Alert.alert("Erro", error.message); }
          else { navigation.reset({ index: 0, routes: [{ name: "Login" }] }); }
        },
      },
    ]);
  }

  async function handleChangePhoto() {
    Alert.alert("Foto de Perfil", "Escolha uma opção", [
      { text: "Cancelar", style: "cancel" },
      { text: "Trocar Foto", onPress: () => Alert.alert("Em desenvolvimento", "Funcionalidade será implementada em breve") },
      profile?.avatar_url && {
        text: "Remover Foto", style: "destructive",
        onPress: async () => {
          await supabase.from("user_profiles").update({ avatar_url: null }).eq("user_id", user.id);
          loadProfile();
        },
      },
    ].filter(Boolean));
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1066E7" />
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
        {/* Header com avatar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleChangePhoto}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {profile?.display_name?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <EditIcon size={13} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.displayName}>{profile?.display_name || "Usuário"}</Text>
          <Text style={styles.username}>
            @{profile?.display_name?.toLowerCase().replace(/\s/g, "") || "usuario"}
          </Text>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Conta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <MenuItem icon={<UserIcon size={18} color="#1066E7" />} label="Editar Perfil" onPress={() => navigation.navigate("EditProfile")} />
          <MenuItem icon={<BellIcon size={18} color="#1066E7" />} label="Notificações" onPress={() => Alert.alert("Notificações", "Em desenvolvimento")} />
          <MenuItem icon={<LockIcon size={18} color="#1066E7" />} label="Privacidade" onPress={() => Alert.alert("Privacidade", "Em desenvolvimento")} />
        </View>

        {/* Cache & celular */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cache & celular</Text>
          <MenuItem icon={<TrashIcon size={18} color="#1066E7" />} label="Liberar espaço" onPress={() => Alert.alert("Liberar espaço", "Em desenvolvimento")} />
          <MenuItem icon={<CloudIcon size={18} color="#1066E7" />} label="Data Saver" onPress={() => Alert.alert("Data Saver", "Em desenvolvimento")} />
        </View>

        {/* Ações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações</Text>
          <MenuItem icon={<FlagIcon size={18} color="#1066E7" />} label="Reportar um problema" onPress={() => Alert.alert("Reportar problema", "Em desenvolvimento")} />
          <MenuItem icon={<LogoutIcon size={18} color="#FF4444" />} label="Sair" labelColor="#FF4444" onPress={handleLogout} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation com ícones SVG */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Challenges")}>
          <ChallengesIcon size={24} color="#6E6E73" />
          <Text style={styles.navLabel}>Desafios</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Home")}>
          <View style={styles.navIconActive}>
            <HomeIcon size={26} color="#FFFFFF" filled />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <UserIcon size={24} color="#1066E7" />
          <Text style={[styles.navLabel, { color: "#1066E7" }]}>
            {profile?.display_name?.split(" ")[0] || "Perfil"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Sub-componente para item de menu
function MenuItem({ icon, label, onPress, labelColor = "#3F414E" }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconBox}>{icon}</View>
      <Text style={[styles.menuText, { color: labelColor }]}>{label}</Text>
      <ChevronRightIcon size={16} color="#BCBCBC" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAFAFA" },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingBottom: 120 },
  header: { alignItems: "center", paddingHorizontal: 24, marginBottom: 30 },
  avatarContainer: { position: "relative", marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#E8F0FE", alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 40, fontWeight: "bold", color: "#1066E7" },
  editBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#1066E7", alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "#FAFAFA",
  },
  displayName: { fontSize: 22, fontFamily: "Whyte-Bold", color: "#1C1C1E", marginBottom: 4 },
  username: { fontSize: 14, fontFamily: "Whyte-Regular", color: "#A1A4B2", marginBottom: 16 },
  editButton: { backgroundColor: "#1066E7", paddingHorizontal: 40, paddingVertical: 12, borderRadius: 20 },
  editButtonText: { color: "#FFFFFF", fontSize: 15, fontFamily: "Whyte-Medium" },
  section: { marginBottom: 24, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 16, fontFamily: "Whyte-Bold", color: "#3F414E", marginBottom: 12 },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFFFFF", padding: 16, borderRadius: 14, marginBottom: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  menuIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#EEF3FF", alignItems: "center", justifyContent: "center", marginRight: 16,
  },
  menuText: { flex: 1, fontSize: 15, fontFamily: "Whyte-Medium" },
  bottomNav: {
    position: "absolute", bottom: 0, left: 0, right: 0,
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
