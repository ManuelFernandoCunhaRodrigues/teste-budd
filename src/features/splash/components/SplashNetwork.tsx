import { memo } from 'react';
import Animated, {
  useAnimatedProps,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@/theme';

import {
  SPLASH_LINKS,
  SPLASH_NODES,
  SPLASH_PHASES,
  linkPath,
  nodeDelayFraction,
  phaseProgress,
} from '../splashTimeline';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface SplashNetworkProps {
  /** Overall sequence progress, 0 to 1. */
  progress: SharedValue<number>;
  size: number;
}

/** Longest a route can be in the 100×100 viewBox; used as the dash length. */
const PATH_LENGTH = 160;

/**
 * Places and experiences appearing, then finding each other.
 *
 * Everything is driven from one shared value on the UI thread: nodes read their
 * slot in the scatter phase, routes read the connect phase, and the whole group
 * reads the converge phase to gather towards the centre. No component holds
 * state, so nothing re-renders while it plays.
 */
export const SplashNetwork = memo(function SplashNetwork({
  progress,
  size,
}: SplashNetworkProps) {
  return (
    <Svg
      // Decorative: the screen announces itself once, and narrating seven dots
      // and seven curves would tell a screen-reader user nothing.
      accessibilityElementsHidden
      height={size}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      viewBox="0 0 100 100"
      width={size}
    >
      {SPLASH_LINKS.map((link, index) => (
        <Route index={index} key={`${link.from}-${link.to}`} link={link} progress={progress} />
      ))}

      {SPLASH_NODES.map((node, index) => (
        <Node index={index} key={`${node.x}-${node.y}`} node={node} progress={progress} />
      ))}
    </Svg>
  );
});

function Node({
  node,
  index,
  progress,
}: {
  node: (typeof SPLASH_NODES)[number];
  index: number;
  progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => {
    const spark = phaseProgress(progress.value, SPLASH_PHASES.spark);
    const scatter = phaseProgress(progress.value, SPLASH_PHASES.scatter);
    const converge = phaseProgress(progress.value, SPLASH_PHASES.converge);

    // The first node is the spark that starts everything; the rest wait their
    // slot in the scatter phase.
    const delay = nodeDelayFraction(index);
    const appear =
      index === 0 ? spark : Math.max(0, Math.min(1, (scatter - delay) / (1 - delay || 1)));

    // Everything drifts towards the centre as the network gathers.
    const cx = node.x + (50 - node.x) * converge;
    const cy = node.y + (58 - node.y) * converge;

    return {
      cx,
      cy,
      r: node.r * appear * (1 - converge * 0.65),
      opacity: appear * (1 - converge),
    };
  });

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      fill={index % 3 === 0 ? colors.flame : index % 3 === 1 ? colors.primary : colors.flameLight}
    />
  );
}

function Route({
  link,
  index,
  progress,
}: {
  link: (typeof SPLASH_LINKS)[number];
  index: number;
  progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => {
    const connect = phaseProgress(progress.value, SPLASH_PHASES.connect);
    const converge = phaseProgress(progress.value, SPLASH_PHASES.converge);

    // Routes draw one after another rather than all at once, which is what makes
    // it read as a map filling in instead of a diagram switching on.
    const slot = (index / SPLASH_LINKS.length) * 0.5;
    const drawn = Math.max(0, Math.min(1, (connect - slot) / (1 - slot || 1)));

    return {
      strokeDashoffset: PATH_LENGTH * (1 - drawn),
      opacity: drawn * (1 - converge),
    };
  });

  return (
    <AnimatedPath
      animatedProps={animatedProps}
      d={linkPath(link.from, link.to, link.bow)}
      fill="none"
      stroke={colors.primary}
      strokeDasharray={PATH_LENGTH}
      strokeLinecap="round"
      strokeWidth={0.8}
    />
  );
}
