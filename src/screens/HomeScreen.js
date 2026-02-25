import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../services/supabase';

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('order', { ascending: true });
      
      if (categoriesData) {
        setCategories(categoriesData);
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        let { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  // Função para pegar tempo estimado por categoria
  const getDuration = (title) => {
    const durations = {
      'Gratidão': '30 MIN',
      'Atenção Concentrada': '10 MIN',
      'Meditação': '30 MIN',
      'Reflexão': '20 MIN',
      'Descanso': '10 MIN',
    };
    return durations[title] || '';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B7355" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {userProfile?.display_name}</Text>
        <Text style={styles.subtitle}>
          Descubra a meditação e a atenção plena
        </Text>
      </View>

      {/* Grid de Categorias */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {categories.slice(0, 2).map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, { backgroundColor: category.color }]}
              onPress={() => {
                navigation.navigate('Category', { 
                  categoryId: category.id,
                  categoryTitle: category.title,
                  categoryColor: category.color
                });
              }}
            >
              <View style={styles.illustrationArea}>
                <Text style={styles.illustrationPlaceholder}>{category.icon_emoji}</Text>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardInfo}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categorySubtitle}>Áudios</Text>
                </View>

                <View style={styles.cardFooter}>
                  {getDuration(category.title) && (
                    <Text style={styles.duration}>{getDuration(category.title)}</Text>
                  )}
                  <TouchableOpacity style={styles.startButton}>
                    <Text style={styles.startButtonText}>Começar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {categories[2] && (
            <TouchableOpacity
              style={[styles.categoryCardWide, { backgroundColor: categories[2].color }]}
              onPress={() => {
                navigation.navigate('Category', { 
                  categoryId: categories[2].id,
                  categoryTitle: categories[2].title,
                  categoryColor: categories[2].color
                });
              }}
            >
              <View style={styles.cardContentWide}>
                <View style={styles.cardInfoWide}>
                  <Text style={styles.categoryTitleWide}>{categories[2].title}</Text>
                  <Text style={styles.categorySubtitleWide}>Áudios</Text>
                </View>

                {getDuration(categories[2].title) && (
                  <Text style={styles.durationWide}>{getDuration(categories[2].title)}</Text>
                )}
              </View>

              <View style={styles.illustrationAreaWide}>
                <Text style={styles.illustrationPlaceholderSmall}>{categories[2].icon_emoji}</Text>
                <TouchableOpacity style={styles.startButtonWide}>
                  <Text style={styles.startButtonText}>Começar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}

          {categories.slice(3, 5).map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, { backgroundColor: category.color }]}
              onPress={() => {
                navigation.navigate('Category', { 
                  categoryId: category.id,
                  categoryTitle: category.title,
                  categoryColor: category.color
                });
              }}
            >
              <View style={styles.illustrationArea}>
                <Text style={styles.illustrationPlaceholder}>{category.icon_emoji}</Text>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardInfo}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categorySubtitle}>Áudios</Text>
                </View>

                <View style={styles.cardFooter}>
                  {getDuration(category.title) && (
                    <Text style={styles.duration}>{getDuration(category.title)}</Text>
                  )}
                  <TouchableOpacity style={styles.startButton}>
                    <Text style={styles.startButtonText}>Começar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {categories[5] && (
            <TouchableOpacity
              style={[styles.categoryCardFull, { backgroundColor: categories[5].color }]}
              onPress={() => navigation.navigate('Challenges')}
            >
              <View style={styles.cardContentWide}>
                <Text style={styles.categoryTitleWide}>{categories[5].title}</Text>
                <Text style={styles.descriptionWide}>
                  Que tal treinar sua mente com pequenos exercícios?{'\n\n'}
                  A cada semana, um novo exercício prático para cultivar atenção plena no dia a dia.
                </Text>
              </View>

              <View style={styles.illustrationAreaWide}>
                <Text style={styles.illustrationPlaceholderSmall}>{categories[5].icon_emoji}</Text>
                <TouchableOpacity style={styles.startButtonWide}>
                  <Text style={styles.startButtonText}>Começar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Challenges')}
        >
          <Text style={styles.navIcon}>⏰</Text>
          <Text style={styles.navLabel}>Desafios</Text>
        </TouchableOpacity>

        <View style={styles.navItemCenter}>
          <View style={styles.navIconActive}>
            <Text style={styles.navIconActiveText}>🏠</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Amanda</Text>
        </TouchableOpacity>
      </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Challenges')}
          >
            <Text style={styles.navIcon}>⏰</Text>
            <Text style={styles.navLabel}>Desafios</Text>
          </TouchableOpacity>

          <View style={styles.navItemCenter}>
            <View style={styles.navIconActive}>
              <Text style={styles.navIconActiveText}>🏠</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.navIcon}>👤</Text>
            <Text style={styles.navLabel}>
              {userProfile?.display_name}
            </Text>
          </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '400',
    color: '#B8B8B8',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#2C2C2C',
    fontWeight: '600',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    borderRadius: 24,
    marginBottom: 14,
    overflow: 'hidden',
    minHeight: 220,
  },
  illustrationArea: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  illustrationPlaceholder: {
    fontSize: 60,
  },
  illustrationPlaceholderSmall: {
    fontSize: 50,
    marginBottom: 15,
  },
  cardContent: {
    padding: 16,
    paddingTop: 8,
  },
  cardInfo: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duration: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    opacity: 0.9,
  },
  startButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryCardWide: {
    width: '100%',
    borderRadius: 24,
    marginBottom: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 160,
  },
  categoryCardFull: {
    width: '100%',
    borderRadius: 24,
    marginBottom: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 180,
  },
  illustrationAreaWide: {
    width: '35%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  cardContentWide: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardInfoWide: {
    marginBottom: 12,
  },
  categoryTitleWide: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  categorySubtitleWide: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
  descriptionWide: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.95,
    lineHeight: 18,
    marginBottom: 12,
  },
  durationWide: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    opacity: 0.9,
  },
  startButtonWide: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 18,
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