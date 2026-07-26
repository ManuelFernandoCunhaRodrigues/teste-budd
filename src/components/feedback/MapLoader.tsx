import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

/**
 * A paper map unfolding, shown while the map screen locates nearby venues.
 *
 * Each panel clips the same 144×104 illustration at a different offset, so the
 * three folds read as one continuous map.
 */
export function MapLoader() {
  const reduceMotion = useReducedMotion();
  const fold = useSharedValue(reduceMotion ? 0 : 1);

  useEffect(() => {
    if (reduceMotion) return;

    fold.value = withRepeat(
      withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [fold, reduceMotion]);

  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 520 }, { rotateY: `${-78 * fold.value}deg` }],
  }));

  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 520 }, { rotateY: `${78 * fold.value}deg` }],
  }));

  return (
    <View className="h-[170px] w-[190px] items-center justify-center">
      <View className="h-[104px] flex-row items-stretch">
        <Animated.View
          style={[
            { width: 44, overflow: 'hidden', backgroundColor: 'rgba(118,235,60,0.10)' },
            leftStyle,
          ]}
        >
          <MapArtwork offsetX={0} />
        </Animated.View>

        <View
          style={{ width: 56, overflow: 'hidden', backgroundColor: 'rgba(118,235,60,0.04)' }}
        >
          <MapArtwork offsetX={-44} />
        </View>

        <Animated.View
          style={[
            { width: 44, overflow: 'hidden', backgroundColor: 'rgba(118,235,60,0.10)' },
            rightStyle,
          ]}
        >
          <MapArtwork offsetX={-100} />
        </Animated.View>
      </View>
    </View>
  );
}

/** The shared map illustration, shifted horizontally to fill each fold. */
function MapArtwork({ offsetX }: { offsetX: number }) {
  return (
    <View style={{ position: 'absolute', top: 0, left: offsetX }}>
      <Svg fill="none" height={104} viewBox="0 0 144 104" width={144}>
        <Rect
          height={100.8}
          rx={5}
          stroke={colors.flame}
          strokeWidth={3.2}
          width={140.8}
          x={1.6}
          y={1.6}
        />
        <Path d="M44 0 L44 104" stroke={colors.flameDark} strokeWidth={2.4} />
        <Path d="M100 0 L100 104" stroke={colors.flameDark} strokeWidth={2.4} />
        <Path
          d="M0 26 C 34 62, 92 14, 144 46"
          fill="none"
          stroke={colors.flame}
          strokeWidth={2.6}
        />
        <Path
          d="M0 84 C 46 66, 78 96, 144 74"
          fill="none"
          stroke={colors.flame}
          strokeWidth={2.6}
        />
        <Path
          d="M58 104 C 66 82, 52 70, 62 44"
          fill="none"
          stroke={colors.flameLight}
          strokeWidth={2.2}
        />
      </Svg>
    </View>
  );
}
