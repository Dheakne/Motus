// Drawer lateral do menu de navegação do app Motus
// Desliza da direita para a esquerda com fundo escurecido

import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  BellIcon,
  ChallengesIcon,
  ChevronRightIcon,
  CloseIcon,
  EditIcon,
  FlagIcon,
  HomeIcon,
  LockIcon,
  LogoutIcon,
  UserIcon,
} from "./Icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

export default function DrawerMenu({
  visible,
  onClose,
  navigation,
  profile,
  onLogout,
}) {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  function navigate(screen) {
    onClose();
    setTimeout(() => navigation.navigate(screen), 180);
  }

  if (!visible && slideAnim._value >= DRAWER_WIDTH) return null;

  return (
    <View style={styles.overlay} pointerEvents={visible ? "auto" : "none"}>
      {/* Fundo escurecido — toque fecha o drawer */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Painel do drawer */}
      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {/* Header com gradiente */}
        <LinearGradient
          colors={["#13E698", "#74B8DE"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.drawerHeader}
        >
          {/* Botão fechar */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <CloseIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Avatar e nome */}
          <View style={styles.profileArea}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {profile?.display_name?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <Text style={styles.drawerName}>
              {profile?.display_name || "Usuário"}
            </Text>
            <Text style={styles.drawerHandle}>
              @
              {profile?.display_name?.toLowerCase().replace(/\s/g, "") ||
                "usuario"}
            </Text>
          </View>
        </LinearGradient>

        {/* Lista de itens */}
        <View style={styles.menuList}>
          <Text style={styles.menuSection}>Navegação</Text>

          <DrawerItem
            icon={<HomeIcon size={20} color="#1066E7" />}
            label="Início"
            onPress={() => navigate("Home")}
          />
          <DrawerItem
            icon={<ChallengesIcon size={20} color="#1066E7" />}
            label="Desafios"
            onPress={() => navigate("Challenges")}
          />
          <DrawerItem
            icon={<UserIcon size={20} color="#1066E7" />}
            label="Perfil"
            onPress={() => navigate("Profile")}
          />

          <View style={styles.divider} />
          <Text style={styles.menuSection}>Conta</Text>

          <DrawerItem
            icon={<EditIcon size={20} color="#1066E7" />}
            label="Editar Perfil"
            onPress={() => navigate("EditProfile")}
          />
          <DrawerItem
            icon={<BellIcon size={20} color="#1066E7" />}
            label="Notificações"
            onPress={() => {}}
          />
          <DrawerItem
            icon={<LockIcon size={20} color="#1066E7" />}
            label="Privacidade"
            onPress={() => {}}
          />
          <DrawerItem
            icon={<FlagIcon size={20} color="#1066E7" />}
            label="Reportar problema"
            onPress={() => {}}
          />

          <View style={styles.divider} />

          <DrawerItem
            icon={<LogoutIcon size={20} color="#FF4444" />}
            label="Sair"
            labelColor="#FF4444"
            onPress={() => {
              onClose();
              setTimeout(() => onLogout(), 180);
            }}
          />
        </View>

        {/* Rodapé */}
        <View style={styles.drawerFooter}>
          <Text style={styles.footerText}>Motus • v1.0.0</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ──────────────────────────────────────────────
// Sub-componente: item individual do drawer
// ──────────────────────────────────────────────
function DrawerItem({ icon, label, onPress, labelColor = "#3F414E" }) {
  return (
    <TouchableOpacity style={styles.drawerItem} onPress={onPress}>
      <View style={styles.drawerItemIcon}>{icon}</View>
      <Text style={[styles.drawerItemLabel, { color: labelColor }]}>
        {label}
      </Text>
      <ChevronRightIcon size={16} color="#BCBCBC" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 20,
  },
  drawerHeader: {
    paddingTop: 50,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  closeBtn: {
    alignSelf: "flex-end",
    padding: 4,
    marginBottom: 16,
  },
  profileArea: {
    alignItems: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.7)",
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.6)",
    marginBottom: 12,
  },
  avatarLetter: {
    fontSize: 30,
    fontFamily: "Whyte-Bold",
    color: "#FFFFFF",
  },
  drawerName: {
    fontSize: 20,
    fontFamily: "Whyte-Bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  drawerHandle: {
    fontSize: 13,
    fontFamily: "Whyte-Regular",
    color: "rgba(255,255,255,0.8)",
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  menuSection: {
    fontSize: 11,
    fontFamily: "Whyte-Medium",
    color: "#A1A4B2",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 8,
    marginTop: 4,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  drawerItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  drawerItemLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Whyte-Medium",
    color: "#3F414E",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F1F5",
    marginVertical: 10,
    marginHorizontal: 8,
  },
  drawerFooter: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Whyte-Regular",
    color: "#BCBCBC",
  },
});
