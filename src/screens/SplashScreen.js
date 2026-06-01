/**
 * motus — Splash Screen (React Native / Expo)
 *
 * Dependencies (install once):
 *   npx expo install react-native-svg expo-linear-gradient
 *
 * (If you're on bare RN: `yarn add react-native-svg react-native-linear-gradient`
 *  and swap the `expo-linear-gradient` import below for `react-native-linear-gradient`.)
 *
 * Usage:
 *   import Splash from './Splash';
 *   <Splash onDone={() => navigation.replace('Home')} duration={2800} />
 */

import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Path,
  RadialGradient,
  Stop
} from 'react-native-svg';
import { recoveryState } from '../navigation/AppNavigator';
import { supabase } from '../services/supabase';

// =========================================================
//   Palette
// =========================================================
const C = {
  c1: '#1fc77a',
  c2: '#2a44e0',
  c3: '#9b4dff',
  bg1: '#0b0e2a',
  bg2: '#131a4a',
  bg3: '#1b1240',
  text: '#ffffff',
  muted: 'rgba(255,255,255,0.7)',
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function Splash({
  appName = 'Motus',
  tagline = 'Pequenos passos, grandes jornadas',
  onDone,
  duration = 2800,
  navigation
}) {
  useEffect(() => {
    if (!onDone) return;
    const t = setTimeout(onDone, duration);

    return () => { clearTimeout(t) };
  }, [onDone, duration]);

  useEffect(() => {
    let cancelled = false;

    async function decideRoute() {
      if (recoveryState.active) {
        recoveryState.active = false;
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        navigation.replace(session ? 'Home' : 'Login');
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        if (!cancelled) navigation.replace('Login');
      }
    }

    const t = setTimeout(decideRoute, 2000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [navigation]);



  return (
    <View style={styles.root}>
      {/* Background gradient */}
      <LinearGradient
        colors={[C.bg1, C.bg2, C.bg3]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient blobs */}
      <Blob color={C.c1} size={320} left={-SCREEN_W * 0.2} top={SCREEN_H * 0.1} delay={0} />
      <Blob color={C.c3} size={360} left={SCREEN_W * 0.65} top={SCREEN_H * 0.3} delay={400} />
      <Blob color={C.c2} size={280} left={SCREEN_W * 0.2} top={SCREEN_H * 0.75} delay={800} />

      {/* Starfield */}
      <Starfield />

      {/* Orbital decorations */}
      <OrbitRing duration={60000}>
        <Floater dx={-130} dy={-180} delay={250}>
          <PurpleStar size={86} />
        </Floater>
        <Floater dx={150} dy={-150} delay={400}>
          <MarsPlanet size={62} />
        </Floater>
        <Floater dx={-160} dy={150} delay={550}>
          <Bubble size={70} hue={265} />
        </Floater>
        <Floater dx={155} dy={170} delay={700}>
          <EarthPlanet size={92} />
        </Floater>
      </OrbitRing>

      <OrbitRing duration={80000} reverse>
        <Floater dx={-50} dy={-220} delay={600}>
          <Flower size={52} />
        </Floater>
        <Floater dx={195} dy={20} delay={500}>
          <Bubble size={64} hue={275} />
        </Floater>
        <Floater dx={-200} dy={30} delay={800}>
          <Bubble size={50} hue={255} />
        </Floater>
      </OrbitRing>

      {/* Hero wordmark */}
      <View style={styles.hero} pointerEvents="none">
        <HeroGlow />
        <Wordmark text={appName} />
        <Tagline text={tagline} />
      </View>

      {/* Loader dots */}
      <LoaderDots />
    </View>
  );
}

// =========================================================
//   Background blobs
// =========================================================
function Blob({
  color,
  size,
  left,
  top,
  delay,
}) {
  const t = useLoop(8000, delay);
  const tx = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 25, 0] });
  const ty = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 25, 0] });
  return (
    <Animated.View
      style={[
        styles.blob,
        {
          width: size,
          height: size,
          left,
          top,
          backgroundColor: color,
          opacity: 0.25,
          transform: [{ translateX: tx }, { translateY: ty }],
        },
      ]}
    />
  );
}

// =========================================================
//   Starfield — twinkles
// =========================================================
function Starfield() {
  const stars = useMemo(
    () =>
      Array.from({ length: 80 }).map(() => ({
        x: Math.random() * SCREEN_W,
        y: Math.random() * SCREEN_H,
        r: 0.5 + Math.random() * 1.4,
        delay: Math.random() * 3000,
        dur: 1600 + Math.random() * 2400,
      })),
    [],
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {stars.map((s, i) => (
        <Star key={i} {...s} />
      ))}
    </View>
  );
}

function Star({ x, y, r, delay, dur }) {
  const t = useLoop(dur, delay);
  const opacity = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.9, 0.15] });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: r,
        backgroundColor: '#fff',
        opacity,
      }}
    />
  );
}

// =========================================================
//   Orbital decoration system
// =========================================================
function OrbitRing({
  duration,
  reverse = false,
  children,
}) {
  const t = useLoop(duration);
  const rotate = t.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ['0deg', '-360deg'] : ['0deg', '360deg'],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.center,
        { transform: [{ rotate }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function Floater({
  dx,
  dy,
  delay,
  children,
}) {
  // Pop-in
  const pop = useRef(new Animated.Value(0)).current;
  // Continuous float
  const bobDurationRef = useRef(4500 + Math.random() * 1500);
  const bob = useLoop(bobDurationRef.current);

  useEffect(() => {
    Animated.timing(pop, {
      toValue: 1,
      duration: 900,
      delay,
      easing: Easing.bezier(0.34, 1.6, 0.5, 1),
      useNativeDriver: true,
    }).start();
  }, [pop, delay]);

  const scale = pop.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0.2, 1.12, 1],
  });
  const popRotate = pop.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: ['-12deg', '4deg', '0deg'],
  });
  const ty = bob.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -12, 0] });
  const bobRotate = bob.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '4deg', '0deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        opacity: pop,
        transform: [
          { translateX: dx },
          { translateY: Animated.add(new Animated.Value(dy), ty) },
          { scale },
          { rotate: popRotate },
          { rotate: bobRotate },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

// =========================================================
//   Hero glow halo (behind text)
// =========================================================
function HeroGlow() {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;
  const pulse = useLoop(4000);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 1000, delay: 400, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 1000, delay: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, scale]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.12, 1] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.heroGlow,
        { opacity: fade, transform: [{ scale: Animated.multiply(scale, pulseScale) }] },
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={C.c2} stopOpacity={0.55} />
            <Stop offset="0.4" stopColor={C.c3} stopOpacity={0.33} />
            <Stop offset="1" stopColor="#000" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx="100" cy="100" rx="100" ry="65" fill="url(#glow)" />
      </Svg>
    </Animated.View>
  );
}

// =========================================================
//   Wordmark — each letter staggered with gradient fill (via MaskedView)
// =========================================================
function Wordmark({ text }) {
  return (
    <View style={styles.wordmark}>
      {Array.from(text).map((ch, i) => (
        <Letter key={i} ch={ch === ' ' ? '\u00A0' : ch} delay={400 + i * 90} />
      ))}
    </View>
  );
}

function Letter({ ch, delay }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 700,
      delay,
      easing: Easing.bezier(0.34, 1.6, 0.5, 1),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const ty = anim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [40, -6, 0],
  });
  const scale = anim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.4, 1.08, 1],
  });
  const rotate = anim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: ['-8deg', '2deg', '0deg'],
  });
  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: ty }, { scale }, { rotate }],
      }}

    >
      <MaskedView
        maskElement={
          <Text style={styles.letterText}>{ch}</Text>
        }
      >
        <LinearGradient
          colors={[C.c1, C.c2, C.c3]}
          locations={[0, 0.55, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          <Text style={[styles.letterText, { opacity: 0 }]}>{ch}</Text>
        </LinearGradient>
      </MaskedView>
    </Animated.View>
  );
}

// =========================================================
//   Tagline — fades up after letters land
// =========================================================
function Tagline({ text }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 700, delay: 1400,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [anim]);
  const ty = anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  return (
    <Animated.Text
      style={[styles.tagline, { opacity: anim, transform: [{ translateY: ty }] }]}
    >
      {text}
    </Animated.Text>
  );
}

// =========================================================
//   Loader dots
// =========================================================
function LoaderDots() {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, delay: 1500, useNativeDriver: true }).start();
  }, [fade]);
  return (
    <Animated.View style={[styles.loader, { opacity: fade }]} pointerEvents="none">
      <Dot color={C.c1} delay={0} />
      <Dot color={C.c2} delay={150} />
      <Dot color={C.c3} delay={300} />
    </Animated.View>
  );
}

function Dot({ color, delay }) {
  const t = useLoop(1200, delay);
  const ty = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -8, 0] });
  const op = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] });
  return (
    <Animated.View
      style={{
        width: 8, height: 8, borderRadius: 4,
        marginHorizontal: 4,
        backgroundColor: color,
        opacity: op,
        transform: [{ translateY: ty }],
      }}
    />
  );
}

// =========================================================
//   SVG icons
// =========================================================
function PurpleStar({ size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="starG" cx="0.4" cy="0.35" r="0.7">
          <Stop offset="0" stopColor="#a87bff" />
          <Stop offset="0.6" stopColor="#6a37d8" />
          <Stop offset="1" stopColor="#3b1a8a" />
        </RadialGradient>
      </Defs>
      <Path
        d="M50 6 L62 36 L94 40 L70 60 L78 92 L50 74 L22 92 L30 60 L6 40 L38 36 Z"
        fill="url(#starG)"
      />
      <Circle cx="40" cy="42" r="3" fill="#ffe14a" />
      <Circle cx="62" cy="55" r="2.5" fill="#ffe14a" />
      <Circle cx="50" cy="68" r="2" fill="#ffe14a" />
      <Circle cx="34" cy="60" r="1.6" fill="#ffe14a" />
    </Svg>
  );
}

function MarsPlanet({ size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="marsG" cx="0.35" cy="0.3" r="0.8">
          <Stop offset="0" stopColor="#ff9a7a" />
          <Stop offset="0.6" stopColor="#e35a4a" />
          <Stop offset="1" stopColor="#7a1c1c" />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="42" fill="url(#marsG)" />
      <Ellipse cx="40" cy="40" rx="10" ry="5" fill="#7a1c1c" opacity="0.4" />
      <Ellipse cx="62" cy="58" rx="8" ry="4" fill="#7a1c1c" opacity="0.35" />
      <Ellipse cx="52" cy="70" rx="6" ry="3" fill="#7a1c1c" opacity="0.3" />
    </Svg>
  );
}

function EarthPlanet({ size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="earthG" cx="0.35" cy="0.3" r="0.85">
          <Stop offset="0" stopColor="#7ad7ff" />
          <Stop offset="0.7" stopColor="#2a8fe0" />
          <Stop offset="1" stopColor="#0e2a6b" />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="44" fill="url(#earthG)" />
      <Path
        d="M22 48 Q34 38 44 46 Q52 54 64 48 Q76 46 80 56 Q72 64 60 62 Q48 70 36 64 Q26 60 22 48 Z"
        fill="#3aa55a"
      />
      <Path
        d="M30 70 Q40 66 50 72 Q58 78 66 74"
        stroke="#3aa55a"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <Ellipse cx="38" cy="34" rx="14" ry="4" fill="#ffffff" opacity="0.35" />
    </Svg>
  );
}

function Flower({ size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M50 60 L50 92" stroke="#3aa55a" strokeWidth="4" strokeLinecap="round" />
      <Path d="M50 78 Q42 74 38 80" stroke="#3aa55a" strokeWidth="3" fill="none" strokeLinecap="round" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <Ellipse
          key={a}
          cx="50"
          cy="32"
          rx="9"
          ry="14"
          fill="#ffd84a"
          transform={`rotate(${a} 50 50)`}
        />
      ))}
      <Circle cx="50" cy="50" r="8" fill="#f29a1f" />
    </Svg>
  );
}

function Bubble({ size, hue }) {
  const id = `bub${hue}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id={id} cx="0.35" cy="0.3" r="0.8">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <Stop offset="0.5" stopColor={`hsl(${hue}, 80%, 80%)`} stopOpacity="0.7" />
          <Stop offset="1" stopColor={`hsl(${hue}, 70%, 55%)`} stopOpacity="0.85" />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="44" fill={`url(#${id})`} />
      <Ellipse cx="36" cy="32" rx="10" ry="6" fill="#ffffff" opacity="0.7" />
    </Svg>
  );
}

// =========================================================
//   useLoop — single-shot animated value that ping-pongs 0→1
// =========================================================
function useLoop(duration, delay = 0) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(value, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [value, duration, delay]);
  return value;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  heroGlow: {
    position: 'absolute',
    width: 480,
    height: 320,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  letterText: {
    fontFamily: 'Whyte-Bold',
    fontWeight: '800',
    fontSize: 110,
    lineHeight: 110,
    letterSpacing: -5.5,
    color: '#fff',
    backgroundColor: 'transparent',
  },
  tagline: {
    color: C.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  loader: {
    position: 'absolute',
    bottom: 110,
    flexDirection: 'row',
  },
});
