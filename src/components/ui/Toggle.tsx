import { View } from 'react-native';

import { cn } from '@/utils/cn';

import { Touchable } from './Touchable';

export interface ToggleProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  /** Required — the switch has no visible label of its own. */
  accessibilityLabel: string;
  className?: string;
}

/**
 * Custom switch matching the design's 46×26 track.
 *
 * Uses the platform `switch` accessibility role so screen readers announce and
 * operate it exactly like a native control.
 */
export function Toggle({ value, onValueChange, accessibilityLabel, className }: ToggleProps) {
  return (
    <Touchable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      className={cn(
        'h-[26px] w-[46px] justify-center rounded-2xl px-[3px]',
        value ? 'bg-primary' : 'bg-[#3A3A3A]',
        className,
      )}
      feedback="none"
      hitSlop={10}
      onPress={() => onValueChange(!value)}
    >
      <View
        className="h-5 w-5 rounded-full bg-white"
        style={{ transform: [{ translateX: value ? 20 : 0 }] }}
      />
    </Touchable>
  );
}
