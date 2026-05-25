// Drawer lateral do menu de navegação do app Motus
// Desliza da direita para a esquerda com fundo escurecido

import React, { useEffect, useRef, useState } from "react";
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
import { supabase } from "../services/supabase";
import {
  ChevronRightIcon,
  FlagIcon,
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
  const [email, setEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setEmail(data?.user?.email || "");
    });
    return () => { cancelled = true; };
  }, []);

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

  const displayName = profile?.full_name || profile?.display_name || "Usuário";

  return (
    <View style={styles.overlay} pointerEvents={visible ? "auto" : "none"}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.userSection}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <UserIcon size={32} color="#8c8e94" />
            </View>
          )}
          <Text style={styles.userName} numberOfLines={1}>
            {displayName}
          </Text>
          {email ? (
            <Text style={styles.userEmail} numberOfLines={1}>
              {email}
            </Text>
          ) : null}
        </View>

        <View style={styles.menuList}>
          <DrawerItem
            icon={<UserIcon size={20} color="#535353" />}
            label="Editar perfil"
            onPress={() => navigate("EditProfile")}
          />
          <View style={styles.divider} />
          <DrawerItem
            icon={<FlagIcon size={20} color="#535353" />}
            label="Reportar um problema"
            onPress={() => navigate("ReportProblem")}
          />
        </View>

        <TouchableOpacity
          style={styles.logoutItem}
          onPress={() => {
            onClose();
            setTimeout(() => onLogout(), 180);
          }}
        >
          <View style={styles.logoutIcon}>
            <LogoutIcon size={20} color="#FF4444" />
          </View>
          <Text style={styles.logoutLabel}>Sair</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function DrawerItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.drawerItem} onPress={onPress}>
      <View style={styles.drawerItemIcon}>{icon}</View>
      <Text style={styles.drawerItemLabel}>{label}</Text>
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
  userSection: {
    alignItems: "center",
    paddingTop: 64,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F1F5",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 14,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F1F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  userName: {
    fontSize: 18,
    fontFamily: "Whyte-Bold",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    fontFamily: "Whyte-Regular",
    color: "#8E8E93",
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  drawerItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0F1F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  drawerItemLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Whyte-Medium",
    color: "#1C1C1E",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F1F5",
    marginHorizontal: 12,
  },
  logoutItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 28,
    borderTopWidth: 1,
    borderTopColor: "#F0F1F5",
  },
  logoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFE5E5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  logoutLabel: {
    fontSize: 15,
    fontFamily: "Whyte-Medium",
    color: "#FF4444",
  },
});
