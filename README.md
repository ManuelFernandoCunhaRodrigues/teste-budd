# budd

Aplicativo mobile de bares, eventos e ingressos.

## Plataformas suportadas

**Android e iOS.**

Web **não** é uma plataforma alvo. O app depende de módulos nativos sem
equivalente direto no navegador — `react-native-maps` é importado sem separação
por plataforma em `MapScreen` e `EventMiniMap`, e `expo-secure-store`, usado para
guardar o token de sessão, não existe na web. Não há script `web`, configuração
`expo.web` nem dependência de `react-native-web` no projeto.

`react-dom` continua nas dependências e **não deve ser removido**: ele entra na
árvore por meio do `expo-router` (que depende de `@radix-ui/*`), e a versão está
fixada em `19.2.3` para casar com o `react` do SDK 57 — sem esse pin o
`npm install` falha com conflito de peer dependency.

## Requisitos

- Node 22.13+ (SDK 57)
- Expo SDK 57 (React Native 0.86, React 19.2.3)
- Android: Expo Go compatível com SDK 57 ou development build

## Configuração

Copie `.env.example` para `.env` e ajuste. Nenhuma chave real deve ser commitada.

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | não | Base da API. Sem ela, os fluxos críticos reportam indisponibilidade em vez de simular sucesso. |
| `EXPO_PUBLIC_API_TIMEOUT` | não | Timeout das requisições, em ms. |
| `EXPO_PUBLIC_ENABLE_DEV_BACKEND` | não | Backend in-memory de desenvolvimento. Desligado por padrão e travado atrás de `__DEV__`. |
| `GOOGLE_MAPS_ANDROID_API_KEY` | **em build nativo** | Chave do Google Maps para Android. Lida por `app.config.ts`; o build falha sem ela. |

### Chave do Google Maps

Só o **Android** precisa de chave. O app usa `PROVIDER_DEFAULT`, que é Google
Maps no Android e Apple Maps no iOS — o iOS não consome chave do Google.

No Expo Go a chave não é necessária (o Expo Go traz as próprias credenciais), e é
exatamente por isso que **Expo Go não valida esse ponto**: o mapa pode funcionar
lá e ficar em branco no APK.

A chave deve ser restringida no Google Cloud Console, porque uma chave embarcada
no APK é extraível — variável de ambiente protege o repositório, não o binário:

- restringir por nome de pacote (`com.budd.app`);
- restringir pelo fingerprint SHA-1 do certificado de assinatura (o de upload e o
  de release do Play App Signing);
- habilitar apenas a **Maps SDK for Android**.

Para builds EAS, use secrets em vez de `.env`:

```bash
eas secret:create --scope project --name GOOGLE_MAPS_ANDROID_API_KEY --value <chave>
```

## Scripts

| Script | Uso |
| --- | --- |
| `npm start` | Dev server |
| `npm run android` / `npm run ios` | Dev server já apontando para a plataforma |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint via `expo lint` |
| `npm test` | Jest (jest-expo + Testing Library) |
| `npm run doctor` | `expo-doctor` |

## Identificadores nativos

`android.package` e `ios.bundleIdentifier` são `com.budd.app`. Ambos foram
definidos agora — o projeto nunca teve identificador, então nenhum build
publicado é afetado. **Confirme esse valor antes do primeiro envio às lojas**:
depois da primeira publicação o identificador não pode mais ser alterado sem
criar um app novo.
