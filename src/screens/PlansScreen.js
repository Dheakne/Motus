import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  cancelSubscription,
  createCheckout,
  getPremiumStatus,
  resumeSubscription,
} from "../api/billingApi";

const PLANS = {
  monthly: { label: "Mensal", price: "R$13", period: "/mês" },
  annual: { label: "Anual", price: "R$104,90", period: "/ano" },
};
const ANNUAL_DISCOUNT = "33%";
const ANNUAL_PER_MONTH = "R$8,74";

const BACKGROUND_RATIO = 884 / 430;

const ANDROID_TEXT_NUDGE = Platform.OS === "android" ? { transform: [{ translateY: 2 }] } : {};

const DECOR_ITEMS = [
  { source: require("../../assets/images/plans/nebula.png"), x: 7, y: 82, w: 135, h: 142, dx: 0, dy: -8, rotate: 6, duration: 7000, delay: 0 },
  { source: require("../../assets/images/plans/tutu.png"), x: 134, y: 137, w: 152, h: 208, dx: 0, dy: -12, rotate: 4, duration: 4500, delay: 0 },
  { source: require("../../assets/images/plans/planet-red.png"), x: 299, y: 182, w: 52, h: 52, dx: 6, dy: -6, rotate: 0, duration: 6000, delay: 400 },
  { source: require("../../assets/images/plans/orb-right.png"), x: 302, y: 257, w: 125, h: 125, dx: -8, dy: 10, rotate: 0, duration: 8000, delay: 800 },
  { source: require("../../assets/images/plans/orb-left.png"), x: 4, y: 307, w: 93, h: 93, dx: 8, dy: -8, rotate: 0, duration: 7000, delay: 200 },
  { source: require("../../assets/images/plans/orb-bottom.png"), x: 0, y: 683, w: 125, h: 125, dx: 10, dy: -6, rotate: 0, duration: 9000, delay: 600 },
  { source: require("../../assets/images/plans/earth.png"), x: 311, y: 693, w: 112, h: 111, dx: -6, dy: -10, rotate: 8, duration: 8500, delay: 300 },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatDateBR(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function PlansScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [plan, setPlan] = useState("monthly");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const decorWidth = Math.min(width, 480);
  const scale = decorWidth / 430;
  const contentWidth = width - 48;

  const loadStatus = useCallback(async () => {
    try {
      const data = await getPremiumStatus();
      setStatus(data);
      return data;
    } catch (err) {
      console.error("[PlansScreen] status error:", err);
      setStatus({ is_premium: false, subscription: null });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [loadStatus])
  );

  async function waitForPremium() {
    for (let attempt = 0; attempt < 5; attempt++) {
      const data = await loadStatus();
      if (data?.is_premium) return true;
      await wait(1500);
    }
    return false;
  }

  async function handleSubscribe() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const returnUrl = Linking.createURL("premium");
      const { url } = await createCheckout(plan, returnUrl);

      if (Platform.OS === "web") {
        window.location.href = url;
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(url, returnUrl);
      const canceled = result.type === "success" && result.url?.includes("checkout=canceled");
      if (canceled) return;

      const activated = await waitForPremium();
      if (activated) {
        Alert.alert("Bem-vindo ao Premium! 🎉", "Todos os exercícios e áudios foram liberados.");
      } else if (result.type === "success") {
        Alert.alert(
          "Pagamento em processamento",
          "Seu pagamento foi recebido. O Premium será liberado em instantes."
        );
      }
    } catch (err) {
      if (err?.error === "ALREADY_PREMIUM") {
        await loadStatus();
        return;
      }
      console.error("[PlansScreen] checkout error:", err);
      Alert.alert("Erro", err?.message || "Não foi possível iniciar o pagamento. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function confirmCancel() {
    Alert.alert(
      "Cancelar assinatura?",
      "Você continua Premium até o fim do período já pago. Depois disso, o conteúdo premium é bloqueado.",
      [
        { text: "Manter assinatura", style: "cancel" },
        { text: "Cancelar", style: "destructive", onPress: () => changeSubscription(cancelSubscription) },
      ]
    );
  }

  function confirmResume() {
    const endDate = formatDateBR(status?.subscription?.current_period_end);
    Alert.alert(
      "Reativar assinatura?",
      `Nenhuma cobrança será feita agora. Sua assinatura volta a renovar automaticamente em ${endDate}.`,
      [
        { text: "Agora não", style: "cancel" },
        { text: "Reativar", onPress: () => changeSubscription(resumeSubscription) },
      ]
    );
  }

  async function changeSubscription(action) {
    setUpdating(true);
    try {
      const changed = await action();
      const fresh = await loadStatus();
      if (fresh?.subscription && fresh.subscription.cancel_at_period_end !== changed.cancel_at_period_end) {
        setStatus({ ...fresh, subscription: { ...fresh.subscription, ...changed } });
      }
    } catch (err) {
      console.error("[PlansScreen] subscription update error:", err);
      Alert.alert("Erro", err?.message || "Não foi possível atualizar a assinatura. Tente novamente.");
    } finally {
      setUpdating(false);
    }
  }

  const isPremium = !!status?.is_premium;
  const subscription = status?.subscription;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#13E698", "#74B8DE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      />

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.closeIcon}
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityLabel="Fechar"
        >
          <Ionicons name="close" size={26} color="#1C1C1E" />
        </TouchableOpacity>

        <GradientTitle text={isPremium ? "Você é Premium" : "Comece Sua Jornada"} />
        <Text selectable={false} style={styles.subtitle}>
          {isPremium ? "Obrigado por apoiar o Motus" : "Escolha o plano ideal para você"}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#1066E7" style={{ marginTop: 48 }} />
        ) : (
          <>
            {!isPremium && (
              <View style={styles.freeCard}>
                <Text selectable={false} style={styles.cardTitle}>Gratuito</Text>
                <Text selectable={false} style={styles.freePrice}>R$0</Text>
                <TouchableOpacity style={styles.freeButton} onPress={() => navigation.goBack()}>
                  <Text selectable={false} style={styles.freeButtonText}>Continuar Grátis</Text>
                </TouchableOpacity>
                <Feature text="Exercícios semanais limitados" />
                <Feature text="Áudios limitados" />
              </View>
            )}

            <View style={styles.decorWrapper}>
              <View
                pointerEvents="none"
                style={[
                  styles.decor,
                  {
                    width: decorWidth,
                    height: decorWidth * BACKGROUND_RATIO,
                    top: (isPremium ? -40 : -115) * scale,
                    left: (contentWidth - decorWidth) / 2,
                  },
                ]}
              >
                {DECOR_ITEMS.map((item, index) => (
                  <FloatingDecor key={index} item={item} scale={scale} />
                ))}
              </View>
              <View style={{ height: 235 * scale }} />

              {isPremium ? (
                <PremiumActiveCard
                  subscription={subscription}
                  updating={updating}
                  onCancel={confirmCancel}
                  onResume={confirmResume}
                />
              ) : (
                <View style={styles.premiumCard}>
                  <Text selectable={false} style={styles.cardTitle}>Premium</Text>

                  <View style={styles.toggle}>
                    {Object.entries(PLANS).map(([key, item]) => (
                      <TouchableOpacity
                        key={key}
                        style={[styles.toggleOption, plan === key && styles.toggleOptionActive]}
                        onPress={() => setPlan(key)}
                      >
                        <Text
                          selectable={false}
                          style={[styles.toggleText, plan === key && styles.toggleTextActive]}
                        >
                          {item.label}
                          {key === "annual" ? ` -${ANNUAL_DISCOUNT}` : ""}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.priceRow}>
                    <Text selectable={false} style={styles.premiumPrice}>{PLANS[plan].price}</Text>
                    <Text selectable={false} style={styles.pricePeriod}>{PLANS[plan].period}</Text>
                  </View>
                  <Text selectable={false} style={styles.priceNote}>
                    {plan === "monthly"
                      ? `ou ${PLANS.annual.price}/ano (economize ${ANNUAL_DISCOUNT})`
                      : `equivale a ${ANNUAL_PER_MONTH}/mês (economize ${ANNUAL_DISCOUNT})`}
                  </Text>

                  <TouchableOpacity
                    onPress={handleSubscribe}
                    disabled={submitting}
                    activeOpacity={0.85}
                    style={styles.subscribeTouch}
                  >
                    <LinearGradient
                      colors={["#2A7DF5", "#0B4FD6"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.subscribeButton}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text selectable={false} style={styles.subscribeText}>Assinar Premium</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <Text selectable={false} style={styles.smallNote}>Cancele quando quiser</Text>

                  <Feature text="Biblioteca completa de áudios" />
                  <Feature text="Atividades semanais ilimitadas" />
                </View>
              )}
            </View>

            {!isPremium && (
              <View style={styles.ctaSection}>
                <Text selectable={false} style={styles.ctaTitle}>Comece hoje!</Text>
                <Text selectable={false} style={styles.ctaText}>
                  Desbloqueie todos os exercícios e áudios e descubra a diferença que alguns
                  minutos por dia podem fazer.
                </Text>
                <TouchableOpacity
                  onPress={handleSubscribe}
                  disabled={submitting}
                  activeOpacity={0.85}
                  style={styles.ctaTouch}
                >
                  <LinearGradient
                    colors={["#13C27A", "#1066E7", "#9B5CF6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaButton}
                  >
                    <Text selectable={false} style={styles.subscribeText}>Começar Agora</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.testNotice}>
                  <Ionicons name="card-outline" size={18} color="#6E6E73" />
                  <Text selectable={false} style={styles.testNoticeText}>
                    Ambiente de teste: nenhuma cobrança real. Use o cartão 4242 4242 4242 4242,
                    qualquer data futura e qualquer CVC.
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PremiumActiveCard({ subscription, updating, onCancel, onResume }) {
  const isStripe = subscription?.source === "stripe";
  const planLabel = subscription?.plan ? PLANS[subscription.plan]?.label : null;
  const endDate = formatDateBR(subscription?.current_period_end);

  let detail = "Liberado pela equipe Motus";
  if (isStripe) {
    detail = subscription.cancel_at_period_end
      ? `Cancelado. Premium ativo até ${endDate}`
      : `Renova em ${endDate}`;
  }

  return (
    <View style={styles.premiumCard}>
      <View style={styles.activeBadge}>
        <Ionicons name="checkmark-circle" size={18} color="#13C27A" />
        <Text selectable={false} style={styles.activeBadgeText}>Premium ativo</Text>
      </View>
      {planLabel ? (
        <Text selectable={false} style={styles.cardTitle}>Plano {planLabel}</Text>
      ) : null}
      <Text selectable={false} style={styles.priceNote}>{detail}</Text>

      <Feature text="Biblioteca completa de áudios" />
      <Feature text="Atividades semanais ilimitadas" />

      {isStripe && subscription.cancel_at_period_end ? (
        <>
          <TouchableOpacity
            onPress={onResume}
            disabled={updating}
            activeOpacity={0.85}
            style={[styles.subscribeTouch, styles.resumeTouch]}
          >
            <LinearGradient
              colors={["#2A7DF5", "#0B4FD6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeButton}
            >
              {updating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text selectable={false} style={styles.subscribeText}>Reativar assinatura</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <Text selectable={false} style={styles.smallNote}>
            Nenhuma cobrança agora. A próxima será em {endDate}.
          </Text>
        </>
      ) : null}

      {isStripe && !subscription.cancel_at_period_end ? (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={updating}>
          {updating ? (
            <ActivityIndicator color="#FF4444" />
          ) : (
            <Text selectable={false} style={styles.cancelButtonText}>Cancelar assinatura</Text>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function useLoop(duration, delay = 0) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const half = (toValue) =>
      Animated.timing(value, {
        toValue,
        duration: duration / 2,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(Animated.sequence([half(1), half(0)])),
    ]);
    anim.start();
    return () => anim.stop();
  }, [value, duration, delay]);
  return value;
}

function FloatingDecor({ item, scale }) {
  const t = useLoop(item.duration, item.delay);
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, item.dx * scale] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, item.dy * scale] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${item.rotate}deg`] });

  return (
    <Animated.Image
      source={item.source}
      resizeMode="contain"
      style={{
        position: "absolute",
        left: item.x * scale,
        top: item.y * scale,
        width: item.w * scale,
        height: item.h * scale,
        transform: [{ translateX }, { translateY }, { rotate }],
      }}
    />
  );
}

function GradientTitle({ text }) {
  return (
    <MaskedView maskElement={<Text style={styles.title}>{text}</Text>}>
      <LinearGradient
        colors={["#13C27A", "#1066E7", "#9B5CF6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[styles.title, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

function Feature({ text }) {
  return (
    <View style={styles.feature}>
      <Ionicons name="checkmark" size={18} color="#1066E7" />
      <Text selectable={false} style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#13E698" },
  gradient: { height: 40 },
  sheet: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  sheetContent: { paddingHorizontal: 24, paddingTop: 24, alignItems: "center" },
  closeIcon: { alignSelf: "flex-end", padding: 4, marginBottom: 16, cursor: "default" },
  title: {
    fontSize: 30,
    fontFamily: "Whyte-Bold",
    textAlign: "center",
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Whyte-Regular",
    color: "#4A4A55",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 36,
    lineHeight: 20,
  },
  freeCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#E5E5EA",
    padding: 24,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: "Whyte-Bold",
    color: "#1C1C1E",
    lineHeight: 28,
  },
  freePrice: {
    fontSize: 46,
    fontFamily: "Whyte-Bold",
    color: "#1C1C1E",
    marginVertical: 12,
    lineHeight: 54,
  },
  freeButton: {
    width: "100%",
    backgroundColor: "#F0F1F5",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 20,
    cursor: "default",
  },
  freeButtonText: {
    fontSize: 16,
    fontFamily: "Whyte-Medium",
    color: "#1C1C1E",
    lineHeight: 20,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    marginTop: 12,
  },
  featureText: {
    fontSize: 15,
    fontFamily: "Whyte-Regular",
    color: "#4A4A55",
    marginLeft: 10,
    lineHeight: 20,
  },
  decorWrapper: { width: "100%", alignItems: "center" },
  decor: { position: "absolute" },
  premiumCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#1066E7",
    padding: 24,
    alignItems: "center",
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: "#F0F1F5",
    borderRadius: 20,
    padding: 4,
    marginTop: 14,
  },
  toggleOption: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    cursor: "default",
  },
  toggleOptionActive: { backgroundColor: "#1066E7" },
  toggleText: {
    fontSize: 14,
    fontFamily: "Whyte-Medium",
    color: "#6E6E73",
    lineHeight: 18,
  },
  toggleTextActive: { color: "#FFFFFF" },
  priceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 12 },
  premiumPrice: {
    fontSize: 46,
    fontFamily: "Whyte-Bold",
    color: "#1C1C1E",
    lineHeight: 54,
  },
  pricePeriod: {
    fontSize: 18,
    fontFamily: "Whyte-Regular",
    color: "#6E6E73",
    marginBottom: 8,
    marginLeft: 2,
    lineHeight: 22,
  },
  priceNote: {
    fontSize: 14,
    fontFamily: "Whyte-Regular",
    color: "#6E6E73",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  subscribeTouch: { width: "100%", cursor: "default" },
  resumeTouch: { marginTop: 24 },
  subscribeButton: {
    borderRadius: 25,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  subscribeText: {
    fontSize: 16,
    fontFamily: "Whyte-Bold",
    color: "#FFFFFF",
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: "center",
    ...ANDROID_TEXT_NUDGE,
  },
  smallNote: {
    fontSize: 12,
    fontFamily: "Whyte-Regular",
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 8,
    lineHeight: 16,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E7FBF2",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  activeBadgeText: {
    fontSize: 14,
    fontFamily: "Whyte-Medium",
    color: "#0E9A61",
    marginLeft: 6,
    lineHeight: 18,
    includeFontPadding: false,
    ...ANDROID_TEXT_NUDGE,
  },
  cancelButton: { marginTop: 24, paddingVertical: 10, cursor: "default" },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: "Whyte-Medium",
    color: "#FF4444",
    lineHeight: 18,
  },
  ctaSection: { width: "100%", maxWidth: 360, alignItems: "center", marginTop: 56 },
  ctaTitle: {
    fontSize: 28,
    fontFamily: "Whyte-Bold",
    color: "#1C1C1E",
    marginBottom: 12,
    lineHeight: 34,
  },
  ctaText: {
    fontSize: 15,
    fontFamily: "Whyte-Regular",
    color: "#4A4A55",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  ctaTouch: { width: "100%", cursor: "default" },
  ctaButton: { borderRadius: 30, paddingVertical: 18, alignItems: "center" },
  testNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0F1F5",
    borderRadius: 14,
    padding: 14,
    marginTop: 24,
  },
  testNoticeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Whyte-Regular",
    color: "#6E6E73",
    marginLeft: 8,
    lineHeight: 17,
  },
});
