import { LinearGradient } from 'expo-linear-gradient';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

export interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /** Shorter cover on the sign-up screen, where the form is taller. */
  compact?: boolean;
}

/**
 * WebP rather than PNG: same 1023×1537 artwork, ~470 KB lighter.
 *
 * Metro carries `webp` in its default `assetExts`, and both platforms decode it
 * natively at the versions this SDK targets — Android has since 4.3, iOS since
 * 14. No extra configuration is involved.
 */
const COVER = require('../../../../assets/img-tela-login.webp');
const LOGO = require('../../../../assets/budd-logo-transparente.webp');

/**
 * The logo asset is mostly empty space.
 *
 * The mark sits in the middle of a 1024×1536 canvas, covering roughly 36% of
 * the height and starting about 28% down. Dropping it into a 40pt box would
 * render a 14pt mark parked below where it belongs, so the box is sized from a
 * target *mark* height and pulled up by the margin above it.
 *
 * Cropping the file to its content would delete this arithmetic entirely — the
 * numbers are measured from the asset, not chosen.
 */
const LOGO_ASPECT = 1024 / 1536;
const LOGO_CONTENT_RATIO = 0.36;
const LOGO_TOP_MARGIN_RATIO = 0.28;
const LOGO_MARK_HEIGHT = 44;

const LOGO_BOX_HEIGHT = LOGO_MARK_HEIGHT / LOGO_CONTENT_RATIO;
const LOGO_BOX_WIDTH = LOGO_BOX_HEIGHT * LOGO_ASPECT;
const LOGO_OFFSET_Y = -LOGO_BOX_HEIGHT * LOGO_TOP_MARGIN_RATIO;

/**
 * Shared chrome for sign-in and sign-up: a photographic cover with the form on
 * a sheet overlapping it.
 *
 * The gradient over the photo is not decoration. The artwork is a bright,
 * high-contrast bar scene, and white type laid straight onto it is unreadable
 * wherever a highlight falls; fading it into the page background gives the
 * heading a surface it can always be read against.
 *
 * The sheet is pulled up over the cover so the form starts above the fold on a
 * small screen, and the whole thing scrolls as one under the keyboard.
 */
export function AuthLayout({ title, subtitle, children, compact = false }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-bg"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom, 24) + 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: compact ? 260 : 340 }}>
          <Image
            accessibilityIgnoresInvertColors
            // Decorative: the heading below already names the screen, so an
            // alt text here would only make a screen reader read the mood.
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            resizeMode="cover"
            source={COVER}
            style={{ width: '100%', height: '100%' }}
          />

          <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.65)', colors.background]}
            locations={[0, 0.55, 1]}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}
          />

          <View
            className="absolute left-6 right-6"
            style={{ top: insets.top + 16 + LOGO_OFFSET_Y }}
          >
            <Image
              // Decorative: the heading names the screen, and the mark repeated
              // as alt text would only add noise to a screen reader.
              accessibilityElementsHidden
              accessibilityIgnoresInvertColors
              importantForAccessibility="no-hide-descendants"
              resizeMode="contain"
              source={LOGO}
              style={{ width: LOGO_BOX_WIDTH, height: LOGO_BOX_HEIGHT }}
            />
          </View>
        </View>

        {/* Overlaps the cover, which is what makes the two read as one surface
            instead of a photo with a form parked under it. */}
        <View className="-mt-8 flex-1 rounded-t-3xl bg-bg px-6 pt-7">
          <Text accessibilityRole="header" className="text-5xl font-black text-text">
            {title}
          </Text>
          <Text className="mt-1.5 text-md leading-6 text-text-muted">{subtitle}</Text>

          <View className="mt-6">{children}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
