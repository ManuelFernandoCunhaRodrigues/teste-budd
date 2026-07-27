import { memo } from 'react';
import Animated, {
  useAnimatedProps,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

import { colors } from '@/theme';

import { SPLASH_PHASES, phaseProgress } from '../splashTimeline';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

export interface BuddLogoRevealProps {
  progress: SharedValue<number>;
  size: number;
}

/**
 * The mark, drawn as stroke rather than filled.
 *
 * The budd "b" is a stem beside a ring — two shapes a pen can trace, which is
 * what lets the logo be the *result* of the sequence instead of a picture that
 * fades in on top of it. The stem draws first and the ring closes around it, so
 * the eye follows a hand writing the letter.
 *
 * Geometry is in the same 100×100 viewBox as the network, so the two are drawn
 * to one scale and the convergence lands where the mark begins.
 */
const STEM_X = 36;
const STEM_TOP = 20;
const STEM_BOTTOM = 78;
const RING_CX = 56;
const RING_CY = 60;
const RING_R = 20;

const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;
const STEM_LENGTH = STEM_BOTTOM - STEM_TOP;

export const BuddLogoReveal = memo(function BuddLogoReveal({
  progress,
  size,
}: BuddLogoRevealProps) {
  const stemProps = useAnimatedProps(() => {
    const reveal = phaseProgress(progress.value, SPLASH_PHASES.reveal);
    // The stem is done by the time the ring is half closed, so the two reads as
    // one gesture rather than two things starting together.
    const drawn = Math.min(1, reveal / 0.45);

    return { strokeDashoffset: STEM_LENGTH * (1 - drawn), opacity: drawn };
  });

  const ringProps = useAnimatedProps(() => {
    const reveal = phaseProgress(progress.value, SPLASH_PHASES.reveal);
    const drawn = Math.max(0, Math.min(1, (reveal - 0.2) / 0.7));

    return { strokeDashoffset: RING_CIRCUMFERENCE * (1 - drawn), opacity: drawn };
  });

  return (
    <Svg
      accessibilityElementsHidden
      height={size}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      viewBox="0 0 100 100"
      width={size}
    >
      <AnimatedLine
        animatedProps={stemProps}
        stroke={colors.flame}
        strokeDasharray={STEM_LENGTH}
        strokeLinecap="round"
        strokeWidth={7}
        x1={STEM_X}
        x2={STEM_X}
        y1={STEM_TOP}
        y2={STEM_BOTTOM}
      />

      <AnimatedCircle
        animatedProps={ringProps}
        cx={RING_CX}
        cy={RING_CY}
        fill="none"
        r={RING_R}
        stroke={colors.flame}
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeLinecap="round"
        strokeWidth={7}
      />
    </Svg>
  );
});
