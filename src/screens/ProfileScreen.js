import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../services/supabase';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  // Recarregar perfil quando a tela ganhar foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
    });
    return unsubscribe;
  }, [navigation]);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Erro', error.message);
            } else {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }
        }
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8E97FD" />
      </View>
    );
  }

  async function handleChangePhoto() {
    Alert.alert(
      'Foto de Perfil',
      'Escolha uma opção',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Trocar Foto', 
          onPress: () => Alert.alert('Em desenvolvimento', 'Funcionalidade de upload de foto será implementada em breve')
        },
        profile?.avatar_url && { 
          text: 'Remover Foto', 
          style: 'destructive',
          onPress: async () => {
            // Remover foto do perfil
            await supabase
              .from('user_profiles')
              .update({ avatar_url: null })
              .eq('user_id', user.id);
            loadProfile();
        }
      }
    ].filter(Boolean)
  );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header com foto e info do usuário */}
        <View style={styles.header}>
          {/* Foto de perfil */}
          <View style={styles.avatarContainer}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleChangePhoto}
          >
            {profile?.avatar_url ? (
              <Image 
                source={{ uri: profile.avatar_url }} 
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            {/* Badge/ícone de edição */}
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
          </View>

          {/* Nome e username */}
          <Text style={styles.displayName}>
            {profile?.display_name || 'Usuário'}
          </Text>
          <Text style={styles.username}>
            @{profile?.display_name?.toLowerCase().replace(/\s/g, '') || 'usuario'}31
          </Text>

          {/* Botão Editar */}
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Seção: Conta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>👤</Text>
            </View>
            <Text style={styles.menuText}>Editar Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert('Notificações', 'Em desenvolvimento')}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>🔔</Text>
            </View>
            <Text style={styles.menuText}>Notificações</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert('Privacidade', 'Em desenvolvimento')}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>🔒</Text>
            </View>
            <Text style={styles.menuText}>Privacidade</Text>
          </TouchableOpacity>
        </View>

        {/* Seção: Cache & celular */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cache & celular</Text>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert('Liberar espaço', 'Em desenvolvimento')}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>🗑️</Text>
            </View>
            <Text style={styles.menuText}>Liberar espaço</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert('Data Saver', 'Em desenvolvimento')}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>💾</Text>
            </View>
            <Text style={styles.menuText}>Data Saver</Text>
          </TouchableOpacity>
        </View>

        {/* Seção: Ações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações</Text>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert('Reportar problema', 'Em desenvolvimento')}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>🚩</Text>
            </View>
            <Text style={styles.menuText}>Reportar um problema</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleLogout}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>🚪</Text>
            </View>
            <Text style={[styles.menuText, styles.logoutText]}>Sair</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
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
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabelActive}>
            {profile?.display_name || 'Amanda'}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#8E97FD',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C8A882',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FAFAFA',
  },
  editBadgeIcon: {
    fontSize: 14,
  },
  displayName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#B4C77E',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#A1A4B2',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#C8A882',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3F414E',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuIconText: {
    fontSize: 18,
  },
  menuText: {
    fontSize: 15,
    color: '#3F414E',
    fontWeight: '500',
  },
  logoutText: {
    color: '#FF4444',
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