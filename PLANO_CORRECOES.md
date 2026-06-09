# PLANO DE CORREÇÕES — MOTUS

> **Versão 1.0** · 30/05/2026 · Baseado em auditoria completa do código-fonte
> **Status:** Documentação pronta para implementação
> **Equipe:** Carlos, Letícia, Sofia

---

## SUMÁRIO

1. [Check diário não reflete em tempo real na Home](#problema-1)
2. [Player de áudio em segundo plano](#problema-2)
3. [Dashboard Admin (tela web)](#problema-3)
4. [Responsividade no celular físico](#problema-4)
5. [Mapeamento completo de bugs](#problema-5)
6. [App não abre no celular (Expo)](#problema-6)

---

## PROBLEMA 1 — Check Diário Não Reflete em Tempo Real na Home

### ✅ Causa Raiz Identificada

**Arquivo:** `src/hooks/useWeeklyChallenge.js` + `src/screens/HomeScreen.js` + `src/screens/ChallengesScreen.js`

`HomeScreen` e `ChallengesScreen` cada uma monta um `<WeeklyProgressCard />`, que internamente
chama `useWeeklyChallenge()`. Isso cria **duas instâncias completamente independentes** do hook,
cada uma com seu próprio estado e sua própria cópia dos dados buscados no mount.

Não existe:
- `React.createContext` ou `Context.Provider` no projeto
- `useFocusEffect` ou `navigation.addListener` em nenhuma das telas
- Event bus ou pub/sub entre telas

Quando o usuário marca o dia em `ChallengesScreen`, o optimistic update (`setProgress(...)`)
atualiza apenas a instância daquele hook. Ao navegar de volta para `HomeScreen`, a instância
do hook lá permanece com os dados do mount inicial — nunca refaz o fetch.

### 🔧 Arquivo a Modificar

- `src/screens/HomeScreen.js`

### 📋 Passos de Correção

**Passo 1:** Importar `useFocusEffect` e `useCallback` de `@react-navigation/native` (já instalado no projeto)

**Passo 2:** Adicionar estado `cardKey` para controlar remontagem do card

**Passo 3:** Usar `useFocusEffect` para incrementar `cardKey` cada vez que a HomeScreen ganha foco

**Passo 4:** Passar `key={cardKey}` para `WeeklyProgressCard` — o React desmonta e remonta o componente, forçando o hook a refazer o fetch

```javascript
// src/screens/HomeScreen.js — adicionar nos imports:
import { useFocusEffect } from '@react-navigation/native';
import { useState, useCallback } from 'react'; // se useCallback não estiver importado

// Dentro do componente HomeScreen, após os states existentes:
const [cardKey, setCardKey] = useState(0);

useFocusEffect(
  useCallback(() => {
    setCardKey((k) => k + 1);
  }, [])
);

// No JSX, alterar de:
<WeeklyProgressCard readOnly />
// Para:
<WeeklyProgressCard key={cardKey} readOnly />
```

### ⏱ Estimativa de Tempo: 20 minutos

### 👤 Responsável: Carlos

---

## PROBLEMA 2 — Player de Áudio em Segundo Plano

### ✅ Causa Raiz Identificada

**Dois problemas independentes que somam o sintoma:**

#### Problema 2A — Stale Closure no Cleanup
**Arquivo:** `src/screens/AudioPlayerScreen.js`, linhas 31-39

```javascript
// CÓDIGO ATUAL (com bug):
const [sound, setSound] = useState(null);

useEffect(() => {
  setupAudio();
  return () => {
    if (sound) {          // ← `sound` SEMPRE é null aqui!
      sound.unloadAsync();
    }
  };
}, []); // ← closure captura o valor inicial `null`
```

O `useEffect` com `[]` cria o closure uma única vez no mount. Naquele momento, `sound` é `null`.
Quando o componente desmonta, o cleanup executa, mas `sound` dentro do closure permanece `null`.
**Resultado:** áudio nunca é descarregado (memory leak + continua tocando).

#### Problema 2B — Configurações ausentes no app.json

Ausências confirmadas:
- `UIBackgroundModes: ["audio"]` no `ios.infoPlist` → iOS interrompe áudio ao bloquear
- Plugin `expo-av` não declarado em `plugins` → sem configuração nativa no prebuild
- `bundleIdentifier` (iOS) e `package` (Android) ausentes → builds falham
- `android.permissions` ausentes → Android pode bloquear audio em background

### 🔧 Arquivos a Modificar

- `src/screens/AudioPlayerScreen.js`
- `app.json`

### 📋 Passos de Correção

#### Fix 2A — Corrigir stale closure com useRef

```javascript
// src/screens/AudioPlayerScreen.js — no topo do componente:
import { useRef } from 'react'; // adicionar se não estiver

const soundRef = useRef(null);

// Em loadAndPlayAudio, após criar o sound:
const { sound: newSound } = await Audio.Sound.createAsync(
  { uri: session.audio_url },
  { shouldPlay: true, volume },
  onPlaybackStatusUpdate
);
soundRef.current = newSound; // ← ADICIONAR
setSound(newSound);

// No useEffect de setup, alterar o cleanup:
useEffect(() => {
  setupAudio();

  return () => {
    if (soundRef.current) {
      soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };
}, []);
```

#### Fix 2B — Atualizar app.json

```json
{
  "expo": {
    "name": "Motus",
    "slug": "motus",
    "version": "1.0.0",
    "scheme": "motusapp",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.motus.app",
      "infoPlist": {
        "UIBackgroundModes": ["audio"]
      }
    },
    "android": {
      "package": "com.motus.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": true,
      "permissions": [
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK"
      ]
    },
    "plugins": [
      "expo-splash-screen",
      "expo-font",
      "expo-web-browser",
      ["expo-av", { "microphonePermission": false }]
    ]
  }
}
```

#### Fix 2C — Remover console.log de debug

```javascript
// AudioPlayerScreen.js linha 65 — remover:
console.log("Carregando áudio de:", session.audio_url);
```

#### Testes no dispositivo físico
1. Aplicar mudanças
2. `npx expo prebuild --clean` — regenera arquivos nativos com nova config
3. `npx expo run:ios` ou `npx expo run:android`
4. Iniciar uma sessão de áudio
5. Bloquear o celular — áudio deve continuar
6. Abrir outro app — áudio deve continuar
7. Voltar para o app — progresso deve estar correto

### ⏱ Estimativa de Tempo: 1 hora (código: 30min, testes: 30min)

### 👤 Responsável: Carlos (código) + Letícia (testes no dispositivo)

---

## PROBLEMA 3 — Dashboard Admin (Tela Web)

### ✅ Especificação

Criar arquivo HTML standalone `admin-dashboard.html` na raiz do projeto.
Abre diretamente no browser do computador do admin — sem servidor, sem build.

Dados exibidos:
- Cards: total de usuários, total de reports, exercícios iniciados, mais escolhido
- Tabela de reports: email, tipo, assunto, descrição, data
- Ranking de exercícios: quais challenge_id aparecem mais em user_challenge_progress

### 🔧 Arquivo a Criar

- `admin-dashboard.html` (raiz do projeto)

### 📋 Código Completo

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Motus — Admin Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f0f1a; color: #e2e8f0; padding: 24px; }
    h1 { font-size: 1.8rem; margin-bottom: 24px; color: #a78bfa; }
    h2 { font-size: 1.1rem; margin: 24px 0 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .card { background: #1e1e2e; border: 1px solid #2d2d42; border-radius: 12px; padding: 20px; }
    .card .value { font-size: 2.2rem; font-weight: bold; color: #a78bfa; }
    .card .label { font-size: 0.85rem; color: #64748b; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
    th { background: #2d2d42; padding: 12px 16px; text-align: left; font-size: 0.8rem; text-transform: uppercase; color: #94a3b8; }
    td { padding: 12px 16px; border-bottom: 1px solid #2d2d42; font-size: 0.9rem; max-width: 300px; }
    td.truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #252535; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
    .badge-bug { background: #3f1515; color: #f87171; }
    .badge-sugestao { background: #1a3f1a; color: #4ade80; }
    .badge-conteudo { background: #3f2d0a; color: #fbbf24; }
    .badge-outro { background: #1e293b; color: #94a3b8; }
    .loading { text-align: center; padding: 40px; color: #64748b; }
    .error { background: #3f1515; color: #f87171; padding: 12px 16px; border-radius: 8px; margin: 16px 0; }
    #config { background: #1e1e2e; border: 1px solid #2d2d42; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    #config input { width: 100%; padding: 8px 12px; background: #0f0f1a; border: 1px solid #2d2d42; border-radius: 8px; color: #e2e8f0; font-family: monospace; font-size: 0.85rem; margin-top: 8px; }
    #config label { font-size: 0.85rem; color: #94a3b8; }
    #btn-load { margin-top: 12px; padding: 10px 24px; background: #7c3aed; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }
    #btn-load:hover { background: #6d28d9; }
  </style>
</head>
<body>

<h1>Motus — Admin Dashboard</h1>

<div id="config">
  <label>Supabase URL</label>
  <input type="text" id="sb-url" placeholder="https://xxxx.supabase.co" />
  <label style="margin-top: 12px; display:block">Service Role Key <small style="color:#ef4444">(nunca compartilhar)</small></label>
  <input type="password" id="sb-key" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." />
  <button id="btn-load" onclick="loadDashboard()">Carregar Dashboard</button>
</div>

<div id="app" style="display:none">
  <div id="error-box" class="error" style="display:none"></div>
  <h2>Visão Geral</h2>
  <div class="cards">
    <div class="card"><div class="value" id="total-users">—</div><div class="label">Usuários cadastrados</div></div>
    <div class="card"><div class="value" id="total-reports">—</div><div class="label">Relatórios recebidos</div></div>
    <div class="card"><div class="value" id="total-exercises">—</div><div class="label">Exercícios iniciados</div></div>
    <div class="card"><div class="value" id="top-exercise">—</div><div class="label">Exercício mais escolhido</div></div>
  </div>

  <h2>Relatórios de Problemas</h2>
  <div id="reports-container"><p class="loading">Carregando...</p></div>

  <h2>Exercícios — Ranking de Adesão</h2>
  <div id="exercises-container"><p class="loading">Carregando...</p></div>
</div>

<script>
  const { createClient } = supabase;
  let sb = null;

  async function loadDashboard() {
    const url = document.getElementById('sb-url').value.trim();
    const key = document.getElementById('sb-key').value.trim();
    if (!url || !key) { alert('Preencha a URL e a Service Role Key.'); return; }
    sb = createClient(url, key);
    document.getElementById('app').style.display = 'block';
    showError(null);
    await Promise.all([loadMetrics(), loadReports(), loadExerciseRanking()]);
  }

  async function loadMetrics() {
    try {
      const { count: usersCount } = await sb.from('user_profiles').select('*', { count: 'exact', head: true });
      document.getElementById('total-users').textContent = usersCount ?? '—';
      const { count: reportsCount } = await sb.from('reports').select('*', { count: 'exact', head: true });
      document.getElementById('total-reports').textContent = reportsCount ?? '—';
      const { count: exCount } = await sb.from('user_challenge_progress').select('*', { count: 'exact', head: true });
      document.getElementById('total-exercises').textContent = exCount ?? '—';
      const { data: progressRows } = await sb.from('user_challenge_progress').select('challenge_id');
      if (progressRows && progressRows.length > 0) {
        const freq = {};
        progressRows.forEach(r => freq[r.challenge_id] = (freq[r.challenge_id] || 0) + 1);
        const topId = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
        const { data: challenge } = await sb.from('weekly_challenges').select('title').eq('id', topId).single();
        document.getElementById('top-exercise').textContent = challenge?.title ?? topId.slice(0, 8) + '...';
      }
    } catch (e) { showError('Erro ao carregar métricas: ' + e.message); }
  }

  async function loadReports() {
    const container = document.getElementById('reports-container');
    try {
      const { data, error } = await sb.from('reports').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      if (!data || data.length === 0) { container.innerHTML = '<p class="loading">Nenhum relatório encontrado.</p>'; return; }
      const badgeClass = { 'Bug ou erro': 'badge-bug', 'Sugestão de melhoria': 'badge-sugestao', 'Conteúdo inadequado': 'badge-conteudo', 'Outro': 'badge-outro' };
      const rows = data.map(r => `<tr><td>${r.email ?? '—'}</td><td><span class="badge ${badgeClass[r.type] || 'badge-outro'}">${r.type}</span></td><td class="truncate">${r.subject}</td><td class="truncate">${r.description}</td><td style="white-space:nowrap;color:#64748b">${new Date(r.created_at).toLocaleString('pt-BR')}</td></tr>`).join('');
      container.innerHTML = `<table><thead><tr><th>Email</th><th>Tipo</th><th>Assunto</th><th>Descrição</th><th>Data</th></tr></thead><tbody>${rows}</tbody></table>`;
    } catch (e) { container.innerHTML = `<div class="error">Erro: ${e.message}</div>`; }
  }

  async function loadExerciseRanking() {
    const container = document.getElementById('exercises-container');
    try {
      const { data: progress } = await sb.from('user_challenge_progress').select('challenge_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday');
      const { data: challenges } = await sb.from('weekly_challenges').select('id, title');
      if (!progress || !challenges) { container.innerHTML = '<p class="loading">Nenhum dado.</p>'; return; }
      const challengeMap = {}; challenges.forEach(c => challengeMap[c.id] = c.title);
      const stats = {}; progress.forEach(row => {
        const id = row.challenge_id;
        if (!stats[id]) stats[id] = { count: 0, days: 0 };
        stats[id].count++;
        ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].forEach(d => { if (row[d]) stats[id].days++; });
      });
      const sorted = Object.entries(stats).sort((a, b) => b[1].count - a[1].count);
      const rows = sorted.map(([id, s]) => `<tr><td>${challengeMap[id] ?? id.slice(0, 8) + '...'}</td><td style="text-align:center">${s.count}</td><td style="text-align:center">${s.days}</td></tr>`).join('');
      container.innerHTML = `<table><thead><tr><th>Exercício</th><th style="text-align:center">Usuários que iniciaram</th><th style="text-align:center">Dias concluídos (total)</th></tr></thead><tbody>${rows}</tbody></table>`;
    } catch (e) { container.innerHTML = `<div class="error">Erro: ${e.message}</div>`; }
  }

  function showError(msg) {
    const el = document.getElementById('error-box');
    if (msg) { el.textContent = msg; el.style.display = 'block'; } else { el.style.display = 'none'; }
  }
</script>
</body>
</html>
```

> ⚠️ **IMPORTANTE:** Nunca commitar com a Service Role Key preenchida. Adicionar ao `.gitignore` ou manter campos vazios.

### ⏱ Estimativa de Tempo: 1 hora

### 👤 Responsável: Sofia

---

## PROBLEMA 4 — Responsividade no Celular Físico

### ✅ Problemas Identificados por Tela

#### LoginScreen.js
| Problema | Correção |
|---|---|
| Sem `KeyboardAvoidingView` | Envolver com KAV + ScrollView |
| `height: 120` fixo | Usar relativo: `'30%'` |
| `marginTop: -30` fixo | Usar `useWindowDimensions` |

**Código:**
```jsx
import { KeyboardAvoidingView, ScrollView, Platform } from 'react-native';

<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
  <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
    {/* conteúdo */}
  </ScrollView>
</KeyboardAvoidingView>
```

#### SignUpScreen.js
| Problema | Correção |
|---|---|
| Sem `SafeAreaView` | Adicionar wrapper SafeAreaView |
| `paddingTop: 24` ignora barra | SafeAreaView resolve |
| `height: 50` fixo | Usar `minHeight: 50` |

#### EditProfileScreen.js
| Problema | Correção |
|---|---|
| Sem `KeyboardAvoidingView` | Envolver ScrollView com KAV |
| `setTimeout` sem cleanup | Usar `useRef` para timer |

**Código:**
```jsx
const successTimerRef = useRef(null);
successTimerRef.current = setTimeout(() => setSuccessMessage(''), 3000);

useEffect(() => {
  return () => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
  };
}, []);
```

#### ReportProblemScreen.js
| Problema | Correção |
|---|---|
| KAV `behavior={undefined}` Android | Usar `'height'` no Android |
| BackButton invisível | Adicionar `<BackIcon />` |

#### MascotScreen.js
| Problema | Correção |
|---|---|
| `translateY: 200` quebra em telas pequenas | Usar proporção: `SCREEN_HEIGHT * 0.24` |

**Código:**
```jsx
import { useWindowDimensions } from 'react-native';
const { height: SCREEN_HEIGHT } = useWindowDimensions();
const mascotTranslateY = SCREEN_HEIGHT * 0.24;
// transform: [{ translateY: mascotTranslateY }]
```

#### ForgotPasswordScreen.js / ResetPasswordScreen.js
| Problema | Correção |
|---|---|
| Sem `KeyboardAvoidingView` | Adicionar KAV + ScrollView |

#### SplashScreen.js
| Problema | Correção |
|---|---|
| `width: 480, height: 320` fixos | Usar `SCREEN_W * 1.2` e `SCREEN_H * 0.4` |
| `fontSize: 110` fixo | Usar `Math.min(110, SCREEN_W * 0.26)` |
| `Math.random()` no corpo | Mover para `useRef` |

### ⏱ Estimativa de Tempo: 3 horas

### 👤 Responsável: Letícia (telas de autenticação) + Carlos (MascotScreen + SplashScreen)

---

## PROBLEMA 5 — Mapeamento Completo de Bugs Conhecidos

### ✅ Tabela de Bugs Encontrados

| Bug | Arquivo | Linha | Severidade | Correção |
|---|---|---|---|---|
| `redirectTo: "http://localhost:8081/ResetPassword"` hardcoded | `ForgotPasswordScreen.js` | 31 | **CRÍTICA** | Usar env var: `${process.env.EXPO_PUBLIC_APP_URL}/ResetPassword` |
| `navigation.replace("Home")` após Alert (race condition) | `SignUpScreen.js` | 112 | **ALTA** | Remover; manter apenas dentro callback do Alert |
| Sem botão de voltar | `ResetPasswordScreen.js` | — | **ALTA** | Adicionar `TouchableOpacity` com `navigation.goBack()` |
| Destructuring aninhado sem try/catch | `ReportProblemScreen.js` | 60 | **ALTA** | Envolver em try/catch |
| `categoryValue` pode ser undefined | `CategoryScreen.js` | 34 | **ALTA** | Verificar: `if (!categoryValue) return;` |
| Erro Supabase descartado | `CategoryScreen.js` | 36-40 | **ALTA** | Desestruturar `error` |
| Cleanup `sound.unloadAsync()` nunca executa | `AudioPlayerScreen.js` | 31-39 | **ALTA** | Ver Problema 2 — usar `useRef` |
| `DAY_COLUMNS` ordem diferente em dois arquivos | `useWeeklyChallenge.js` vs `ExerciseListScreen.js` | 4 / 16 | **ALTA** | Criar `src/utils/dayColumns.js` unificado |
| Insert falhou mas navega | `ExerciseListScreen.js` | 154-158 | **MÉDIA** | Verificar `insertErr` antes de navegar |
| `signOut()` sem verificação de erro | `ResetPasswordScreen.js` | 44 | **MÉDIA** | Verificar `error` após signOut |
| `profileData.user_id` pode ser null | `EditProfileScreen.js` | 135 | **MÉDIA** | Verificar `if (!userId) return;` |
| `setTimeout` sem cleanup | `EditProfileScreen.js` | 147 | **MÉDIA** | Ver correção acima (useRef) |
| `setTimeout` sem cleanup | `ResetPasswordScreen.js` | 48-50 | **MÉDIA** | Usar `useRef` |
| `slideAnim._value` API interna | `DrawerMenu.js` | 81 | **MÉDIA** | Substituir por state booleano |
| `getUser().then()` sem `.catch()` | `DrawerMenu.js` | 37-43 | **MÉDIA** | Adicionar `.catch()` |
| "Lembrar de mim" visual sem efeito | `LoginScreen.js` | 23 | **BAIXA** | Implementar ou remover |
| `has_seen_tutus` update sem verificação | `MascotScreen.js` | 16-21 | **BAIXA** | Verificar `error` |
| `navigation` prop sem valor default | `SplashScreen.js` | 76 | **BAIXA** | Adicionar check |
| `Math.random()` corpo do componente | `SplashScreen.js` | 262 | **BAIXA** | Usar `useRef` |
| `console.log` em produção | `AudioPlayerScreen.js` | 65 | **BAIXA** | Remover |
| `console.log` em produção | `src/utils/recoveryDetect.js` | 7 | **BAIXA** | Remover |

### 📋 Fixes Prioritários

**1. ForgotPasswordScreen — URL de produção (CRÍTICO)**
```javascript
// Antes:
redirectTo: "http://localhost:8081/ResetPassword"

// Depois:
redirectTo: `${process.env.EXPO_PUBLIC_APP_URL || 'exp://127.0.0.1:8081'}/--/ResetPassword`
```

**2. SignUpScreen — Race condition (ALTA)**
```javascript
// Remover navigation.replace("Home") da linha 112
// Manter APENAS dentro do callback do Alert de sucesso
if (profileError) {
  Alert.alert("Aviso", "Conta criada, mas houve um erro ao salvar seu perfil.", [
    { text: "OK", onPress: () => navigation.reset({ ... }) }
  ]);
  return; // ← PARAR AQUI se houve erro
}
navigation.replace("Home"); // ← Executar SOMENTE se OK
```

**3. DAY_COLUMNS divergentes (ALTA)**
```javascript
// CRIAR: src/utils/dayColumns.js
export const DAY_COLUMNS = [
  'sunday',    // 0
  'monday',    // 1
  'tuesday',   // 2
  'wednesday', // 3
  'thursday',  // 4
  'friday',    // 5
  'saturday',  // 6
];

// Atualizar imports em ambos os arquivos
```

**4. ResetPasswordScreen — Adicionar botão de voltar (ALTA)**
```jsx
<TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
  <Text style={{ color: '#fff' }}>← Voltar</Text>
</TouchableOpacity>
```

### ⏱ Estimativa de Tempo: 3 horas

### 👤 Responsável: Carlos (críticos/altos) + Letícia (médios) + Sofia (verificação)

---

## PROBLEMA 6 — App Não Abre no Celular Físico (Expo)

### ✅ Diagnóstico

**Status do app.json:**

| Configuração | Status | Impacto |
|---|---|---|
| `scheme: "motusapp"` | ✅ OK | Deep links funcionam |
| `bundleIdentifier` iOS | ❌ Ausente | Build iOS impossível |
| `package` Android | ❌ Ausente | Build Android impossível |
| Plugin `expo-av` | ❌ Ausente | Áudio pode não funcionar em builds |
| `UIBackgroundModes` | ❌ Ausente | Áudio para em background (iOS) |
| `android.permissions` | ❌ Ausente | Foreground service bloqueado |

### 📋 Passos de Diagnóstico e Correção

#### Passo 1 — Testar via Expo Go (mais rápido)
```bash
npm start
# Escanear QR Code — deve funcionar se:
# - Celular e computador na mesma Wi-Fi
# - Expo Go atualizado para SDK 54
# - Porta 8081 não bloqueada pelo firewall
```

#### Passo 2 — Atualizar app.json completo

```json
{
  "expo": {
    "name": "Motus",
    "slug": "motus",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "motusapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.motus.app",
      "infoPlist": {
        "UIBackgroundModes": ["audio"]
      }
    },
    "android": {
      "package": "com.motus.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": true,
      "permissions": [
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK"
      ]
    },
    "plugins": [
      "expo-splash-screen",
      "expo-font",
      "expo-web-browser",
      ["expo-av", { "microphonePermission": false }]
    ]
  }
}
```

#### Passo 3 — Para EAS Build (build standalone)
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

#### Passo 4 — Para rodar via USB
```bash
npm run android   # Android com USB depuração
npm run ios       # iOS com Xcode (Mac)
```

### ⏱ Estimativa de Tempo: 1 hora

### 👤 Responsável: Carlos (app.json) + Letícia (testes)

---

## RESUMO EXECUTIVO — ORDEM DE EXECUÇÃO

| Prioridade | Problema | Tempo | Responsável |
|---|---|---|---|
| 🔴 Imediato | Bug crítico: localhost URL | 10 min | Carlos |
| 🔴 Imediato | Bug crítico: race condition SignUp | 15 min | Carlos |
| 🔴 Imediato | Bug crítico: DAY_COLUMNS | 20 min | Letícia |
| 🟡 Dia 1 | Problema 6: app.json | 30 min | Carlos |
| 🟡 Dia 1 | Problema 2: stale closure + audio | 45 min | Carlos |
| 🟡 Dia 1 | Problema 1: useFocusEffect Home | 20 min | Carlos |
| 🟢 Dia 2 | Problema 4: responsividade | 3h | Letícia + Carlos |
| 🟢 Dia 2 | Problema 5: bugs médios/baixos | 2h | Letícia |
| 🟢 Dia 3 | Problema 3: admin dashboard | 1h | Sofia |
| 🟢 Dia 3 | Verificação e testes finais | 2h | Sofia |

**Total: ~10 horas em 3 dias**

---

_Versão 1.0 — 30/05/2026 — Pronto para implementação_