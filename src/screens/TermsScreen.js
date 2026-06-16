/**
 * TermsScreen - exibe os termos de uso do app.
 */

import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TermsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#13E698", "#74B8DE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{"< Voltar"}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Termos de Uso</Text>
          <View style={{ width: 60 }} />
        </View>
      </LinearGradient>

      <View style={styles.card}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <SectionTitle>1. Objeto</SectionTitle>
          <SectionText>
            Os presentes Termos de Uso regulam o acesso e a utilização do aplicativo Motus (App), uma plataforma de bem-estar mental que oferece meditações guiadas, áudios para dormir, exercícios de concentração e registro de gratidão. O uso do App implica na aceitação plena destes Termos.
          </SectionText>

          <SectionTitle>2. Cadastro e Conta de Usuário</SectionTitle>
          <SectionText>
            Para utilizar o App, você deve criar uma conta fornecendo informações precisas e atualizadas. Você é responsável pela confidencialidade de sua senha e por todas as atividades realizadas em sua conta. Proibido compartilhar credenciais ou permitir acesso a terceiros.
          </SectionText>

          <SectionTitle>3. Uso do App</SectionTitle>
          <SectionText>
            Você concorda em utilizar o App apenas para fins pessoais e lícitos. É proibido: (a) reproduzir, distribuir ou comercializar conteúdo; (b) acessar dados de outros usuários; (c) prejudicar a operação ou segurança do App; (d) usar bots, scrapers ou ferramentas automatizadas.
          </SectionText>

          <SectionTitle>4. Dados Coletados</SectionTitle>
          <SectionText>
            O App coleta seu nome, email, data de nascimento, telefone, progresso em exercícios e histórico de áudios. Todos esses dados serão tratados conforme a Política de Privacidade e em conformidade com a LGPD.
          </SectionText>

          <SectionTitle>5. Responsabilidades</SectionTitle>
          <SectionText>
            O App é fornecido como está. Não garantimos que será livre de erros ou que funcionará ininterruptamente. O Motus não é substituto para aconselhamento profissional de saúde mental — em caso de crise, procure um profissional médico imediatamente.
          </SectionText>

          <SectionTitle>6. Propriedade Intelectual</SectionTitle>
          <SectionText>
            Todo conteúdo do App (textos, áudios, imagens, marcas) é propriedade do Motus ou de seus licenciadores. Você não pode copiar, modificar ou reproduzir sem autorização.
          </SectionText>

          <SectionTitle>7. Disposições Gerais</SectionTitle>
          <SectionText>
            Estes Termos são regidos pela Lei Brasileira. Qualquer disputa será resolvida nos tribunais competentes. O Motus pode modificar estes Termos a qualquer momento; mudanças serão notificadas no App. Sua continuação do uso implica aceitação.
          </SectionText>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function SectionText({ children }) {
  return <Text style={styles.sectionText}>{children}</Text>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#13E698",
  },
  gradient: {
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    width: "100%",
  },
  backText: {
    fontSize: 15,
    fontFamily: "Whyte-Medium",
    color: "#FFFFFF",
    fontWeight: "600",
    lineHeight: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Whyte-Bold",
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 20,

  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    marginBottom: -35,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Whyte-Bold",
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 10,
    marginTop: 16,
    lineHeight: 20,

  },
  sectionText: {
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#6E6E73",
    lineHeight: 22,
    marginBottom: 12,
    lineHeight: 20,

  },
});
