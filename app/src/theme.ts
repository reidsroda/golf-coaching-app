// Design system — colors, typography, spacing
// Import this in any screen: import { C, F } from '../theme'

export const C = {
  // Surfaces
  pageBg:       '#F1ECE0',
  cardBg:       '#FBF7EC',
  insetBg:      '#F6F0E0',

  // Ink
  ink1:         '#1E2A24',   // primary
  ink2:         '#5C6B5F',   // secondary
  ink3:         '#8E978D',   // tertiary / labels
  hairline:     'rgba(30,42,36,0.10)',
  border:       'rgba(30,42,36,0.18)',

  // Greens
  fairway:      '#2F5A3E',   // primary CTA
  fairwayDark:  '#1E4530',
  fairwayLight: '#7BA98A',
  puttingGreen: '#8FB57E',

  // Accents
  bunker:       '#E5D6AD',
  clay:         '#C26B3C',   // penalties / flag
  flagYellow:   '#D4A93F',   // bogey / caution
  errorRed:     '#B14B3A',   // over par / double bogey+

  // Tee markers
  teeBlack:     '#1E2A24',
  teeBlue:      '#2E5C8A',
  teeWhite:     '#E9E2D0',
  teeGold:      '#C9A23E',
  teeRed:       '#B14B3A',

  // On-dark
  onDark:       '#F1ECE0',
  onDarkMuted:  'rgba(241,236,224,0.60)',
}

export const F = {
  // Fraunces — big numbers, headlines, italic accents
  serif:        'Fraunces_400Regular',
  serifItalic:  'Fraunces_400Regular_Italic',
  serifBold:    'Fraunces_700Bold',
  serifBoldItalic: 'Fraunces_700Bold_Italic',

  // Inter — body, labels, buttons
  sans:         'Inter_400Regular',
  sansMedium:   'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold:     'Inter_700Bold',

  // JetBrains Mono — metadata, yardages, tee names, dates
  mono:         'JetBrainsMono_400Regular',
  monoMedium:   'JetBrainsMono_500Medium',
  monoBold:     'JetBrainsMono_700Bold',
}