import React from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../services/supabase";

export default function MascotScreen({ navigation }) {
  async function handleHelloTutu() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("user_profiles")
          .update({ has_seen_tutus: true })
          .eq("user_id", user.id);
      }
    } catch (error) {
      console.error("Erro ao marcar has_seen_tutus:", error);
    } finally {
      navigation.navigate("ExerciseList");
    }
  }

  return (
    <View style={styles.root}>
      <Image
        source={require("../../assets/images/apresentacao-tutus.png")}
        style={styles.bgImage}
        resizeMode="contain"
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.navigate("Home")}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>{"< Início"}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Olá, sou o Tutu!</Text>
          <Text style={styles.subtitle}>
            Seu novo parceiro para te ajudar a superar desafios e criar hábitos
            saudáveis.
          </Text>

          <View style={styles.spacer} />

          <TouchableOpacity
            style={styles.button}
            onPress={handleHelloTutu}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Olá, Tutu!</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  bgImage: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    aspectRatio: 425 / 900,
    transform: [{ translateY: 200 }],
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backLink: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: {
    fontFamily: "Whyte-Medium",
    fontSize: 16,
    color: "#6B7280",
  },
  title: {
    fontFamily: "Whyte-Bold",
    fontSize: 32,
    color: "#0F172A",
    marginTop: 16,
  },
  subtitle: {
    fontFamily: "Whyte-Regular",
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 22,
    marginTop: 12,
  },
  spacer: {
    flex: 1,
  },
  button: {
    backgroundColor: "#1066E7",
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: "Whyte-Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});
