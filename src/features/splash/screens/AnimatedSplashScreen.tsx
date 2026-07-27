import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { BuddLogoReveal } from '../components/BuddLogoReveal';
import { SplashNetwork } from '../components/SplashNetwork';
import {
  SPLASH_DURATION_MS,
  SPLASH_PHASES,
  SPLASH_REDUCED_DURATION_MS,
  phaseProgress,
} from '../splashTimeline';

export interface AnimatedSplashScreenProps {
  /**
   * Called once, when the sequence finishes.
   *
   * The screen never navigates itself: whether it is time to leave depends on
   * the bootstrap too, and only the route knows that.
   */
  onFinish: () => void;
}

/** Share of the shorter side the drawing occupies. */
const CANVAS_RATIO = 0.62;

/**
 * The opening sequence: points appear, find each other, and resolve into the
 * budd mark.
 *
 * One shared value drives every element. Each component reads its own slice of
 * it through `phaseProgress`, so the whole thing runs on the UI thread from a
 * single timing animation — no chain of timers to fall out of step, and nothing
 * that re-renders mid-flight.
 *
 * Under reduced motion the network is skipped entirely and the mark fades in
 * over 600ms. That is a different sequence, not a slower one: the point of the
 * setting is to avoid the movement, and stretching the same choreography would
 * miss it.
 */
export function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const progress = useSharedValue(0);
  const canvas = Math.min(width, height) * CANVAS_RATIO;

  useEffect(() => {
    // Reduced motion jumps straight to the reveal phase and fades the mark in,
    // so the caller still gets its single `onFinish` at a sensible moment.
    const from = reduceMotion ? SPLASH_PHASES.reveal.start : 0;
    const duration = reduceMotion ? SPLASH_REDUCED_DURATION_MS : SPLASH_DURATION_MS;

    progress.value = from;
    progress.value = withTiming(
      1,
      { duration, easing: Easing.bezier(0.2, 0, 0, 1) },
      (completed) => {
        // Only on a real finish: a cancelled animation means the screen went
        // away, and calling back then would navigate from a dead component.
        if (completed) runOnJS(onFinish)();
      },
    );
  }, [onFinish, progress, reduceMotion]);

  const networkStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0 : 1 - phaseProgress(progress.value, SPLASH_PHASES.reveal),
  }));

  const markStyle = useAnimatedStyle(() => {
    const reveal = phaseProgress(progress.value, SPLASH_PHASES.reveal);

    return {
      opacity: reveal,
      // A breath rather than a pop: the mark settles into place instead of
      // announcing itself.
      transform: [{ scale: 0.94 + reveal * 0.06 }],
    };
  });

  const captionStyle = useAnimatedStyle(() => {
    const reveal = phaseProgress(progress.value, SPLASH_PHASES.reveal);
    return { opacity: Math.max(0, (reveal - 0.55) / 0.45) };
  });

  return (
    <View
      accessibilityLabel="Abrindo o Budd"
      accessibilityRole="progressbar"
      className="flex-1 items-center justify-center bg-bg"
    >
      <View style={{ width: canvas, height: canvas }}>
        <Animated.View style={[{ position: 'absolute', inset: 0 }, networkStyle]}>
          <SplashNetwork progress={progress} size={canvas} />
        </Animated.View>

        <Animated.View style={[{ position: 'absolute', inset: 0 }, markStyle]}>
          <BuddLogoReveal progress={progress} size={canvas} />
        </Animated.View>
      </View>

      <Animated.Text
        className="mt-6 text-md text-text-muted"
        // Hidden from assistive tech: the container above already announces the
        // screen, and this is atmosphere rather than information.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={captionStyle}
      >
        Seu próximo rolê começa aqui.
      </Animated.Text>
    </View>
  );
}
