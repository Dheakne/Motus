import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PrivacyScreen({ navigation }) {
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
          <Text style={styles.headerTitle}>Política de Privacidade</Text>
          <View style={{ width: 60 }} />
        </View>
      </LinearGradient>

      <View style={styles.card}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <SectionTitle>1. Dados Coletados</SectionTitle>
          <SectionText>
            O Motus coleta os seguintes dados durante o cadastro e uso: nome completo, email, data de nascimento, número de telefone, progresso em exercícios semanais, histórico de áudios reproduzidos e informações de acesso (datas e horas de uso).
          </SectionText>

          <SectionTitle>2. Dados Sensíveis (Art. 11 LGPD)</SectionTitle>
          <SectionText>
            Você autoriza expressamente o tratamento de dados sensíveis relacionados a saúde mental, incluindo: informações sobre bem-estar, preferências de conteúdo de meditação e dados de progresso em exercícios de concentração. Esses dados são necessários para personalizar sua experiência no App.
          </SectionText>

          <SectionTitle>3. Finalidade do Tratamento</SectionTitle>
          <SectionText>
            Seus dados são utilizados para: (a) providenciar e melhorar o serviço; (b) personalizar conteúdo e recomendações; (c) enviar notificações sobre exercícios semanais; (d) analisar uso e tendências (de forma agregada e anônima); (e) cumprir obrigações legais.
          </SectionText>

          <SectionTitle>4. Compartilhamento de Dados</SectionTitle>
          <SectionText>
            Não compartilhamos seus dados pessoais com terceiros para fins comerciais. Dados podem ser compartilhados apenas com: (a) prestadores de serviço necessários para operação do App (hospedagem, análise); (b) autoridades competentes, quando legalmente obrigado; (c) com seu consentimento explícito.
          </SectionText>

          <SectionTitle>5. Armazenamento e Segurança</SectionTitle>
          <SectionText>
            Seus dados são armazenados em servidores criptografados no Brasil. Implementamos medidas de segurança padrão da indústria, incluindo criptografia em trânsito e em repouso. No entanto, nenhum sistema é 100% seguro — você utiliza o App por sua conta e risco.
          </SectionText>

          <SectionTitle>6. Seus Direitos (Art. 18 LGPD)</SectionTitle>
          <SectionText>
            Você tem o direito de: (a) acessar seus dados e receber uma cópia em formato estruturado (direito de portabilidade); (b) corrigir dados inexatos; (c) solicitar a exclusão de seus dados (direito ao esquecimento); (d) revogar consentimento a qualquer momento. Use as opções de exportação e exclusão dentro do seu perfil no App.
          </SectionText>

          <SectionTitle>7. Contato do Controlador</SectionTitle>
          <SectionText>
            Se você tiver dúvidas sobre nossa Política de Privacidade ou deseja exercer seus direitos, entre em contato conosco através do suporte no App ou envie um email com seu pedido. Responderemos em até 15 dias úteis.
          </SectionText>

          <SectionTitle>8. Modificações da Política</SectionTitle>
          <SectionText>
            Esta Política de Privacidade pode ser atualizada periodicamente. Mudanças significativas serão notificadas através do App. Sua continuação do uso após notificação implica aceitação das mudanças.
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
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Whyte-Bold",
    fontWeight: "700",
    color: "#FFFFFF",
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
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
  },
  sectionText: {
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#6E6E73",
    lineHeight: 22,
    marginBottom: 12,
  },
});
