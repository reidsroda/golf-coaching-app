import { useEffect, useRef } from 'react'
import { View, Animated, Easing } from 'react-native'
import Svg, {
  Circle, Ellipse, Defs, RadialGradient, Stop, Path, G, ClipPath
} from 'react-native-svg'

// ─── Tier color config ────────────────────────────────────────
export const TIER_COLORS: Record<string, {
  base: string; mid: string; bright: string; glow: string
}> = {
  bronze:      { base: '#5C2E18', mid: '#C26B3C', bright: '#E8A870', glow: '#C26B3C' },
  silver:      { base: '#4B5563', mid: '#9CA3AF', bright: '#E2E8F0', glow: '#9CA3AF' },
  gold:        { base: '#7A4F08', mid: '#C9A23E', bright: '#F5D878', glow: '#C9A23E' },
  diamond:     { base: '#1A3A6A', mid: '#4A9BE8', bright: '#BEE0FA', glow: '#4A9BE8' },
  master:      { base: '#4A0A0A', mid: '#B14B3A', bright: '#E87A6A', glow: '#B14B3A' },
  grandmaster: { base: '#2E0F50', mid: '#8B5CF6', bright: '#D4BBFE', glow: '#8B5CF6' },
}

export type SubTier = 'I' | 'II' | 'III'

// ─── Generate dimple positions using Fibonacci sphere ─────────
function generateDimples(R: number) {
  const count = Math.round(R * R * 0.52)
  const golden = Math.PI * (3 - Math.sqrt(5))
  const dr = R * 0.068
  const dimples: Array<{
    px: number; py: number; dr: number
    shadowAlpha: number; hlAlpha: number; shadowOffset: number; showHl: boolean
  }> = []

  for (let i = 0; i < count; i++) {
    const y3d = 1 - (i / (count - 1)) * 2
    const latR = Math.sqrt(Math.max(0, 1 - y3d * y3d))
    const theta = golden * i
    const x3d = Math.cos(theta) * latR
    const z3d = Math.sin(theta) * latR

    if (z3d < -0.15) continue

    const tiltX = 0.08, tiltY = -0.05
    const px = (x3d + tiltX * z3d) * R
    const py = -(y3d + tiltY * z3d) * R

    if (Math.sqrt(px * px + py * py) > R - dr * 1.2) continue

    const depth = z3d
    const depthFactor = (depth + 0.15) / 1.15
    const litness = Math.max(0, -x3d * 0.4 + y3d * 0.4 + z3d * 0.82)
    const shadowAlpha = 0.08 + depthFactor * 0.16
    const hlAlpha = 0.06 + depthFactor * 0.14
    const shadowOffset = dr * (0.18 + litness * 0.12)

    dimples.push({ px, py, dr, shadowAlpha, hlAlpha, shadowOffset, showHl: depthFactor > 0.3 })
  }
  return dimples
}

// ─── Golf ball SVG ─────────────────────────────────────────────
function GolfBallSvg({ colors, size }: { colors: typeof TIER_COLORS[string]; size: number }) {
  const R = size / 2
  const cx = R, cy = R
  const dimples = generateDimples(R)
  const clipId = `bc_${size}`
  const gradId = `bg_${size}`
  const hlId   = `bh_${size}`

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <ClipPath id={clipId}>
          <Circle cx={cx} cy={cy} r={R - 0.5} />
        </ClipPath>
        <RadialGradient id={gradId} cx="28%" cy="25%" r="75%">
          <Stop offset="0%"   stopColor={colors.bright} />
          <Stop offset="18%"  stopColor={colors.bright} />
          <Stop offset="50%"  stopColor={colors.mid}    stopOpacity="0.92" />
          <Stop offset="82%"  stopColor={colors.base} />
          <Stop offset="100%" stopColor="#050302" />
        </RadialGradient>
        <RadialGradient id={hlId} cx="22%" cy="20%" r="40%">
          <Stop offset="0%"   stopColor="rgba(255,255,255,0.60)" />
          <Stop offset="45%"  stopColor="rgba(255,255,255,0.24)" />
          <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </RadialGradient>
      </Defs>

      {/* Sphere base */}
      <Circle cx={cx} cy={cy} r={R - 0.5} fill={`url(#${gradId})`} />

      {/* Dimples clipped to ball */}
      <G clipPath={`url(#${clipId})`}>
        {dimples.map((d, i) => {
          const px = cx + d.px
          const py = cy + d.py
          return (
            <G key={i}>
              {/* Shadow crescent */}
              <Circle
                cx={px + d.shadowOffset}
                cy={py + d.shadowOffset}
                r={d.dr}
                fill={`rgba(0,0,0,${(d.shadowAlpha * 1.4).toFixed(2)})`}
              />
              {/* Dimple bowl */}
              <Circle
                cx={px} cy={py} r={d.dr}
                fill={`rgba(0,0,0,${d.shadowAlpha.toFixed(2)})`}
              />
              {/* Rim highlight */}
              {d.showHl && (
                <Circle
                  cx={px - d.dr * 0.32}
                  cy={py - d.dr * 0.32}
                  r={d.dr * 0.34}
                  fill={`rgba(255,255,255,${d.hlAlpha.toFixed(2)})`}
                />
              )}
            </G>
          )
        })}
      </G>

      {/* Specular highlight */}
      <Ellipse
        cx={cx - R * 0.22}
        cy={cy - R * 0.28}
        rx={R * 0.26}
        ry={R * 0.15}
        fill={`url(#${hlId})`}
        transform={`rotate(-22, ${cx - R * 0.22}, ${cy - R * 0.28})`}
      />

      {/* Rim shadow */}
      <Circle cx={cx} cy={cy} r={R - 0.5} fill="none" stroke="rgba(0,0,0,0.32)" strokeWidth={R * 0.045} />
    </Svg>
  )
}

// ─── Animated diamond ─────────────────────────────────────────
function AnimatedDiamond({
  containerSize, color, opacity, strokeWidth, scaleMin, scaleMax, duration
}: {
  containerSize: number; color: string; opacity: number
  strokeWidth: number; scaleMin: number; scaleMax: number; duration: number
}) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start()
  }, [])

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [scaleMin, scaleMax] })
  const S = containerSize
  const H = S / 2
  const gradId = `dg_${S}_${Math.round(opacity * 100)}`

  return (
    <Animated.View style={{ position: 'absolute', width: S, height: S, transform: [{ scale }] }}>
      <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={color} stopOpacity={opacity * 0.4} />
            <Stop offset="55%"  stopColor={color} stopOpacity={opacity * 0.2} />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Path d={`M${H},2 L${S-2},${H} L${H},${S-2} L2,${H} Z`} fill={`url(#${gradId})`} />
        <Path d={`M${H},2 L${S-2},${H} L${H},${S-2} L2,${H} Z`} fill="none" stroke={color} strokeWidth={strokeWidth} strokeOpacity={opacity} strokeLinejoin="round" />
        {[[H,2],[S-2,H],[H,S-2],[2,H]].map(([px,py],i) => (
          <Circle key={i} cx={px} cy={py} r={2} fill={color} fillOpacity={opacity * 0.9} />
        ))}
      </Svg>
    </Animated.View>
  )
}

// ─── Main RankBadge ───────────────────────────────────────────
type Props = { tier: string; subTier: SubTier; size?: number }

export function RankBadge({ tier, subTier, size = 80 }: Props) {
  const colors = TIER_COLORS[tier] || TIER_COLORS.bronze
  const innerD = size * 1.58
  const outerD = size * 2.12
  const containerSize = subTier === 'III' ? outerD + 8 : subTier === 'II' ? innerD + 8 : size

  return (
    <View style={{ width: containerSize, height: containerSize, alignItems: 'center', justifyContent: 'center' }}>
      {subTier === 'III' && (
        <AnimatedDiamond containerSize={outerD} color={colors.glow} opacity={0.28} strokeWidth={1.5} scaleMin={0.91} scaleMax={1.09} duration={2200} />
      )}
      {(subTier === 'II' || subTier === 'III') && (
        <AnimatedDiamond containerSize={innerD} color={colors.glow} opacity={subTier === 'III' ? 0.68 : 0.75} strokeWidth={2} scaleMin={0.94} scaleMax={1.06} duration={1700} />
      )}
      <View style={{ position: 'absolute' }}>
        <GolfBallSvg colors={colors} size={size} />
      </View>
    </View>
  )
}

// ─── Rank data ────────────────────────────────────────────────
export type Rank = {
  name: string; tier: string; subTier: SubTier
  color: string; minHdcp: number; maxHdcp: number
  worstStat: string; motivation: string
}

export const RANKS: Rank[] = [
  { name: 'Grand Master', tier: 'grandmaster', subTier: 'III', color: '#8B5CF6', minHdcp: -10, maxHdcp: 0,  worstStat: 'course management', motivation: 'Elite status. Focus on scoring even lower through smart course management.' },
  { name: 'Master',       tier: 'master',      subTier: 'III', color: '#B14B3A', minHdcp: 0,   maxHdcp: 2,  worstStat: 'approach play',     motivation: 'Tighten your approach shots to make Grand Master within reach.' },
  { name: 'Diamond III',  tier: 'diamond',     subTier: 'III', color: '#4A9BE8', minHdcp: 2,   maxHdcp: 5,  worstStat: 'iron play',         motivation: 'Sharpen your irons to climb into the Master tier.' },
  { name: 'Diamond II',   tier: 'diamond',     subTier: 'II',  color: '#4A9BE8', minHdcp: 5,   maxHdcp: 8,  worstStat: 'chipping',          motivation: 'A sharper short game will unlock Diamond III.' },
  { name: 'Diamond I',    tier: 'diamond',     subTier: 'I',   color: '#4A9BE8', minHdcp: 8,   maxHdcp: 11, worstStat: 'putting',           motivation: 'Fewer 3-putts per round is your fastest path to Diamond II.' },
  { name: 'Gold III',     tier: 'gold',        subTier: 'III', color: '#C9A23E', minHdcp: 11,  maxHdcp: 14, worstStat: 'driving accuracy',  motivation: 'More fairways hit will open up shorter approaches to Diamond I.' },
  { name: 'Gold II',      tier: 'gold',        subTier: 'II',  color: '#C9A23E', minHdcp: 14,  maxHdcp: 17, worstStat: 'greens in reg',     motivation: 'Hitting more greens will consistently lower your scores toward Gold III.' },
  { name: 'Gold I',       tier: 'gold',        subTier: 'I',   color: '#C9A23E', minHdcp: 17,  maxHdcp: 20, worstStat: 'putting',           motivation: 'Cutting 2 putts per round could move you up a full tier to Gold II.' },
  { name: 'Silver III',   tier: 'silver',      subTier: 'III', color: '#9CA3AF', minHdcp: 20,  maxHdcp: 23, worstStat: 'chipping',          motivation: 'Getting up and down more often is the key to reaching Gold I.' },
  { name: 'Silver II',    tier: 'silver',      subTier: 'II',  color: '#9CA3AF', minHdcp: 23,  maxHdcp: 26, worstStat: 'driving',           motivation: 'Add 20 yards off the tee and watch your scores drop toward Silver III.' },
  { name: 'Silver I',     tier: 'silver',      subTier: 'I',   color: '#9CA3AF', minHdcp: 26,  maxHdcp: 29, worstStat: 'iron consistency',  motivation: 'More consistent iron shots will get you to Silver II faster than anything.' },
  { name: 'Bronze III',   tier: 'bronze',      subTier: 'III', color: '#C26B3C', minHdcp: 29,  maxHdcp: 32, worstStat: 'penalty avoidance', motivation: 'Eliminate one penalty stroke per round and Silver I is yours.' },
  { name: 'Bronze II',    tier: 'bronze',      subTier: 'II',  color: '#C26B3C', minHdcp: 32,  maxHdcp: 36, worstStat: 'course management', motivation: 'Smarter club selection will immediately cut strokes toward Bronze III.' },
  { name: 'Bronze I',     tier: 'bronze',      subTier: 'I',   color: '#C26B3C', minHdcp: 36,  maxHdcp: 99, worstStat: 'fundamentals',     motivation: 'Keep logging rounds — every round teaches you something. Bronze II is close.' },
]

export function getRank(handicap: number): Rank {
  return RANKS.find(r => handicap >= r.minHdcp && handicap < r.maxHdcp) || RANKS[RANKS.length - 1]
}