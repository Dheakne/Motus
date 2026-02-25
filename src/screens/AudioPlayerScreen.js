import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../services/supabase';

export default function AudioPlayerScreen({ route, navigation }) {
  const { session, categoryColor, categoryTitle } = route.params;
  
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(session.duration * 60 * 1000); // em ms
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadUserProfile();
    setupAudio();
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  async function loadUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profileData) {
          setUserProfile(profileData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  }

  async function setupAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Erro ao configurar áudio:', error);
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

      // Carregar novo áudio
      console.log('Carregando áudio de:', session.audio_url);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: session.audio_url },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar áudio:', error);
      Alert.alert('Erro', 'Não foi possível carregar o áudio');
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
      console.error('Erro ao play/pause:', error);
      Alert.alert('Erro', 'Não foi possível controlar o áudio');
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
      console.error('Erro ao avançar:', error);
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
      console.error('Erro ao retroceder:', error);
    }
  }

  async function markSessionAsComplete() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calcular pontos (5 pontos por minuto)
      const pointsEarned = session.duration * 5;

      // Salvar progresso
      await supabase.from('user_sessions').insert([{
        user_id: user.id,
        session_id: session.id,
        completed: true,
        progress_seconds: session.duration * 60,
        completed_at: new Date().toISOString(),
        points_earned: pointsEarned
      }]);

      // Atualizar pontos totais do usuário
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('total_points')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('user_profiles')
          .update({ 
            total_points: (profile.total_points || 0) + pointsEarned 
          })
          .eq('user_id', user.id);
      }

      Alert.alert(
        'Parabéns! 🎉',
        `Você completou a sessão e ganhou ${pointsEarned} pontos!`
      );
    } catch (error) {
      console.error('Erro ao marcar como completo:', error);
    }
  }

  function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  const progressPercentage = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: categoryColor + '10' }]}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.illustrationContainer}>
        <View style={[styles.outerCircle, { borderColor: categoryColor }]}>
          <View style={[styles.innerCircle, { backgroundColor: categoryColor }]}>
            <Text style={styles.illustrationPlaceholder}>
              {isPlaying ? '🎵' : '🧘'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.sessionTitle, { color: categoryColor }]}>
          {session.title}
        </Text>
        <Text style={styles.sessionDescription}>
          {session.full_description || 'Guia de ' + categoryTitle}
        </Text>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={handleSkipBackward}
          disabled={!sound}
        >
          <Text style={[styles.controlIcon, { color: sound ? categoryColor : '#ccc' }]}>
            ⏮
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.playButton, { backgroundColor: categoryColor }]}
          onPress={handlePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.playIcon}>
              {isPlaying ? '⏸' : '▶'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={handleSkipForward}
          disabled={!sound}
        >
          <Text style={[styles.controlIcon, { color: sound ? categoryColor : '#ccc' }]}>
            ⏭
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: categoryColor,
                  width: `${progressPercentage}%` 
                }
              ]} 
            />
          </View>
          <View 
            style={[
              styles.progressThumb, 
              { 
                backgroundColor: categoryColor,
                left: `${progressPercentage}%`
              }
            ]} 
          />
        </View>
        
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      <View style={[styles.bottomNav, { backgroundColor: categoryColor }]}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Challenges')}
        >
          <Text style={styles.navIcon}>⏰</Text>
          <Text style={styles.navLabel}>Desafios</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <View style={styles.navIconActive}>
            <Text style={styles.navIconActiveText}>🏠</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>
            {userProfile?.display_name || 'Amanda'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
  },
  backArrow: {
    fontSize: 28,
    color: '#3F414E',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 50,
  },
  outerCircle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  innerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  illustrationPlaceholder: {
    fontSize: 100,
  },
  infoContainer: {
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 60,
  },
  sessionTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  sessionDescription: {
    fontSize: 15,
    color: '#A1A4B2',
    textAlign: 'center',
    lineHeight: 22,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    gap: 40,
  },
  controlButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    fontSize: 28,
  },
  playButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  playIcon: {
    fontSize: 32,
    color: '#fff',
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 35,
    gap: 15,
    marginBottom: 120,
  },
  timeText: {
    fontSize: 15,
    color: '#3F414E',
    fontWeight: '600',
    width: 50,
  },
  progressBarWrapper: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
    position: 'relative',
  },
  progressBar: {
    height: 5,
    backgroundColor: '#E2E3E9',
    borderRadius: 2.5,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  progressThumb: {
    position: 'absolute',
    top: '50%',
    width: 17,
    height: 17,
    borderRadius: 8.5,
    marginTop: -8.5,
    marginLeft: -8.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 85,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
    color: '#fff',
  },
  navLabel: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  navIconActive: {
    backgroundColor: '#8E92BC',
    width: 65,
    height: 65,
    borderRadius: 32.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  navIconActiveText: {
    fontSize: 30,
  },
});