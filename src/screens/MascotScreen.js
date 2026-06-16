/**
 * MascotScreen - onboarding animado do mascote Tutus.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Nebula, Bokeh, Starfield, Traffic } from '../components/SpaceBackground';
import { supabase } from '../services/supabase';

const MASCOT = require('../../assets/images/tutus-astronaut.png');

// Fonte Whyte já carregada no projeto (AppNavigator via useFonts).
const FONT = 'Whyte-Medium';

const SCRIPT = [
  { text: 'Olá! Eu sou o Tutus, o seu parceiro aqui no motus.' },
  { text: 'Vou te acompanhar nessa jornada de bem-estar mental.' },
  { text: 'Vamos respirar, relaxar e crescer juntos, no seu tempo.' },
  { text: 'Pronto pra começar essa jornada comigo?', cta: true },
];

export default function MascotScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [typingDone, setTypingDone] = useState(false);
  const [hop, setHop] = useState(0);

  const cur = SCRIPT[step];
  const isLast = step === SCRIPT.length - 1;

  // ----- entrada -----
  const mascotIn = useRef(new Animated.Value(0)).current;
  const bubbleIn = useRef(new Animated.Value(0)).current;

  // Marca o onboarding como visto e segue para a lista de exercícios.
  async function handleDone() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_profiles')
          .update({ has_seen_tutus: true })
          .eq('user_id', user.id);
      }
    } catch (e) {
      console.error('Erro ao marcar has_seen_tutus:', e);
    } finally {
      navigation.replace('ExerciseList');
    }
  }

  useEffect(() => {
    Animated.timing(mascotIn, {
      toValue: 1,
      duration: 900,
      delay: 200,
      easing: Easing.bezier(0.34, 1.55, 0.45, 1),
      useNativeDriver: true,
    }).start();
  }, [mascotIn]);

  // ----- balão reaparece a cada passo + pulinho do mascote -----
  useEffect(() => {
    setTypingDone(false);
    setHop((h) => h + 1);
    bubbleIn.setValue(0);
    Animated.timing(bubbleIn, {
      toValue: 1,
      duration: 550,
      easing: Easing.bezier(0.34, 1.6, 0.5, 1),
      useNativeDriver: true,
    }).start();
  }, [step, bubbleIn]);

  const advance = useCallback(() => {
    if (!typingDone) {
      setTypingDone(true);
      return;
    }
    if (isLast) {
      handleDone();
      return;
    }
    setStep((s) => Math.min(s + 1, SCRIPT.length - 1));
  }, [typingDone, isLast]);

  return (
    <Pressable style={styles.root} onPress={cur.cta ? undefined : advance}>
      {/* Camadas de fundo */}
      <Nebula />
      <Bokeh />
      <Traffic />
      <Starfield />
      <CenterGlow />

      {/* Botão pular */}
      {!isLast && (
        <Pressable
          style={[styles.skip, { top: insets.top + 18 }]}
          onPress={() => setStep(SCRIPT.length - 1)}
          hitSlop={10}
        >
          <Text style={[styles.skipText, FONT ? { fontFamily: FONT } : null]}>Pular</Text>
        </Pressable>
      )}

      {/* Palco: balão + mascote */}
      <View style={styles.stage} pointerEvents="box-none">
        <SpeechBubble anim={bubbleIn}>
          <Typewriter
            key={step}
            text={cur.text}
            forceComplete={typingDone}
            onDone={() => setTypingDone(true)}
          />
        </SpeechBubble>

        <Mascot enterAnim={mascotIn} hopKey={hop} />
      </View>

      {/* Rodapé: indicadores + botão */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 36 }]} pointerEvents="box-none">
        <View style={styles.dots}>
          {SCRIPT.map((_, i) => (
            <Dot key={i} active={i === step} done={i < step} />
          ))}
        </View>

        {isLast ? (
          <CtaButton visible={typingDone} onPress={handleDone} />
        ) : (
          <Pressable
            style={({ pressed }) => [styles.next, pressed && { transform: [{ scale: 0.96 }] }]}
            onPress={advance}
          >
            <Text style={[styles.nextText, FONT ? { fontFamily: FONT } : null]}>
              {typingDone ? 'Continuar' : 'Pular fala'}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

// =========================================================
//   Brilho central atrás do mascote
// =========================================================
function CenterGlow() {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ).start();
  }, [t]);
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        alignSelf: 'center',
        top: '36%',
        width: 360,
        height: 300,
        opacity,
        transform: [{ scale }],
      }}
    >
      <Svg width={360} height={300}>
        <Defs>
          <RadialGradient id="cg" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#5078ff" stopOpacity="0.4" />
            <Stop offset="0.42" stopColor="#9b4dff" stopOpacity="0.24" />
            <Stop offset="0.72" stopColor="#9b4dff" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={180} cy={150} r={150} fill="url(#cg)" />
      </Svg>
    </Animated.View>
  );
}

// =========================================================
//   Mascote — entrada com pop + balanço contínuo + pulinho a cada passo
// =========================================================
function Mascot({ enterAnim, hopKey }) {
  const bob = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const aura = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(aura, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(aura, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ).start();
  }, [bob, aura]);

  // Pula sempre que hopKey muda
  useEffect(() => {
    hop.setValue(0);
    Animated.timing(hop, {
      toValue: 1,
      duration: 600,
      easing: Easing.bezier(0.34, 1.56, 0.5, 1),
      useNativeDriver: true,
    }).start();
  }, [hopKey, hop]);

  const enterTY = enterAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [40, -8, 0] });
  const enterScale = enterAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 1.06, 1] });
  const bobTY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const bobRot = bob.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-1.5deg'] });
  const hopTY = hop.interpolate({ inputRange: [0, 0.35, 0.7, 1], outputRange: [0, -18, 0, 0] });

  const auraScale = aura.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const auraOp = aura.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });

  return (
    <Animated.View
      style={{
        width: 230,
        height: 264,
        opacity: enterAnim,
        transform: [{ translateY: enterTY }, { scale: enterScale }],
      }}
    >
      {/* aura */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          alignSelf: 'center',
          top: '46%',
          marginTop: -120,
          width: 240,
          height: 240,
          opacity: auraOp,
          transform: [{ scale: auraScale }],
        }}
      >
        <Svg width={240} height={240}>
          <Defs>
            <RadialGradient id="aura" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#78aaff" stopOpacity="0.5" />
              <Stop offset="0.45" stopColor="#9b4dff" stopOpacity="0.28" />
              <Stop offset="0.7" stopColor="#9b4dff" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={120} cy={120} r={120} fill="url(#aura)" />
        </Svg>
      </Animated.View>

      {/* wrapper do balanço + pulinho */}
      <Animated.View style={{ flex: 1, transform: [{ translateY: Animated.add(bobTY, hopTY) }, { rotate: bobRot }] }}>
        <Image source={MASCOT} style={styles.mascotImg} resizeMode="contain" />
      </Animated.View>
    </Animated.View>
  );
}

// =========================================================
//   Balão de fala — vidro fosco
// =========================================================
function SpeechBubble({ anim, children }) {
  const ty = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: ty }, { scale }], marginBottom: 30 }}>
      <BlurView intensity={28} tint="dark" style={styles.bubble}>
        {children}
      </BlurView>
      {/* rabinho do balão */}
      <View style={styles.tail} />
    </Animated.View>
  );
}

// =========================================================
//   Efeito de máquina de escrever
// =========================================================
function Typewriter({ text, forceComplete, onDone, speed = 32 }) {
  const [shown, setShown] = useState('');
  const idx = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (forceComplete) {
      setShown(text);
      return;
    }
  }, [forceComplete, text]);

  useEffect(() => {
    setShown('');
    idx.current = 0;
    const chars = Array.from(text);
    let cancelled = false;
    let timer;
    const tick = () => {
      if (cancelled) return;
      idx.current += 1;
      setShown(chars.slice(0, idx.current).join(''));
      if (idx.current >= chars.length) {
        doneRef.current();
        return;
      }
      const last = chars[idx.current - 1];
      const extra = /[.,!?]/.test(last) ? 220 : 0;
      timer = setTimeout(tick, speed + extra);
    };
    timer = setTimeout(tick, speed);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, speed]);

  const display = forceComplete ? text : shown;
  return (
    <Text style={[styles.bubbleText, FONT ? { fontFamily: FONT } : null]}>
      {display}
      {!forceComplete && display.length < text.length ? (
        <Text style={styles.caret}>|</Text>
      ) : null}
    </Text>
  );
}

// =========================================================
//   Indicador de progresso (ponto)
// =========================================================
function Dot({ active, done }) {
  const w = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(w, { toValue: active ? 1 : 0, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  }, [active, w]);
  const width = w.interpolate({ inputRange: [0, 1], outputRange: [8, 26] });
  return (
    <Animated.View
      style={{
        width,
        height: 8,
        borderRadius: 99,
        backgroundColor: active ? '#2a44e0' : done ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)',
        overflow: 'hidden',
      }}
    >
      {active && (
        <LinearGradient
          colors={['#1fc77a', '#2a44e0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
    </Animated.View>
  );
}

// =========================================================
//   Botão de ação (CTA)
// =========================================================
function CtaButton({ visible, onPress }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.timing(a, {
        toValue: 1,
        duration: 600,
        easing: Easing.bezier(0.34, 1.6, 0.5, 1),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, a]);
  const ty = a.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: ty }, { scale }] }} pointerEvents={visible ? 'auto' : 'none'}>
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { transform: [{ scale: 0.96 }] }}>
        <LinearGradient
          colors={['#1fc77a', '#2a44e0', '#9b4dff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cta}
        >
          <Text style={[styles.ctaText, FONT ? { fontFamily: FONT } : null]}>Vamos começar!</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// =========================================================
//   Estilos
// =========================================================
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05060f',
    overflow: 'hidden',
  },
  stage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  skip: {
    position: 'absolute',
    right: 22,
    zIndex: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  skipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '600',
  },
  bubble: {
    maxWidth: 320,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  tail: {
    position: 'absolute',
    bottom: -9,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(120,130,170,0.28)',
  },
  bubbleText: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 27,
    letterSpacing: -0.2,
  },
  caret: {
    color: '#9ec5ff',
    fontWeight: '700',
  },
  mascotImg: {
    width: '100%',
    height: '100%',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 20,
    zIndex: 3,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  next: {
    width: 300,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 16,
    borderRadius: 20,
  },
  nextText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 31,
    fontWeight: '600',
  },
  cta: {
    width: 300,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    shadowColor: '#2a44e0',
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  ctaText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 31,
    fontWeight: '700',
  },
});
