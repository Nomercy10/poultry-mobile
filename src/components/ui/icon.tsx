import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type IconProps = {
  name: IconName;
  size?: number;
  color: string;
};

/** One icon family across Android, iOS and web. */
export function Icon({ name, size = 24, color }: IconProps) {
  return <MaterialCommunityIcons name={name} size={size} color={color} accessibilityElementsHidden />;
}
