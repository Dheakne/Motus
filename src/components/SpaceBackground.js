/**
 * SpaceBackground.js — fundo espacial etéreo do Tutus (React Native)
 *
 * Recria, em componentes nativos:
 *   - Nebulosas coloridas com falloff suave (RadialGradient)
 *   - Faixa de "via láctea" + vinheta
 *   - Bokeh (orbes desfocados) subindo devagar
 *   - Campo de estrelas em 2 profundidades + brilhos de 4 pontas piscando
 *   - Tráfego espacial: planetas e foguetes cruzando a tela
 *
 * Deps: react-native-svg
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ---------- helper: looping 0–1 driver ----------
function useLoop(duration, delay = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(v, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [v, duration, delay]);
  return v;
}

// =========================================================
//   Nebula — base gradient + colored cloud glows
// =========================================================
export function Nebula() {
  // gentle drift on each cloud
  const d1 = useLoop(16000);
  const d2 = useLoop(20000);
  const d3 = useLoop(18000);

  const drift = (v, x, y) => ({
    transform: [
      { translateX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, x, 0] }) },
      { translateY: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, y, 0] }) },
    ],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* deep-space base */}
      <Svg style={StyleSheet.absoluteFill} width={SCREEN_W} height={SCREEN_H}>
        <Defs>
          <RadialGradient id="base" cx="50%" cy="30%" r="80%">
            <Stop offset="0" stopColor="#1a2350" />
            <Stop offset="0.35" stopColor="#131a44" />
            <Stop offset="0.62" stopColor="#0c0e2c" />
            <Stop offset="1" stopColor="#07071a" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={SCREEN_W} height={SCREEN_H} fill="#0a0c24" />
        <Rect x="0" y="0" width={SCREEN_W} height={SCREEN_H} fill="url(#base)" />
      </Svg>

      {/* colored cloud glows — soft radial falloff reads as "blur" */}
      <Animated.View style={[styles.neb, { left: -SCREEN_W * 0.12, top: SCREEN_H * 0.06 }, drift(d1, 36, 28)]}>
        <Cloud size={360} color="31,199,122" />
      </Animated.View>
      <Animated.View style={[styles.neb, { right: -SCREEN_W * 0.18, top: SCREEN_H * 0.14 }, drift(d2, -40, 30)]}>
        <Cloud size={440} color="155,77,255" />
      </Animated.View>
      <Animated.View style={[styles.neb, { left: SCREEN_W * 0.08, bottom: -SCREEN_H * 0.06 }, drift(d3, 28, -34)]}>
        <Cloud size={420} color="42,68,224" />
      </Animated.View>
      <Animated.View style={[styles.neb, { right: SCREEN_W * 0.04, bottom: SCREEN_H * 0.05 }, drift(d1, -30, 20)]}>
        <Cloud size={300} color="214,77,170" />
      </Animated.View>

      {/* vignette */}
      <Svg style={StyleSheet.absoluteFill} width={SCREEN_W} height={SCREEN_H}>
        <Defs>
          <RadialGradient id="vig" cx="50%" cy="45%" r="75%">
            <Stop offset="0.55" stopColor="#03040c" stopOpacity="0" />
            <Stop offset="1" stopColor="#03040c" stopOpacity="0.55" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={SCREEN_W} height={SCREEN_H} fill="url(#vig)" />
      </Svg>
    </View>
  );
}

function Cloud({ size, color }) {
  const id = `cloud${color.replace(/,/g, '')}${size}`;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={`rgb(${color})`} stopOpacity="0.55" />
          <Stop offset="0.45" stopColor={`rgb(${color})`} stopOpacity="0.22" />
          <Stop offset="0.7" stopColor={`rgb(${color})`} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

// =========================================================
//   Starfield — two depths + 4-point sparkles
// =========================================================
export function Starfield() {
  const { far, near, sparkles } = useMemo(() => {
    const far = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * SCREEN_W,
      y: Math.random() * SCREEN_H,
      r: 0.5 + Math.random() * 0.9,
      dur: 2200 + Math.random() * 3000,
      delay: Math.random() * 4000,
    }));
    const near = Array.from({ length: 13 }).map(() => ({
      x: Math.random() * SCREEN_W,
      y: Math.random() * SCREEN_H,
      r: 1.2 + Math.random() * 1.4,
      dur: 1800 + Math.random() * 2600,
      delay: Math.random() * 4000,
    }));
    const sparkles = Array.from({ length: 4 }).map(() => ({
      x: SCREEN_W * (0.06 + Math.random() * 0.88),
      y: SCREEN_H * (0.04 + Math.random() * 0.6),
      s: 12 + Math.random() * 12,
      dur: 2600 + Math.random() * 2400,
      delay: Math.random() * 4000,
      hue: [180, 210, 270, 45][Math.floor(Math.random() * 4)],
    }));
    return { far, near, sparkles };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {far.map((s, i) => (
        <Twinkle key={`f${i}`} {...s} color="#dfe7ff" minOp={0.1} maxOp={0.7} />
      ))}
      {near.map((s, i) => (
        <Twinkle key={`n${i}`} {...s} color="#ffffff" minOp={0.3} maxOp={1} />
      ))}
      {sparkles.map((s, i) => (
        <SparkleStar key={`s${i}`} {...s} />
      ))}
    </View>
  );
}

function Twinkle({ x, y, r, dur, delay, color, minOp, maxOp }) {
  const t = useLoop(dur, delay);
  const opacity = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [minOp, maxOp, minOp] });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: r,
        backgroundColor: color,
        opacity,
      }}
    />
  );
}

function SparkleStar({ x, y, s, dur, delay, hue }) {
  const t = useLoop(dur, delay);
  const scale = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.3] });
  const opacity = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 1, 0.2] });
  const half = s / 2;
  const thin = s / 12;
  return (
    <Animated.View
      style={{ position: 'absolute', left: x - half, top: y - half, opacity, transform: [{ scale }] }}
    >
      <Svg width={s} height={s}>
        <Path
          d={`M${half} 0 C ${half + thin} ${half - thin}, ${half + thin} ${half - thin}, ${s} ${half}
              C ${half + thin} ${half + thin}, ${half + thin} ${half + thin}, ${half} ${s}
              C ${half - thin} ${half + thin}, ${half - thin} ${half + thin}, 0 ${half}
              C ${half - thin} ${half - thin}, ${half - thin} ${half - thin}, ${half} 0 Z`}
          fill={`hsl(${hue}, 90%, 85%)`}
        />
      </Svg>
    </Animated.View>
  );
}

// =========================================================
//   Bokeh — soft orbs rising upward
// =========================================================
export function Bokeh() {
  const orbs = useMemo(
    () =>
      Array.from({ length: 9 }).map((_, i) => ({
        x: Math.random() * SCREEN_W,
        size: 26 + Math.random() * 70,
        delay: Math.random() * 12000,
        dur: 14000 + Math.random() * 12000,
        hue: [160, 210, 260, 285][i % 4],
        op: 0.12 + Math.random() * 0.18,
      })),
    [],
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {orbs.map((o, i) => (
        <RisingOrb key={i} {...o} />
      ))}
    </View>
  );
}

function RisingOrb({ x, size, delay, dur, hue, op }) {
  const t = useLoop(dur, delay);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -(SCREEN_H * 1.3)] });
  const opacity = t.interpolate({ inputRange: [0, 0.12, 0.88, 1], outputRange: [0, 1, 1, 0] });
  const id = `bok${hue}${Math.round(size)}`;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        bottom: -size,
        width: size,
        height: size,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="35%" cy="35%" r="50%">
            <Stop offset="0" stopColor={`hsl(${hue},85%,80%)`} stopOpacity={`${op}`} />
            <Stop offset="0.45" stopColor={`hsl(${hue},80%,65%)`} stopOpacity={`${op * 0.5}`} />
            <Stop offset="0.7" stopColor={`hsl(${hue},80%,65%)`} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

// =========================================================
//   Space traffic — planets & rockets crossing behind Tutus
// =========================================================
export function Traffic() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Crosser top={0.2} dur={30000} delay={-4000} dir="LR" opacity={0.85}>
        <Planet size={46} hue={268} ring />
      </Crosser>
      <Crosser top={0.58} dur={38000} delay={-16000} dir="RL" opacity={0.8}>
        <Planet size={30} hue={160} />
      </Crosser>
      <Crosser top={0.44} dur={46000} delay={-28000} dir="LR" opacity={0.7}>
        <Planet size={22} hue={210} />
      </Crosser>
      <Crosser top={0.36} dur={12000} delay={-3000} dir="LR" opacity={0.95}>
        <Rocket size={42} />
      </Crosser>
      <Crosser top={0.66} dur={15000} delay={-9000} dir="RL" opacity={0.95}>
        <Rocket size={34} flip />
      </Crosser>
    </View>
  );
}

function Crosser({ top, dur, delay, dir, opacity, children }) {
  const t = useLoop(dur, delay);
  const from = -150;
  const to = SCREEN_W + 60;
  const translateX = t.interpolate({
    inputRange: [0, 1],
    outputRange: dir === 'LR' ? [from, to] : [to, from],
  });
  // gentle vertical bob layered on top
  const bob = useLoop(5000);
  const translateY = bob.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -10, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: SCREEN_H * top,
        left: 0,
        opacity,
        transform: [{ translateX }, { translateY }],
      }}
    >
      {children}
    </Animated.View>
  );
}

function Planet({ size, hue, ring = false }) {
  const id = `pl${hue}${Math.round(size)}`;
  const vb = 100;
  return (
    <Svg width={size * 1.6} height={size * 1.6} viewBox={`-30 -20 ${vb + 60} ${vb + 40}`}>
      <Defs>
        <RadialGradient id={id} cx="36%" cy="30%" r="85%">
          <Stop offset="0" stopColor={`hsl(${hue},90%,78%)`} />
          <Stop offset="0.6" stopColor={`hsl(${hue},75%,55%)`} />
          <Stop offset="1" stopColor={`hsl(${hue},70%,30%)`} />
        </RadialGradient>
      </Defs>
      {ring && (
        <Ellipse
          cx="50" cy="52" rx="58" ry="16" fill="none"
          stroke={`hsl(${hue},80%,75%)`} strokeWidth="3.5" opacity="0.55"
          transform="rotate(-18 50 52)"
        />
      )}
      <Circle cx="50" cy="50" r="34" fill={`url(#${id})`} />
      <Ellipse cx="40" cy="38" rx="9" ry="4" fill="#fff" opacity="0.25" />
      {ring && (
        <Path
          d="M 12 56 A 58 16 -18 0 0 88 44" fill="none"
          stroke={`hsl(${hue},85%,82%)`} strokeWidth="3.5" opacity="0.7"
          transform="rotate(-18 50 52)"
        />
      )}
    </Svg>
  );
}

function Rocket({ size, flip = false }) {
  const flame = useLoop(400);
  // flicker by toggling opacity quickly
  const flameOp = flame.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1, 0.6] });
  return (
    <Animated.View style={{ transform: [{ scaleX: flip ? -1 : 1 }, { rotate: '-7deg' }] }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <SvgLinearGradient id="rkBody" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#eef2ff" />
            <Stop offset="1" stopColor="#b9c4e8" />
          </SvgLinearGradient>
          <SvgLinearGradient id="rkFlame" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#9b4dff" />
            <Stop offset="0.5" stopColor="#2a44e0" />
            <Stop offset="1" stopColor="#1fc77a" />
          </SvgLinearGradient>
        </Defs>
        <Path d="M 22 50 C 4 44, 4 56, 22 50 Z" fill="url(#rkFlame)" />
        <Path d="M 22 40 L 60 40 C 78 40, 90 50, 90 50 C 90 50, 78 60, 60 60 L 22 60 C 18 56, 18 44, 22 40 Z" fill="url(#rkBody)" />
        <Path d="M 60 40 C 78 40, 90 50, 90 50 C 90 50, 78 60, 60 60 Z" fill="#ff8a6b" />
        <Path d="M 26 40 L 18 28 L 34 40 Z" fill="#7a8ad1" />
        <Path d="M 26 60 L 18 72 L 34 60 Z" fill="#7a8ad1" />
        <Circle cx="48" cy="50" r="6.5" fill="#2a3566" />
        <Circle cx="48" cy="50" r="6.5" fill="none" stroke="#fff" strokeWidth="2" opacity="0.8" />
        <Circle cx="45.5" cy="47.5" r="2" fill="#bfe0ff" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  neb: { position: 'absolute' },
});
