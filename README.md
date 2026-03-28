# DevSuite Mobile

> App mobile da suite de produtividade para desenvolvedores. React Native + Expo, conectado ao mesmo backend da versão web.

![Expo](https://img.shields.io/badge/Expo-51-000020?style=flat&logo=expo)
![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)
![Android](https://img.shields.io/badge/Android-✓-3DDC84?style=flat&logo=android)
![iOS](https://img.shields.io/badge/iOS-✓-000000?style=flat&logo=apple)

---

## Ferramentas

| | Ferramenta | Descrição |
|---|---|---|
| ✅ | **TaskFlow** | Gerenciador de projetos Kanban. Colunas A Fazer / Em Progresso / Concluído com mudança de status por toque. |
| 🔭 | **Dev Pulse** | Repositórios trending do GitHub filtrados por linguagem. Abre o repo no browser com um toque. |
| ⏱️ | **Focus Timer** | Pomodoro com SVG animado (Reanimated). Timer resiliente a background via `AppState` API. Histórico de sessões no banco. |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Expo SDK 51 + Expo Router v3 |
| Runtime | React Native 0.74 |
| Linguagem | TypeScript 5 (strict) |
| Navegação | Expo Router (file-based) |
| Estado servidor | TanStack React Query v5 |
| HTTP | Axios |
| Storage local | AsyncStorage |
| Animações | React Native Reanimated v3 |
| SVG | React Native SVG |
| Ícones | Expo Vector Icons (Ionicons) |
| Backend | DevSuite API (Node + Express + Prisma + Neon) |

---

## Estrutura

```
app/
├── _layout.tsx           # Root: providers (QueryClient + Auth + GestureHandler)
├── index.tsx             # Entry: redirect auth guard
├── (auth)/
│   ├── _layout.tsx       # Stack sem tab bar
│   ├── login.tsx         # Login com validação
│   └── register.tsx      # Cadastro
└── (app)/
    ├── _layout.tsx       # Bottom Tab Navigator + auth guard
    ├── index.tsx         # Dashboard — grid de projetos
    ├── devpulse.tsx      # Dev Pulse — trending repos
    ├── focus.tsx         # Focus Timer — Pomodoro
    └── project/[id].tsx  # Kanban board do projeto

components/
├── ui/
│   ├── Button.tsx        # Botão com variantes (primary/secondary/ghost/danger)
│   └── Input.tsx         # Input com label, erro e estado de foco

contexts/
└── AuthContext.tsx       # JWT + AsyncStorage + login/logout/register

hooks/
└── useProjects.ts        # React Query hooks para projetos e tarefas

services/
└── api.ts                # Axios instance + interceptors JWT

types/
└── index.ts              # Tipos espelhados do backend

constants/
└── theme.ts              # Design system: cores, espaçamentos, tipografia
```

---

## Instalação

### Pré-requisitos
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Para Android: Android Studio com emulador configurado
- Para iOS (macOS): Xcode
- **Backend rodando**: [devsuite-api](https://github.com/krisvdz/taskflow-api)

### Setup

```bash
cd devsuite-mobile
npm install
```

### Configurar URL da API

Edite `app.json`, campo `extra.apiUrl`:

```json
"extra": {
  "apiUrl": "http://SEU_IP_LOCAL:3001/api"
}
```

> ⚠️ Em dispositivo físico, use o IP da sua máquina na rede Wi-Fi (ex: `192.168.1.100`).
> `localhost` só funciona no emulador Android.

### Rodar

```bash
# Expo Go (desenvolvimento rápido, sem build nativo)
npm start

# Emulador Android
npm run android

# Simulador iOS
npm run ios
```

---

## Build para produção

O projeto usa **EAS Build** (Expo Application Services):

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login na sua conta Expo
eas login

# Configurar o projeto (primeira vez)
eas build:configure

# Build Android (.aab para Play Store)
npm run build:android

# Build iOS (.ipa para App Store)
npm run build:ios
```

Antes do build, atualize em `app.json`:
- `android.package`: `com.seudominio.devsuite`
- `ios.bundleIdentifier`: `com.seudominio.devsuite`
- `extra.eas.projectId`: ID do seu projeto no Expo

---

## Diferenças Web vs Mobile

| Conceito | Web (React) | Mobile (React Native) |
|---|---|---|
| Storage | `localStorage` | `AsyncStorage` (assíncrono) |
| Tab em background | `visibilitychange` event | `AppState.addEventListener('change')` |
| Navegação | React Router DOM | Expo Router (Tabs + Stack) |
| Estilo | Tailwind CSS classes | `StyleSheet.create()` com números |
| Drag-and-drop | HTML5 Drag API | Toque no status badge → modal |
| Abrir URL | `window.open()` | `Linking.openURL()` |
| Keyboard | Automático | `KeyboardAvoidingView` |
| Safe area | Não necessário | `SafeAreaView` para notch/home bar |

---

## Conceitos ensinados no código

- **AppState API**: detectar quando app vai para background (equivalente ao `visibilitychange` do browser)
- **Deadline-based timer**: `Date.now() + seconds * 1000` — resiliente a throttling do OS
- **Expo Router file-based routing**: grupos `(auth)` e `(app)` para separar fluxos sem afetar a URL
- **Auth guard com Context**: `<Redirect>` no layout do grupo protegido
- **AsyncStorage pattern**: sempre assíncrono, tratamento de token expirado no interceptor
- **React Native Reanimated**: `useSharedValue` + `useAnimatedProps` para animações performáticas na UI thread
- **Bottom Sheet modal**: `Modal` com `justifyContent: 'flex-end'` — padrão de UX nativo
- **FlatList vs ScrollView**: `FlatList` para listas grandes (virtualização), `ScrollView` para conteúdo fixo

---

> Projeto para estudo de desenvolvimento mobile com React Native e Expo.
> Compartilha o mesmo backend com a versão web [DevSuite](https://github.com/krisvdz/taskflow-web).
