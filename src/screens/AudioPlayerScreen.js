// Player de áudio para as sessões de meditação.
// Recebe os dados da sessão via route.params, vindos da tela de categoria.
// O player usa Expo AV para controle real de áudio (play, pause, barra de progresso).

import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BackIcon } from "../components/Icons";
import { supabase } from "../services/supabase";

export default function AudioPlayerScreen({ route, navigation }) {
  const { session, categoryTitle } = route.params;

  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(session.duration * 60 * 1000);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    setupAudio();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  async function setupAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error("Erro ao configurar áudio:", error);
    }
  }

  async function loadAndPlayAudio() {
    try {
      setIsLoading(true);

      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
        setIsLoading(false);
        return;
      }

      console.log("Carregando áudio de:", session.audio_url);

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: session.audio_url },
        { shouldPlay: true, volume },
        onPlaybackStatusUpdate,
      );

      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao carregar áudio:", error);
      Alert.alert("Erro", "Não foi possível carregar o áudio");
      setIsLoading(false);
    }
  }

  function onPlaybackStatusUpdate(status) {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis);
      setDuration(status.durationMillis || duration);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setCurrentTime(0);
        markSessionAsComplete();
      }
    }
  }

  async function handlePlayPause() {
    if (!sound) {
      await loadAndPlayAudio();
      return;
    }

    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Erro ao play/pause:", error);
      Alert.alert("Erro", "Não foi possível controlar o áudio");
    }
  }

  async function handleSkipForward() {
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.min(status.positionMillis + 10000, duration);
        await sound.setPositionAsync(newPosition);
      }
    } catch (error) {
      console.error("Erro ao avançar:", error);
    }
  }

  async function handleSkipBackward() {
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.max(status.positionMillis - 10000, 0);
        await sound.setPositionAsync(newPosition);
      }
    } catch (error) {
      console.error("Erro ao retroceder:", error);
    }
  }

  async function handleVolumeChange(value) {
    setVolume(value);
    if (sound) {
      try {
        await sound.setVolumeAsync(value);
      } catch (error) {
        console.error("Erro ao ajustar volume:", error);
      }
    }
  }

  async function markSessionAsComplete() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const pointsEarned = session.duration * 5;

      await supabase.from("user_sessions").insert([
        {
          user_id: user.id,
          session_id: session.id,
          completed: true,
          progress_seconds: session.duration * 60,
          completed_at: new Date().toISOString(),
          points_earned: pointsEarned,
        },
      ]);

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("total_points")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        await supabase
          .from("user_profiles")
          .update({
            total_points: (profile.total_points || 0) + pointsEarned,
          })
          .eq("user_id", user.id);
      }

      Alert.alert(
        "Parabéns! 🎉",
        `Você completou a sessão e ganhou ${pointsEarned} pontos!`,
      );
    } catch (error) {
      console.error("Erro ao marcar como completo:", error);
    }
  }

  function formatTime(milliseconds) {
    const totalSeconds = Math.floor(Math.max(milliseconds, 0) / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  const progressPercentage =
    duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const remainingTime = Math.max(duration - currentTime, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <BackIcon size={24} color="#1C1C1E" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.cover}>
          <Ionicons name="musical-notes" size={80} color="#6E6E6E" />
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {categoryTitle}: {session.title}
        </Text>

        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progressPercentage}%` }]}
            />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>-{formatTime(remainingTime)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={handleSkipBackward}
            disabled={!sound}
            style={styles.sideButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="play-back"
              size={32}
              color={sound ? "#1C1C1E" : "#C7C7CC"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePlayPause}
            disabled={isLoading}
            style={styles.playButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#1C1C1E" size="large" />
            ) : (
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={56}
                color="#1C1C1E"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkipForward}
            disabled={!sound}
            style={styles.sideButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="play-forward"
              size={32}
              color={sound ? "#1C1C1E" : "#C7C7CC"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.volumeRow}>
          <Ionicons name="volume-low" size={20} color="#6E6E6E" />
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            onValueChange={handleVolumeChange}
            minimumTrackTintColor="#1066E7"
            maximumTrackTintColor="#D9D9D9"
            thumbTintColor="#1066E7"
          />
          <Ionicons name="volume-high" size={20} color="#6E6E6E" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    marginTop: 8,
    marginLeft: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: "center",
    paddingTop: 24,
  },
  cover: {
    width: 220,
    height: 220,
    borderRadius: 24,
    backgroundColor: "#D9D9D9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  title: {
    fontSize: 22,
    fontFamily: "Whyte-Bold",
    fontWeight: "700",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 32,
  },
  progressSection: {
    width: "100%",
    marginBottom: 28,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#D9D9D9",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#1066E7",
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    fontFamily: "Whyte-Medium",
    color: "#6E6E6E",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
    marginBottom: 36,
  },
  sideButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  volumeSlider: {
    flex: 1,
    height: 32,
  },
});
