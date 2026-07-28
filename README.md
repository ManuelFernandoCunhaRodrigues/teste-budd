# Budd

Aplicativo mobile para descoberta e consumo em bares, restaurantes e eventos:
line-up de shows e artistas, mapa de estabelecimentos, cardápio com carrinho,
ingressos, carteira/saldo e recarga via PIX.

Construído com React Native + Expo (SDK 57), TypeScript e roteamento por
arquivos (`expo-router`).

Para o detalhamento técnico de arquitetura, decisões e convenções de código,
veja [`DOCUMENTACAO.md`](DOCUMENTACAO.md). Este README cobre instalação,
configuração, execução e uma visão honesta do que está pronto, parcial ou
simulado.

## Plataformas suportadas

**Android e iOS.**

Web **não** é uma plataforma alvo — `app.json` declara `"platforms": ["ios",
"android"]` e não há script `web`, configuração `expo.web` nem dependência de
`react-native-web`. O app depende de módulos nativos sem equivalente direto no
navegador: `react-native-maps` é importado sem separação por plataforma em
`MapScreen` e `EventMiniMap`, e `expo-secure-store`, usado para o token de
sessão, não existe na web.

`react-dom` continua nas dependências e **não deve ser removido**: entra na
árvore via `expo-router` (que depende de `@radix-ui/*`), fixado em `19.2.3`
para casar com o `react` do SDK 57 — sem esse pin o `npm install` falha por
conflito de peer dependency.

## Funcionalidades

Classificação honesta do que existe no código hoje:

| Funcionalidade | Status | Onde |
| --- | --- | --- |
| Splash animada | Implementado | `src/features/splash/` — timeline em Reanimated, respeita "reduzir movimento" |
| Login | Implementado | `src/features/auth/screens/LoginScreen.tsx` |
| Cadastro | Implementado | `src/features/auth/screens/SignUpScreen.tsx` |
| Navegação inferior customizada | Implementado | `src/components/navigation/TabBar.tsx` — entalhe em SVG recalculado por worklet |
| Descoberta de bares | Implementado | `src/features/bars/`, `src/features/role/components/BarsFeed.tsx` |
| Descoberta de eventos | Implementado | `src/features/events/`, `src/features/role/components/EventsFeed.tsx` |
| Detalhes de estabelecimento | Implementado | `src/features/bars/screens/BarDetailScreen.tsx` |
| Detalhes de evento | Implementado | `src/features/events/screens/EventDetailScreen.tsx` |
| Line-up e artistas | Implementado | `src/features/lineup/` — busca, shows próximos, favoritos de artista |
| Mapa | Implementado, com modo simulado | `src/features/map/` — ver seção [Mapa e mock](#configuração-do-google-maps) |
| Localização | Implementado | `expo-location`, `src/features/map/hooks/useUserLocation.ts` (estados de permissão) |
| Favoritos (bares e artistas) | Implementado | `favoritesStore`, `artistFavoritesStore` |
| Produtos e carrinho | Implementado | `src/features/catalog/`, `src/features/cart/`, `cartStore` (carrinho de um único estabelecimento) |
| Pedidos e histórico | Implementado, contra backend em memória | `src/features/profile/screens/OrderHistoryScreen.tsx`, `services/orders/` |
| Ingressos | Simulado | `src/features/events/` (`TicketSheet`) — estoque e estados (esgotado/encerrado) simulados no `devBackend`, sem provedor real |
| Carteira/saldo | Implementado, contra backend em memória | `walletStore`, `src/features/profile/screens/RechargeScreen.tsx` — sem "adicionar crédito" local |
| PIX | Simulado (apenas em dev) | `src/features/checkout/components/PixChargePanel.tsx` — botão "[dev] Simular confirmação do PIX" no lugar do webhook do provedor |
| Avaliações | Implementado, contra backend em memória | `src/features/bars/components/ReviewComposer.tsx`, `ReviewsSheet.tsx` |
| Perfil | Implementado | `src/features/profile/screens/ProfileScreen.tsx` |
| Preferências | Implementado | `PreferencesScreen.tsx`, `preferencesStore` (sobrevive ao logout, é do dispositivo) |
| Notificações | Parcial | `NotificationsScreen.tsx` alterna categorias em `preferencesStore`; **não há `expo-notifications`, token de push nem handler** — é uma tela de preferência, não um pipeline de push |
| Assistente inteligente | Simulado (não é IA) | `src/features/assistant/assistantEngine.ts` — função determinística de correspondência por palavra-chave sobre os dados mockados; comentário no código é explícito: "Deliberately not an AI" |

## Tecnologias utilizadas

| Tecnologia | Utilização |
| --- | --- |
| React Native 0.86 | Interface mobile |
| Expo SDK 57 | Ambiente, build e módulos nativos |
| TypeScript (strict) | Tipagem estática, alias `@/*` → `./src/*` |
| Expo Router | Navegação baseada em arquivos, com rotas tipadas (`typedRoutes`) |
| Zustand | Gerenciamento de estado |
| NativeWind | Estilização (Tailwind para React Native) |
| React Native Reanimated | Animações na UI thread (splash, tab bar) |
| React Native Maps | Mapa (com modo simulado, ver abaixo) |
| Jest + jest-expo + Testing Library | Testes automatizados |
| ESLint (`eslint-config-expo`) | Lint |
| expo-doctor | Diagnóstico de compatibilidade do projeto Expo |

## Bibliotecas e justificativas

Cobertura resumida por categoria — para a justificativa completa de cada uma,
com alternativas consideradas, veja a seção 3 de [`DOCUMENTACAO.md`](DOCUMENTACAO.md#3-bibliotecas-e-justificativas).

### Núcleo

- **`expo`** — SDK gerenciado; módulos nativos versionados em conjunto, elimina incompatibilidades entre biblioteca nativa e versão do React Native.
- **`expo-router`** — roteamento por arquivos. Os grupos `(private)`/`(public)` permitem aplicar a guarda de sessão no layout, cobrindo deep link, back stack e estado restaurado — não só a navegação manual.
- **`react` / `react-native`** — pareados na versão do SDK 57 (19.2.3 / 0.86.0).
- **`typescript`** — modo `strict` em todo o projeto.

### Estado e persistência

- **`zustand`** — sem Provider, sem boilerplate de reducers/actions; escolhido no lugar do Redux Toolkit por peso e cerimônia desproporcionais ao tamanho do app.
- **`@react-native-async-storage/async-storage`** — persiste dados não sensíveis: carrinho, favoritos, preferências, avaliações.
- **`expo-secure-store`** — persiste **apenas o token de sessão**, via Keystore (Android) e Keychain (iOS). Nunca usado para dados de negócio.

### Interface e design

- **`nativewind`** — Tailwind para React Native; tokens de design consistentes por construção, estilo junto do markup.
- **`react-native-reanimated`** / **`react-native-worklets`** — animações executadas na UI thread; necessário para o path SVG da tab bar, recalculado a cada frame (engasgaria em JS puro).
- **`react-native-svg`** — ícones e formas vetoriais próprias (tab bar, logo, mapa simulado).
- **`react-native-gesture-handler`** / **`react-native-screens`** — gestos nativos e telas nativas (menor uso de memória em pilhas profundas); requisitos do Reanimated e do Router.
- **`react-native-safe-area-context`** — insets corretos em notch e barra de gestos.
- **`expo-linear-gradient`** — gradientes sobre imagens de capa para legibilidade de texto.

### Recursos nativos

- **`react-native-maps`** — mapa via `PROVIDER_DEFAULT`: Google Maps no Android, Apple Maps no iOS. Evita exigir chave de API nas duas plataformas.
- **`expo-location`** — localização do usuário, permissão solicitada em contexto.
- **`react-native-qrcode-svg`** — QR Code do PIX, renderizado em SVG sem dependência nativa extra.
- **`expo-clipboard`** — copiar código PIX.
- **`expo-linking`** — deep links e abertura de apps externos (mapas, WhatsApp).
- **`expo-splash-screen`** — controla o momento de ocultar a splash nativa até o bootstrap terminar.
- **`expo-dev-client`** — necessário para testar módulos nativos (mapa, localização) fora do Expo Go.

### Testes e qualidade

- **`jest` + `jest-expo`** — executor de testes e ambiente RN (transform, mocks de módulos nativos).
- **`@testing-library/react-native`** — testes de componente orientados a comportamento do usuário.
- **`eslint` + `eslint-config-expo`** — lint.
- **`expo-doctor`** — valida compatibilidade de versões do projeto com o SDK do Expo.

## Pré-requisitos

- Node 22.13+ (compatível com Expo SDK 57)
- npm
- Git
- Android Studio, para emulador Android
- Xcode, para simulador iOS (somente macOS)
- Expo Go compatível com SDK 57, **ou** um development build (necessário para recursos nativos como mapa e localização — ver [seção do Google Maps](#configuração-do-google-maps))

## Como executar

### Clonar o repositório

```bash
git clone https://github.com/ManuelFernandoCunhaRodrigues/teste-budd.git
cd teste-budd
```

### Instalar as dependências

```bash
npm install
```

### Configurar variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env       # Linux/macOS
```

```powershell
Copy-Item .env.example .env   # Windows PowerShell
```

> Nunca envie o arquivo `.env` para o Git. Apenas o `.env.example` deve
> permanecer versionado.

Variáveis disponíveis (todas em `.env.example`):

| Variável | Obrigatória | Descrição | Comportamento quando ausente |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_APP_ENV` | Não | Ambiente alvo: `development` \| `staging` \| `production` | Bundle de dev vira `development`; qualquer outro bundle é tratado como `production` |
| `EXPO_PUBLIC_API_URL` | Não | URL base da API Budd | Sem fallback: fica `null`, e os fluxos que dependem de servidor reportam-se indisponíveis em vez de simular sucesso |
| `EXPO_PUBLIC_API_TIMEOUT` | Não | Timeout das requisições, em ms | Usa `15000` |
| `EXPO_PUBLIC_WHATSAPP_SUPPORT_NUMBER` | Não | Número de suporte via WhatsApp | Entrada do menu de suporte fica desabilitada |
| `EXPO_PUBLIC_ENABLE_DEV_BACKEND` | Não | Liga o backend em memória (demo) | Fica desligado; travado atrás de `__DEV__`, não pode ser ativado em build de produção |
| `EXPO_PUBLIC_USE_MOCK_MAP` | Não | Troca o mapa real por um mapa desenhado (SVG), para demonstração | Fica desligado; também travado atrás de `__DEV__` |
| `GOOGLE_MAPS_ANDROID_API_KEY` | **Em build nativo Android** | Chave do Google Maps, lida por `app.config.ts` no momento do build (não é `EXPO_PUBLIC_*`) | No dev server e no Expo Go não afeta nada; em `expo run:android`/EAS sem a variável, o build de produção falha, e o build de desenvolvimento local sai com o mapa em branco |

### Iniciar o projeto

```bash
npx expo start -c
```

O `-c` limpa o cache do Metro — necessário depois de alterar o `.env`, já que
variáveis `EXPO_PUBLIC_*` são embutidas no bundle no arranque e o Fast Refresh
não as recarrega.

### Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm start` | Inicia o servidor de desenvolvimento Expo |
| `npm run android` | Servidor já apontando para Android |
| `npm run ios` | Servidor já apontando para iOS |
| `npm test` | Executa a suíte Jest |
| `npm run test:watch` | Jest em modo watch |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint via `expo lint` |
| `npm run doctor` | `expo-doctor` — diagnóstico de compatibilidade com o Expo |

## Executando no Android

**Expo Go**: instale o Expo Go compatível com o SDK 57, conecte o dispositivo à
mesma rede do computador, rode `npx expo start` e escaneie o QR Code.

**Emulador Android**: abra o Android Studio, crie ou inicie um dispositivo
virtual e rode:

```bash
npm run android
```

**Development build**: necessário para exercitar o app exatamente como um
APK/AAB nativo se comportaria — por exemplo, para validar o comportamento real
do Google Maps sem chave (mapa em branco) em vez do comportamento do Expo Go
(que usa credenciais próprias e não expõe esse problema).

## Executando no iOS

O simulador iOS exige macOS com Xcode instalado:

```bash
npm run ios
```

Também é possível usar o Expo Go em um dispositivo físico compatível com o
SDK 57.

## Configuração do Google Maps

O app renderiza `MapView` com `PROVIDER_DEFAULT`: **Google Maps no Android** e
**Apple Maps no iOS** — por isso só o Android precisa de chave.

- A chave é lida de `GOOGLE_MAPS_ANDROID_API_KEY` por `app.config.ts` no
  momento do build, e injetada no manifesto nativo via plugin
  `react-native-maps`. Código do app **não** lê essa variável em runtime.
- Nunca escreva a chave diretamente no código-fonte.
- O **Google Maps SDK for Android** precisa estar habilitado no projeto do
  Google Cloud associado à chave.
- Restrinja a chave no Google Cloud Console: nome do pacote (`com.budd.app`),
  fingerprint SHA-1 do certificado de assinatura (upload e release do Play App
  Signing), e apenas a Maps SDK for Android habilitada.
- Para builds via EAS, use secrets em vez de `.env`:

  ```bash
  eas secret:create --scope project --name GOOGLE_MAPS_ANDROID_API_KEY --value <chave>
  ```

**Expo Go vs. development build vs. APK/AAB de produção:**

- No **Expo Go**, a chave não é necessária — ele usa credenciais próprias do
  Google. Um mapa funcionando no Expo Go **não garante nada** sobre o
  comportamento em um build nativo.
- Em um **development build local** (`expo run:android`) sem a variável
  definida, o build conclui, mas o mapa aparece como uma superfície cinza
  vazia, sem erro no console.
- Em um **build de produção/EAS**, a ausência da chave faz `app.config.ts`
  lançar um erro e o build falhar — deliberadamente, para não publicar um app
  com mapa quebrado.

Para demonstrações sem depender da chave, defina `EXPO_PUBLIC_USE_MOCK_MAP=true`
no `.env` (também travado atrás de `__DEV__`): a tela de mapa e a mini-mapa de
evento passam a desenhar uma cidade fictícia em SVG (`MockMapSurface`) no lugar
do `MapView` real, mantendo pins e controles idênticos. Isso nunca é alcançável
em um build de produção.

## Estrutura de pastas

```text
├── app/                      Rotas (expo-router) — apenas composição
│   ├── _layout.tsx           Layout raiz: providers, splash, status bar
│   ├── index.tsx             Bootstrap: resolve sessão antes de rotear
│   ├── (public)/              Rotas sem sessão
│   │   ├── login.tsx
│   │   └── signup.tsx
│   └── (private)/             Rotas com sessão (guarda no layout)
│       ├── (tabs)/            As cinco abas + (role)/ (rota aninhada da aba ROLÊ)
│       ├── (account)/         Sub-telas do perfil (favoritos, notificações, etc.)
│       ├── artist/[id].tsx
│       ├── event/[id].tsx
│       └── order/[id].tsx
│
├── src/
│   ├── domain/                Regras puras — sem I/O, sem React
│   ├── services/               I/O: rede, storage, localização, links externos
│   ├── store/                  Estado global (Zustand)
│   ├── features/                Telas e componentes por domínio de produto
│   ├── components/              UI reutilizável, agnóstica de domínio
│   ├── hooks/                   Hooks genéricos
│   ├── theme/                   Tokens de design
│   ├── config/                  Ambiente e validação
│   ├── bootstrap/                Sequenciamento de inicialização
│   ├── constants/                Chaves de storage, constantes de negócio
│   ├── mocks/                    Dados estáticos de demonstração
│   ├── types/                    Tipos compartilhados
│   └── utils/                    Funções auxiliares (dinheiro, datas, texto)
│
├── assets/                    Ícones, splash, imagens
├── app.json / app.config.ts   Configuração estática e dinâmica do Expo
├── eas.json                   Perfis de build (development/preview/production)
└── package.json
```

Responsabilidade de cada pasta principal:

- **`app/`** só compõe rotas — cada arquivo importa uma tela de `features/` e a
  renderiza, sem lógica própria.
- **`features/`** concentra o produto: cada subpasta (`auth`, `bars`, `events`,
  `lineup`, `map`, `catalog`, `cart`, `checkout`, `profile`, `role`, `splash`,
  `assistant`) tem seus próprios `screens/`, `components/`, `hooks/` e,
  quando aplicável, `services/`/`store/` locais.
- **`components/`** é o Design System: elementos reutilizáveis que não
  conhecem nenhum domínio do app.
- **`domain/`** contém regras de negócio puras e testáveis (validação de
  pedido, filtros, aritmética de dinheiro), sem dependência de React ou I/O.
- **`services/`** é a única camada que faz rede, storage ou acessa APIs
  nativas — nenhuma tela chama `fetch` ou lê storage diretamente.
- **`store/`** guarda estado global e orquestra chamadas a `services/`.
- **`theme/`** e **`config/`** são as fontes únicas de tokens visuais e de
  configuração de ambiente, respectivamente.

## Arquitetura

```text
app/ (rotas) → features/ (telas) → hooks/stores de feature → services/ (I/O) → BackendPort
                                          ↓
                                    domain/ (regras puras)
```

- **`app/`** define e compõe rotas.
- **`features/`** implementa telas, componentes e regras específicas de cada
  funcionalidade.
- **`components/`** fornece elementos reutilizáveis, sem saber o que é um bar
  ou um evento.
- **`domain/`** contém regras de negócio puras.
- **`services/`** concentra rede, armazenamento, localização e integrações —
  incluindo a abstração `BackendPort` (ver [Backend e camada de dados](#backend-e-camada-de-dados)).
- **`store/`** mantém o estado global.
- **`theme/`** guarda os tokens visuais.
- **`config/`** resolve variáveis de ambiente.

A dependência flui em uma única direção — de `app/` para `domain/` — sem
exceção. Uma tela nunca chama `fetch` diretamente, e `domain/` nunca importa
React ou I/O. Essa separação é o que permite testar regra de negócio sem
simular rede, trocar a navegação sem tocar em tela, e reutilizar componentes de
UI sem acoplá-los a um domínio específico — mantendo manutenção, testabilidade
e escalabilidade do projeto. Detalhes de cada camada, com diagrama, estão na
seção 5 de [`DOCUMENTACAO.md`](DOCUMENTACAO.md#5-arquitetura-em-camadas).

## Navegação

Roteamento por arquivos via `expo-router`, com rotas tipadas
(`experiments.typedRoutes` em `app.json`).

- **`(public)`**: rotas acessíveis sem sessão (`login`, `signup`).
- **`(private)`**: rotas que exigem sessão. A proteção fica no **layout do
  grupo** (`app/(private)/_layout.tsx`), não em cada tela — isso cobre deep
  link, URL digitada, estado de navegação restaurado e botão voltar, não só a
  navegação feita a partir de dentro do app. O layout lê `useSessionStore` e
  trata três estados: `checking` (tela de carregamento), `unauthenticated`
  (`<Redirect href="/login" />`) e `authenticated` (renderiza as rotas).
- **`(tabs)`**: as cinco abas inferiores — LineUp, Mapa, ROLÊ (central, ícone
  maior, tela inicial), Produtos, Perfil.
- **`(account)`**: sub-telas do perfil que não são abas (favoritos,
  notificações, histórico, preferências, privacidade, recarga, recomendações,
  configurações).
- **`(role)`**: rota aninhada dentro da aba ROLÊ, para que o detalhe de um bar
  (`bar/[id].tsx`) compartilhe a mesma aba em vez de virar uma aba própria.
- Rotas de detalhe usam parâmetros dinâmicos: `artist/[id]`, `event/[id]`,
  `order/[id]`, `(role)/bar/[id]`.

**Tab bar customizada**: usa as APIs headless do `expo-router/ui`
(`Tabs`/`TabList`/`TabSlot`/`TabTrigger`) em vez do tab navigator padrão,
porque o desenho exige um entalhe côncavo que desliza sob a aba ativa —
inexprimível pelas opções do componente padrão. O path SVG do entalhe
(`src/components/navigation/TabBar.tsx`) é recalculado em worklet, na UI
thread, a cada frame da transição, via Reanimated; a aba ativa é determinada
pelo índice atual do `Tabs`. Um `AssistantBubble` flutuante é renderizado como
irmão do `Tabs` em todas as abas exceto Mapa.

## Design System

Tokens centralizados em [`src/theme/`](src/theme/):

| Arquivo | Conteúdo |
| --- | --- |
| `palette.js` | Paleta de cores — fonte única, em CommonJS, para o `tailwind.config.js` fazer `require()` |
| `colors.ts` | Re-export tipado da paleta, para uso fora do Tailwind (fill de SVG, `StyleSheet`, opções nativas) |
| `spacing.ts` | Espaçamento (`spacing`, `SCREEN_PADDING`, `MIN_TOUCH_TARGET`) |
| `radius.ts` | Raios de borda |
| `typography.ts` | Tamanhos e pesos de fonte |
| `shadows.ts` | Sombras |
| `animation.ts` | Durações, easings, springs, `TOAST_DURATION`, `zIndex`, `opacity` |
| `gradients.ts` | Gradientes |

`tailwind.config.js` estende `colors`, `spacing`, `borderRadius` e `fontSize` a
partir desses tokens (mais um ritmo customizado de 18/22/26px de espaçamento e
uma escala tipográfica própria de 11 a 26px). Cores e valores visuais não
devem ser repetidos diretamente nas telas quando já existir um token
correspondente — prefira classes Tailwind (`className="bg-primary"`) no JSX,
recorrendo a `colors` apenas onde a API exige uma string (SVG, mapa, opções de
navegação nativa).

Componentes reutilizáveis vivem em `src/components/ui/` (Avatar, Badge,
Button, Card, Chip, Divider, GradientImage, IconButton, Skeleton, StarRating,
Stepper, Toggle, Touchable, Typography), `src/components/feedback/` (estados de
carregamento, erro, vazio, diálogos, toast) e `src/components/layout/`
(Screen, ScreenHeader, Section).

## Gerenciamento de estado

Zustand foi escolhido no lugar do Redux por não exigir Provider nem
boilerplate de reducers/actions, e por permitir seletores granulares que
evitam re-render em cascata — adequado ao tamanho deste projeto.

| Store | Responsabilidade | Persistência |
| --- | --- | --- |
| `sessionStore` | Status de autenticação, usuário, token em memória | Token via `expo-secure-store` (Keychain/Keystore), lido por `authStorage.ts` |
| `cartStore` | Itens do carrinho, estabelecimento atual, troca pendente | AsyncStorage (`persist`, versão 2, com migração e validação de formato) |
| `favoritesStore` | IDs de bares favoritos | AsyncStorage (`persist`, versão 1) |
| `artistFavoritesStore` | IDs de artistas favoritos | AsyncStorage (`persist`, versão 1) |
| `preferencesStore` | Interesses, notificações, permissões | AsyncStorage (`persist`, versão 1) — **não** é limpo no logout, é do dispositivo |
| `reviewsStore` | Avaliações e rascunhos por estabelecimento | AsyncStorage (`persist`, versão 3) |
| `walletStore` | Saldo e transações | Não persistido — o servidor (ou `devBackend`) é sempre a fonte da verdade |
| `toastStore` | Mensagem de toast efêmera | Não persistido |

O token de autenticação nunca é gravado em `AsyncStorage`: ele fica em texto
simples no dispositivo (arquivo ou banco local não criptografado para esse
fim), enquanto o `SecureStore` usa o Keychain no iOS e o Keystore no Android,
mecanismos do sistema operacional para dados sensíveis. Por isso a sessão tem
seu próprio armazenamento, separado dos demais stores.

## Backend e camada de dados

Não há backend real integrado ao repositório. Toda operação que dependeria de
servidor passa por uma interface única, `BackendPort`
(`src/services/backend/backendTypes.ts`), com três implementações
selecionadas automaticamente:

| Implementação | Selecionada quando | Comportamento |
| --- | --- | --- |
| `devBackend` | `EXPO_PUBLIC_ENABLE_DEV_BACKEND=true` **e** `__DEV__` | Servidor em memória, com idempotência, estoque de ingressos e PIX simulados |
| `httpBackend` | `EXPO_PUBLIC_API_URL` configurada e válida | Requisições reais contra a API |
| `unavailableBackend` | Nenhuma das anteriores (padrão do `.env.example`) | Recusa explicitamente cada chamada com um erro `unavailable` |

`unavailable` é um resultado de primeira classe, não uma falha silenciosa: com
o `.env.example` padrão (sem API e sem backend de dev), a tela de login mostra
um aviso de "autenticação indisponível" e mantém o botão **Entrar**
desabilitado — não existe caminho em que a ausência de backend vire um sucesso
simulado.

O `devBackend` seed uma conta de demonstração
(`user@budd.com` / `123456`, exportada como `DEV_CREDENTIALS`) e reproduz
comportamentos que importam para testar o front de verdade: idempotência por
chave, preços vindos do catálogo (nunca do request), e uma cobrança PIX que
nasce `pending` e só é confirmada por um controle explícito
(`devBackendControls.confirmPixPayment`) — nunca por um timer automático,
imitando o papel do webhook de um provedor real.

Essa abstração permite desenvolver e demonstrar o app inteiro sem servidor,
trocando a fonte de dados sem acoplar nenhuma tela a uma implementação
específica.

## Testes

- Framework: Jest + `jest-expo` (ambiente e mocks nativos) + Testing Library.
- Convenção: arquivos em `__tests__/` ao lado do código que testam.
- Última execução local: **55 suítes, 613 testes, todos passando** (ver
  [Qualidade do código](#qualidade-do-código)).

```bash
npm test
```

Áreas cobertas:

- Regras de domínio (`domain/`): carrinho, filtros de cardápio e evento,
  validação de pedido, alvos de recomendação, validação de avaliação e de
  carteira.
- Stores: sessão, persistência e migração do carrinho, exclusão de conta,
  persistência de preferências.
- Configuração de ambiente: resolução de modo de backend, validação de
  variáveis.
- Guarda de rota (`app/__tests__/routeGuard.test.tsx`), nos três estados.
- Tab bar: geometria do path SVG, distribuição e contrato de navegação das
  cinco abas.
- Backend em memória: fluxos críticos e contrato do `unavailableBackend`.
- Features com hooks/serviços próprios: assistente, avaliações, checkout
  (incluindo estados do PIX), line-up, mapa (permissão de localização,
  geometria do carrossel), splash.
- Componentes de UI: botão desabilitado, avaliação por estrelas, stepper,
  skeleton de tela.
- Serviços: validação de cadastro, links externos (WhatsApp).

## Qualidade do código

```bash
npm run typecheck
npm run lint
npm test
npm run doctor
```

- `typecheck` valida os tipos em todo o projeto (`tsc --noEmit`).
- `lint` roda o ESLint com a config oficial do Expo.
- `test` executa a suíte Jest.
- `doctor` verifica compatibilidade de versões entre o projeto e o SDK do
  Expo instalado.

Os quatro comandos foram executados antes desta documentação:

| Validação | Resultado |
| --- | --- |
| TypeScript | Aprovado, sem erros |
| ESLint | Aprovado, sem avisos |
| Jest | 613 testes em 55 suítes, todos passando |
| expo-doctor | 20/20 checks aprovados |

## Decisões técnicas

**Expo em vez de React Native CLI.** Módulos nativos versionados junto com o
SDK, build gerenciado (EAS) e atualização de dependências nativas em conjunto
— evita a classe de bug "biblioteca X não compila com RN Y".

**Expo Router em vez de React Navigation configurado manualmente.**
Roteamento por arquivos, com grupos de rota que permitem aplicar a guarda de
sessão em um único layout — cobrindo deep link, back stack e estado
restaurado — e rotas tipadas, com menos configuração manual.

**Zustand em vez de Redux.** Sem Provider, sem action creators, sem reducers.
Seletores granulares evitam re-render em cascata. Adequado ao tamanho do
projeto, sem a cerimônia de um Redux Toolkit.

**NativeWind em vez de estilos dispersos.** Tokens de design consistentes por
construção, estilo junto do markup, sem `StyleSheet.create` espalhado pelo
projeto.

**Reanimated para animações.** Execução na UI thread, necessária para o
entalhe da tab bar (recalculado por frame) e para a splash e microinterações
permanecerem fluidas mesmo sob carga na thread JS.

**SecureStore para o token de sessão.** Usa o Keychain no iOS e o Keystore no
Android — mecanismos do sistema operacional para dados sensíveis.
`AsyncStorage` não oferece essa proteção e por isso nunca guarda o token.

**Backend abstraído atrás de `BackendPort`.** Nenhuma tela chama `fetch`
diretamente; toda operação de rede passa pela interface única, que troca de
implementação (`dev`/`http`/`unavailable`) sem tocar em uma linha de UI.

**Dinheiro em centavos inteiros.** `MoneyInCents` como tipo em todo o domínio
(`src/utils/money.ts`) — ponto flutuante não representa valores monetários com
exatidão, e um arredondamento silencioso em um carrinho ou em uma recarga é
inaceitável.

## Limitações conhecidas

- **Sem backend real integrado.** `httpBackend` implementa a `BackendPort`
  contra uma API, mas o projeto nunca foi exercitado contra um servidor real.
- **`devBackend` é volátil.** Estado em memória de módulo — um reload completo
  zera pedidos, ingressos, carteira e avaliações. A sessão sobrevive, porque
  fica no SecureStore.
- **Pagamento e PIX são simulados.** Não há integração com gateway de
  pagamento; a confirmação do PIX é um botão de desenvolvimento.
- **Ingressos são simulados.** Estoque e regras (esgotado, evento encerrado)
  existem no `devBackend`, sem provedor de emissão real.
- **Notificações sem push real.** A tela existe e altera preferências; não há
  `expo-notifications`, token de push ou handler de notificação.
- **Sem internacionalização.** Textos de interface estão em português direto
  no JSX.
- **Cobertura de teste concentrada em domínio, stores e serviços.** Telas têm
  cobertura pontual; não há testes end-to-end nem testes em dispositivo
  físico.
- **Configuração do Google Maps depende de chave.** Sem
  `GOOGLE_MAPS_ANDROID_API_KEY`, o mapa em um build nativo Android fica em
  branco (ou o build falha, em EAS/produção) — mitigado em desenvolvimento
  pelo modo simulado (`EXPO_PUBLIC_USE_MOCK_MAP`).
- **Builds de produção Android/iOS ainda não validados** neste repositório —
  os perfis existem em `eas.json`, mas nenhuma build foi publicada.

## Melhorias futuras

### Prioridade alta

- Integrar autenticação e backend de produção reais.
- Implementar checkout e confirmação de pagamento reais.
- Integrar um gateway PIX de verdade.
- Integrar um provedor real de emissão de ingressos.
- Validar builds Android e iOS de ponta a ponta (incluindo a chave do Google
  Maps em ambiente de produção).

### Prioridade média

- Notificações push reais (`expo-notifications` + backend de envio).
- Histórico e avaliações persistidos em backend real, não apenas em memória.
- Upload de imagem de perfil.
- Filtros avançados de busca e recomendações personalizadas com dados reais.
- Evolução do assistente para além de correspondência por palavra-chave.

### Qualidade e manutenção

- Ampliar cobertura de teste de telas e testes end-to-end.
- Testes em dispositivos físicos (Android e iOS).
- CI (GitHub Actions) rodando `typecheck`, `lint`, `test` e `doctor` a cada PR
  — hoje não há workflow configurado.
- Monitoramento de erros e analytics em produção.
- Internacionalização.
- Auditoria de acessibilidade e de performance.

## Variáveis de ambiente

Ver tabela completa em [Configurar variáveis de ambiente](#configurar-variáveis-de-ambiente).
Nenhum valor real de chave, token ou credencial é mantido neste repositório —
`.env` está no `.gitignore` e só `.env.example`, com campos vazios ou valores
neutros, é versionado.

## Segurança

- `.env` está fora do controle de versão (`.gitignore`); apenas `.env.example`
  é versionado, sem credenciais reais.
- O token de sessão é armazenado com `expo-secure-store` (Keychain/Keystore),
  nunca em `AsyncStorage`.
- A chave do Google Maps é lida de variável de ambiente em tempo de build, não
  fica hard-coded no código-fonte, e deve ser restringida no Google Cloud
  Console (pacote + SHA-1 + apenas Maps SDK for Android).
- O backend de desenvolvimento (`devBackend`) só pode ser ativado com
  `__DEV__` verdadeiro — é estruturalmente impossível habilitá-lo em uma build
  de produção, mesmo que a variável de ambiente esteja mal configurada.
- Valores monetários são inteiros (centavos), e no `devBackend` os preços vêm
  sempre do catálogo, nunca do payload enviado pelo cliente — um backend real
  deve manter essa mesma regra como fonte da verdade.
- Erros expõem duas mensagens separadas (`userMessage` e `detail`), para que
  detalhes técnicos (stack, texto de erro de rede) nunca cheguem à interface.

## Contribuição

```bash
git checkout -b feature/nome-da-feature
git add .
git commit -m "feat: descrição da alteração"
git push origin feature/nome-da-feature
```

Antes de abrir um PR, a alteração deve:

- Passar em `npm run typecheck`;
- Passar em `npm run lint`;
- Passar em `npm test`;
- Seguir a direção de dependências da arquitetura (`app` → `features` →
  `store`/`services` → `domain`), sem tela chamando `fetch` ou storage
  diretamente;
- Não introduzir segredos ou credenciais no repositório;
- Usar os tokens de `src/theme/` em vez de valores de cor/espaçamento soltos
  no JSX.

## Estado atual

| Área | Estado |
| --- | --- |
| Interface e Design System | Implementado |
| Navegação (rotas, guarda de sessão, tab bar) | Implementado |
| Persistência local (carrinho, favoritos, preferências, avaliações) | Implementado |
| Sessão/autenticação (login e cadastro) | Implementado, contra backend em memória |
| Backend real | Pendente |
| Pagamentos e PIX reais | Pendente (simulado em desenvolvimento) |
| Ingressos reais | Pendente (simulado em desenvolvimento) |
| Mapa | Implementado, com modo simulado para ambientes sem chave do Google Maps |
| Notificações push | Pendente (só preferências de UI) |
| Testes automatizados | Implementado para domínio, stores e serviços; parcial para telas |
| Build de produção (Android/iOS) | Pendente de validação |
