# CLAUDE.md


## Project Overview

**Motus** is a mental wellness mobile application built with React Native and Expo. It provides users with guided meditations, gratitude journaling, daily reflections, sleep audio sessions, and focus techniques (Pomodoro, deep focus), plus weekly task management. The app is a Portuguese-language wellness platform with user authentication, progress tracking, and personalized notifications.

## Tech Stack

- **Framework**: Expo (React Native) v54.0.33 with new architecture enabled
- **Language**: TypeScript & JavaScript (mixed codebase)
- **React & DOM**: React 19.1.0, React Native 0.81.5, React DOM 19.1.0
- **Navigation**: Expo Router v6.0.23 (file-based routing) + React Navigation (native stack, bottom tabs, drawers)
- **Backend/Database**: Supabase (PostgreSQL-based) with auth and real-time capabilities
- **Styling**: React Native StyleSheet (no CSS-in-JS framework; plain styles)
- **Custom Fonts**: Whyte font family (Regular, Bold, Medium) loaded via Expo Font
- **Audio**: Expo AV for audio playback (meditation sessions, sleep sounds)
- **Animations**: React Native Reanimated v4.1.1, React Native Gesture Handler
- **UI Components**: Expo Vector Icons, custom components, Radix UI primitives in node_modules
- **Charts**: react-native-chart-kit for progress visualization
- **Utilities**: Expo Linear Gradient, Expo Constants, Expo Keep Awake, Expo Symbols, Expo System UI

## Project Structure

Directory layout (key folders):

- **app/** - Expo Router file-based routes (_layout.tsx, (auth)/, (home)/, audio/, exercises/, profile/)
- **src/navigation/** - AppNavigator.js (legacy Stack Navigator, main navigation logic)
- **src/screens/** - 12+ screen components (Home, AudioPlayer, Category, Challenges, Login, SignUp, Profile, EditProfile, Splash, etc.)
- **src/components/** - DrawerMenu.js (animated side drawer), Icons.js (custom SVG icons)
- **src/services/** - supabase.js (Supabase client initialization)
- **constants/** - theme.ts (Colors for light/dark mode, Font definitions)
- **hooks/** - use-color-scheme.ts, use-theme-color.ts (theme and color detection)
- **components/** - Root-level reusable UI components (themed-text, themed-view, collapsible, etc.)
- **assets/** - Custom fonts (Whyte-*.ttf), images (icons, splash, Android adaptive icons)

## Key Architecture Decisions

### Navigation Model (Transitional)

The app uses a **dual-layered navigation** approach:

1. **Expo Router (File-Based)**: Routes defined in app/ directory (app/_layout.tsx, app/(auth)/, app/(home)/, etc.)
2. **Legacy React Navigation Stack**: Root _layout.tsx delegates to AppNavigator.js, which manages a native stack navigator with screens from src/screens/

This is a **transitional architecture mixing Expo Router with legacy React Navigation**. Future refactoring should consolidate routes entirely into Expo Router.

### Data Flow & State Management

- **No Redux/Zustand/Context API** - State managed locally with useState hooks in each screen
- **Supabase backend** - PostgreSQL database, email/password auth, OAuth, real-time capabilities
- **Per-screen data fetching** - Each screen calls supabase.from().select() in useEffect
  - No centralized data store; queries are duplicated across screens
  - No caching layer; every navigation triggers fresh fetches
  - **Opportunity**: Extract common queries into custom hooks (useUserProfile, useSessions, useCategories)

### Styling

- **React Native StyleSheet.create()** - No external CSS-in-JS library
- **Light/dark mode** - Via Colors object in constants/theme.ts and useThemeColor hook
- **Linear gradients** - expo-linear-gradient for visual effects
- No Tailwind, Nativewind, or other utility frameworks

### Authentication

1. **SplashScreen** (2s delay) → **LoginScreen**
2. Supabase Auth handles email/password sign-in and sign-up
3. User profile stored in Supabase user_profiles table
4. Session persists via Supabase SDK; logout clears session
5. ForgotPasswordScreen exists but is empty (not implemented)

### Audio Playback

- **Expo AV (expo-av)** for real-time audio control (play, pause, seek)
- AudioPlayerScreen loads meditation/sleep audio from Supabase CDN
- Tracks playback time, duration, and shows progress bar
- Cleanup on unmount prevents memory leaks

### Animations & Gestures

- **DrawerMenu** uses Animated.Value and Animated.timing for slide-in/out
- **React Native Gesture Handler** for touch responsiveness
- **React Native Reanimated** for smooth 60fps animations

## Development Commands

### Setup & Installation

```bash
npm install
eas build --platform ios
eas build --platform android
npm run reset-project
```

### Development & Running

```bash
npm start                 # Start Expo dev server (interactive, QR code)
npm run android           # Run on Android emulator/device
npm run ios               # Run on iOS simulator/device
npm run web               # Run on web browser
```

### Linting & Code Quality

```bash
npm run lint              # Run ESLint (Expo config)
npx expo lint --fix       # Run ESLint with auto-fix
```

## Important Development Notes

- **Font Loading**: Custom Whyte fonts loaded in AppNavigator.js via useFonts(). If fonts fail, app renders null and waits.
- **Splash Screen**: Configured in app.json, displays for 2 seconds before routing.
- **Supabase Credentials**: Hardcoded in src/services/supabase.js (anon key). Should use .env.local for production.
- **New Architecture**: app.json has "newArchEnabled": true for React Native compatibility.
- **TypeScript Strict Mode**: tsconfig.json enforces strict type checking. Use proper types for new files.

## Supabase Data Model

Key tables used by the app:

- **users** - Managed by Supabase Auth
- **user_profiles** - User metadata (name, avatar, created_at, bio)
- **categories** - Content categories (Meditação, Sono, Concentração, Gratidão)
- **sessions** - Individual audio sessions with metadata
- **user_sessions** - Tracks user progress on each session
- **challenges** - Weekly challenges with completion tracking
- **gratidao** - Gratitude journal entries

Queries are made directly in screen components (no ORM or query builder abstraction).

## Common Code Patterns

### Screen Template

Each screen follows this basic pattern:

```javascript
export default function ScreenName({ route, navigation }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data, error } = await supabase
        .from("tableName")
        .select("*")
        .eq("userId", userId);
      if (data) setData(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <ActivityIndicator />;
  // Render UI with data
}
```

### Component Styling

All components use StyleSheet.create() at the file bottom:

```javascript
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  text: { fontSize: 16, color: "#11181C" },
});
```

### Navigation

- **Push screen**: navigation.navigate("ScreenName", { params })
- **Reset stack** (logout): navigation.reset({ index: 0, routes: [{ name: "Login" }] })
- **Pass data**: Via route.params to next screen

