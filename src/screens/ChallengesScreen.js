import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');

export default function ChallengesScreen({ navigation }) {
  const [challenge, setChallenge] = useState(null);
  const [userProgress, setUserProgress] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  });
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenge();
    loadUserProfile();
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

  async function loadChallenge() {
    try {
      // Buscar desafio ativo
      const { data } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('is_active', true)
        .single();
      
      if (data) {
        setChallenge(data);
        
        // Buscar progresso do usuário
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: progressData } = await supabase
            .from('user_challenge_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('challenge_id', data.id)
            .single();
          
          if (progressData) {
            setUserProgress({
              monday: progressData.monday,
              tuesday: progressData.tuesday,
              wednesday: progressData.wednesday,
              thursday: progressData.thursday,
              friday: progressData.friday,
              saturday: progressData.saturday,
              sunday: progressData.sunday,
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar desafio:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleDay(day) {
    try {
      const newProgress = { ...userProgress, [day]: !userProgress[day] };
      setUserProgress(newProgress);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !challenge) return;

      // Verificar se já existe progresso
      const { data: existing } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_id', challenge.id)
        .single();

      const totalCompleted = Object.values(newProgress).filter(Boolean).length;
      const totalPoints = totalCompleted * (challenge.points_per_day || 15);

      if (existing) {
        // Atualizar
        await supabase
          .from('user_challenge_progress')
          .update({
            ...newProgress,
            total_points: totalPoints
          })
          .eq('user_id', user.id)
          .eq('challenge_id', challenge.id);
      } else {
        // Criar novo
        await supabase
          .from('user_challenge_progress')
          .insert([{
            user_id: user.id,
            challenge_id: challenge.id,
            ...newProgress,
            total_points: totalPoints
          }]);
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
    }
  }

  function getChartData() {
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const values = [
      userProgress.monday ? 1 : 0,
      userProgress.tuesday ? 1 : 0,
      userProgress.wednesday ? 1 : 0,
      userProgress.thursday ? 1 : 0,
      userProgress.friday ? 1 : 0,
      userProgress.saturday ? 1 : 0,
      userProgress.sunday ? 1 : 0,
    ];

    return {
      labels: days,
      datasets: [{ data: values }]
    };
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8E97FD" />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhum desafio disponível no momento</Text>
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
        {/* Título da Aba */}
        <Text style={styles.pageTitle}>Observação da Mente</Text>

        {/* Descrição */}
        <Text style={styles.pageDescription}>
          Assim como jardineiros observam cada folha de suas plantas, você vai aprender a testemunhar sua mente com cuidado. A regra é a mesma, mas sua percepção se refinará a cada dia
        </Text>

        {/* Dia da Semana */}
        <Text style={styles.dayTitle}>Segunda - Feira</Text>

        {/* Nome do Desafio */}
        <Text style={styles.challengeName}>Ao comer, apenas coma</Text>

        {/* Descrição do Desafio */}
        <Text style={styles.challengeDescription}>
          Comer distraidamente é um hábito moderno tão arraigado que nem percebemos sua estranheza. Comemos correndo, mastigamos distraídos, engolimos sem sentir. E, no entanto, esse pequeno ritual diário, quando praticado com presença, pode se tornar um poderoso remédio para a ansiedade que tanto nos consome.
        </Text>

        {/* Informações Extras */}
        <Text style={styles.extraInfoTitle}>
          Em todas as refeições desta semana, coma a primeira mordida com extrema atenção.
        </Text>

        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Observe o alimento antes de levar à boca</Text>
          <Text style={styles.bulletItem}>• Sinta seu aroma primeiro</Text>
          <Text style={styles.bulletItem}>• Mastigue lentamente</Text>
          <Text style={styles.bulletItem}>• Note a textura e o sabor se transformando</Text>
        </View>

        {/* Descobertas */}
        <Text style={styles.discoveriesTitle}>Descobertas</Text>
        <Text style={styles.discoveriesIntro}>
          O comer em silêncio é um treino para a vida. Quem pratica descobre que:
        </Text>

        <View style={styles.discoveryCard}>
          <Text style={styles.discoveryItem}>
            • A ansiedade não é um monstro incontrolável, mas uma onda que pode ser surfada com atenção
          </Text>
          <Text style={styles.discoveryItem}>
            • O "tédio" de uma refeição sem distrações muitas vezes revela-se como paz disfarçada
          </Text>
          <Text style={styles.discoveryItem}>
            • Pequenos momentos de presença (até mesmo com um simples biscoito) são como ilhas de sanidade em um mar de caos
          </Text>
        </View>

        {/* Acompanhamento Semanal */}
        <Text style={styles.weeklyTitle}>Acompanhamento semanal</Text>

        <View style={styles.weeklyChecklist}>
          {[
            { key: 'monday', label: 'Segunda - Feira' },
            { key: 'tuesday', label: 'Terça - Feira' },
            { key: 'wednesday', label: 'Quarta - Feira' },
            { key: 'thursday', label: 'Quinta - Feira' },
            { key: 'friday', label: 'Sexta - Feira' },
            { key: 'saturday', label: 'Sábado' },
            { key: 'sunday', label: 'Domingo' },
          ].map((day) => (
            <TouchableOpacity
              key={day.key}
              style={styles.checklistItem}
              onPress={() => toggleDay(day.key)}
            >
              <Text style={styles.checklistLabel}>{day.label}</Text>
              <View style={styles.checkbox}>
                {userProgress[day.key] && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Gráfico */}
        <Text style={styles.graphTitle}>Gráfico de Entradas Semanal</Text>

        <View style={styles.chartContainer}>
          <LineChart
            data={getChartData()}
            width={width - 48}
            height={200}
            chartConfig={{
              backgroundColor: '#E5E5F7',
              backgroundGradientFrom: '#E5E5F7',
              backgroundGradientTo: '#E5E5F7',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(93, 95, 239, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: '#5D5FEF'
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
        >
          <Text style={styles.navIcon}>⏰</Text>
          <Text style={styles.navLabelActive}>Desafios</Text>
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
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  emptyText: {
    fontSize: 16,
    color: '#A1A4B2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 120,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#B8B8D1',
    marginBottom: 16,
  },
  pageDescription: {
    fontSize: 14,
    color: '#3F414E',
    lineHeight: 22,
    marginBottom: 30,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B4C77E',
    marginBottom: 20,
  },
  challengeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3F414E',
    marginBottom: 12,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#3F414E',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'justify',
  },
  extraInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3F414E',
    marginBottom: 12,
  },
  bulletList: {
    backgroundColor: '#E5E5F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  bulletItem: {
    fontSize: 13,
    color: '#5D5FEF',
    marginBottom: 8,
    lineHeight: 20,
  },
  discoveriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B4C77E',
    marginBottom: 12,
  },
  discoveriesIntro: {
    fontSize: 14,
    color: '#3F414E',
    marginBottom: 12,
  },
  discoveryCard: {
    backgroundColor: '#E5E5F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  discoveryItem: {
    fontSize: 13,
    color: '#5D5FEF',
    marginBottom: 12,
    lineHeight: 20,
  },
  weeklyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B4C77E',
    marginBottom: 16,
  },
  weeklyChecklist: {
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
  },
  checklistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D0E8D0',
  },
  checklistLabel: {
    fontSize: 14,
    color: '#5F7D5F',
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#B4C77E',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkmark: {
    fontSize: 16,
    color: '#5F7D5F',
    fontWeight: 'bold',
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5D5FEF',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FDFCF6',
    paddingVertical: 12,
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
  },
  navLabel: {
    fontSize: 11,
    color: '#5A5A5A',
    fontWeight: '500',
  },
  navLabelActive: {
    fontSize: 11,
    color: '#3F414E',
    fontWeight: '600',
  },
  navIconActive: {
    backgroundColor: '#AF7842',
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