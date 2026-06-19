/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    // Lightened from #F0F0F3 → #F7F8FA so translucent grey dividers drawn on
    // top gain contrast against the card surface.
    backgroundElement: '#F7F8FA',
    // Adjusted from #E0E1E6 → #E9EBEF to maintain the visible active-state
    // delta relative to the new lighter backgroundElement.
    backgroundSelected: '#E9EBEF',
    textSecondary: '#60646C',
    /** Dedicated border / divider color — decoupled from textSecondary so
     *  divider prominence can be tuned independently. */
    border: '#D7D9DE',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    // Dark mode: kept at #212225 (not lightened) — dark dividers are light lines
    // on a dark surface, so lightening the card would *reduce* divider contrast.
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    /** Dark-mode border — slightly lighter than backgroundSelected for
     *  visibility against the dark card surface. */
    border: '#3A3D42',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
