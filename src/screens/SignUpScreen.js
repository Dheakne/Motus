import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../services/supabase';

// Função para converter data DD/MM/YYYY para YYYY-MM-DD
function convertToSQLDate(dateString) {
  if (!dateString || dateString.length < 8) return null;
  
  // Remove caracteres especiais
  const cleaned = dateString.replace(/\D/g, '');
  
  // Espera formato DDMMYYYY
  if (cleaned.length === 8) {
    const day = cleaned.substring(0, 2);
    const month = cleaned.substring(2, 4);
    const year = cleaned.substring(4, 8);
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!name || !lastName || !email || !password) {
      Alert.alert('Erro', 'Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);
    
    // Criar conta
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      Alert.alert('Erro no cadastro', authError.message);
      return;
    }

    // Criar perfil
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: authData.user.id,
            display_name: name,
            full_name: `${name} ${lastName}`,
            phone: phone,
            birth_date: birthDate ? convertToSQLDate(birthDate) : null,
            level: 1,
            total_points: 0,
            has_seen_tutus: false,
          }
        ]);

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
      }
    }

    setLoading(false);
    Alert.alert(
      'Sucesso!', 
      'Conta criada com sucesso!',
      [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Inscrever-se</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>
              Já tem uma conta? <Text style={styles.loginLinkBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Sobrenome</Text>
          <TextInput
            style={styles.input}
            placeholder="Sobrenome(s)"
            value={lastName}
            onChangeText={setLastName}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="seuemail@gmail.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Data de nascimento</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/AAAA"
              value={birthDate}
              onChangeText={setBirthDate}
            />

          <Text style={styles.label}>Número de celular</Text>
          <TextInput
            style={styles.input}
            placeholder="(00) 90000-0000"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Definir palavra-passe</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />



          <TouchableOpacity 
            style={styles.registerButton}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>
              {loading ? 'Criando conta...' : 'Registrar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    marginBottom: 20,
  },
  backArrow: {
    fontSize: 28,
    color: '#2C2C2C',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#9B87D9',
    marginBottom: 10,
  },
  loginLink: {
    fontSize: 14,
    color: '#666',
  },
  loginLinkBold: {
    color: '#9B87D9',
    fontWeight: 'bold',
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    fontSize: 16,
    color: '#2C2C2C',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  calendarIcon: {
    fontSize: 18,
    marginLeft: -40,
  },
  eyeIcon: {
    padding: 5,
    marginLeft: -35,
  },
  registerButton: {
    backgroundColor: '#C8B896',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});