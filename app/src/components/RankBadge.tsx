import { useEffect, useRef } from 'react'
import { View, Animated, Easing } from 'react-native'
import Svg, {
  Circle, Ellipse, Path, G, Defs, RadialGradient, Stop, ClipPath
} from 'react-native-svg'

// ─── Tier colors ──────────────────────────────────────────────
export const TIER_COLORS: Record<string, {
  base: string; mid: string; bright: string; glow: string
}> = {
  bronze:      { base: '#4A1E08', mid: '#C26B3C', bright: '#F0B882', glow: '#C26B3C' },
  silver:      { base: '#2E3440', mid: '#9CA3AF', bright: '#F1F5F9', glow: '#9CA3AF' },
  gold:        { base: '#5C3A02', mid: '#C9A23E', bright: '#FAE078', glow: '#C9A23E' },
  diamond:     { base: '#0D2A4A', mid: '#4A9BE8', bright: '#D0EEFF', glow: '#4A9BE8' },
  master:      { base: '#2D0505', mid: '#B14B3A', bright: '#F08070', glow: '#B14B3A' },
  grandmaster: { base: '#1E0840', mid: '#8B5CF6', bright: '#E0D0FF', glow: '#8B5CF6' },
}

export type SubTier = 'I' | 'II' | 'III'

// ─── Dimple generation (Fibonacci sphere) ─────────────────────
type Dimple = {
  px: number; py: number; dr: number
  shadowA: number; hlA: number; sOff: number
  showRim: boolean; showSpec: boolean
}

function generateDimples(R: number): Dimple[] {
  const N = 380
  const golden = Math.PI * (3 - Math.sqrt(5))
  const dimR_base = R * 0.062
  const out: Dimple[] = []

  for (let i = 0; i < N; i++) {
    const y3 = -1 + (2 * i) / (N - 1)
    const r3 = Math.sqrt(Math.max(0, 1 - y3 * y3))
    const theta = golden * i
    const x3 = Math.cos(theta) * r3
    const z3 = Math.sin(theta) * r3

    // Slight rotation for natural look
    const x3r =  x3 * 0.98 + z3 * 0.2
    const z3r = -x3 * 0.20 + z3 * 0.98

    if (z3r < -0.05) continue

    const px = x3r * R
    const py = -y3  * R

    if (Math.sqrt(px * px + py * py) > R - dimR_base * 1.1) continue

    // Vary dimple size slightly (like real balls)
    const sizeVar = 0.85 + 0.3 * Math.abs(Math.sin(i * 1.618))
    const dr = dimR_base * sizeVar

    const depth = (z3r + 0.05) / 1.05
    const lightDot = Math.max(0, -x3r * 0.35 + y3 * 0.35 + z3r * 0.88)
    const shadowA = 0.10 + depth * 0.18
    const hlA    = 0.05 + depth * 0.16
    const sOff   = dr * (0.2 + lightDot * 0.15)

    out.push({
      px, py, dr, shadowA, hlA, sOff,
      showRim:  depth > 0.20,
      showSpec: depth > 0.45,
    })
  }
  return out
}

// ─── Golf ball SVG ─────────────────────────────────────────────
function GolfBallSvg({ colors, size }: { colors: typeof TIER_COLORS[string]; size: number }) {
  const R = size / 2
  const cx = R, cy = R
  const dimples = generateDimples(R)

  const clipId = `bc${size}`
  const sgId   = `sg${size}`
  const rimId  = `rim${size}`
  const hlId   = `hl${size}`
  const flId   = `fl${size}`

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <ClipPath id={clipId}>
          <Circle cx={cx} cy={cy} r={R - 0.5} />
        </ClipPath>
        {/* Sphere gradient */}
        <RadialGradient id={sgId} cx="28%" cy="24%" r="76%">
          <Stop offset="0%"   stopColor={colors.bright} />
          <Stop offset="12%"  stopColor={colors.bright} />
          <Stop offset="38%"  stopColor={colors.mid}    stopOpacity="0.92" />
          <Stop offset="72%"  stopColor={colors.base} />
          <Stop offset="100%" stopColor="#020100" />
        </RadialGradient>
        {/* Rim darkening */}
        <RadialGradient id={rimId} cx="50%" cy="50%" r="50%">
          <Stop offset="70%"  stopColor="rgba(0,0,0,0)" />
          <Stop offset="88%"  stopColor="rgba(0,0,0,0.10)" />
          <Stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </RadialGradient>
        {/* Specular */}
        <RadialGradient id={hlId} cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor="rgba(255,255,255,0.68)" />
          <Stop offset="35%"  stopColor="rgba(255,255,255,0.28)" />
          <Stop offset="70%"  stopColor="rgba(255,255,255,0.08)" />
          <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </RadialGradient>
        {/* Fill light */}
        <RadialGradient id={flId} cx="30%" cy="70%" r="55%">
          <Stop offset="0%"   stopColor="rgba(255,255,255,0.07)" />
          <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </RadialGradient>
      </Defs>

      {/* Sphere base */}
      <Circle cx={cx} cy={cy} r={R - 0.5} fill={`url(#${sgId})`} />

      {/* All dimples clipped to ball */}
      <G clipPath={`url(#${clipId})`}>
        {dimples.map((d, i) => {
          const px = cx + d.px
          const py = cy + d.py
          const sA = d.shadowA.toFixed(2)
          const sA15 = (d.shadowA * 1.5).toFixed(2)
          const sA06 = (d.shadowA * 0.6).toFixed(2)
          return (
            <G key={i}>
              {/* Outer shadow crescent */}
              <Circle cx={px + d.sOff} cy={py + d.sOff} r={d.dr}
                fill={`rgba(0,0,0,${sA15})`} />
              {/* Bowl */}
              <Circle cx={px} cy={py} r={d.dr}
                fill={`rgba(0,0,0,${sA})`} />
              {/* Inner darker center */}
              <Circle cx={px + d.dr * 0.1} cy={py + d.dr * 0.1} r={d.dr * 0.5}
                fill={`rgba(0,0,0,${sA06})`} />
              {/* Rim catch-light arc */}
              {d.showRim && (
                <Path
                  d={`M${px - d.dr * 0.55} ${py - d.dr * 0.1}
                      A${d.dr * 0.38} ${d.dr * 0.38} 0 0 1
                      ${px - d.dr * 0.1} ${py - d.dr * 0.5}`}
                  stroke={`rgba(255,255,255,${(d.hlA * 1.4).toFixed(2)})`}
                  strokeWidth={d.dr * 0.3}
                  fill="none"
                  strokeLinecap="round"
                />
              )}
              {/* Specular dot */}
              {d.showSpec && (
                <Circle cx={px - d.dr * 0.22} cy={py - d.dr * 0.25} r={d.dr * 0.18}
                  fill={`rgba(255,255,255,${(d.hlA * 0.8).toFixed(2)})`} />
              )}
            </G>
          )
        })}

        {/* Atmospheric rim darkening */}
        <Circle cx={cx} cy={cy} r={R - 0.5} fill={`url(#${rimId})`} />
      </G>

      {/* Specular highlight (on top) */}
      <Ellipse
        cx={cx - R * 0.24} cy={cy - R * 0.30}
        rx={R * 0.26} ry={R * 0.14}
        fill={`url(#${hlId})`}
        transform={`rotate(-24, ${cx - R * 0.24}, ${cy - R * 0.30})`}
      />

      {/* Fill light */}
      <Circle cx={cx} cy={cy} r={R - 0.5} fill={`url(#${flId})`} />
    </Svg>
  )
}

// ─── Animated diamond (shared anim ref for sync) ──────────────
function DiamondLayer({
  containerSize, color, opacity, strokeWidth, halfSize, animValue
}: {
  containerSize: number; color: string; opacity: number
  strokeWidth: number; halfSize: number; animValue: Animated.Value
}) {
  const S = containerSize
  const CX = S / 2, CY = S / 2

  const h = animValue.interpolate({
    inputRange: [0, 1], outputRange: [halfSize * 0.92, halfSize * 1.08]
  })

  // Build diamond path from animated half-size
  // We animate scale instead of path for performance
  const scale = animValue.interpolate({
    inputRange: [0, 1], outputRange: [0.92, 1.08]
  })

  const gradId = `dg${Math.round(S)}_${Math.round(opacity * 100)}`

  return (
    <Animated.View style={{
      position: 'absolute', width: S, height: S,
      transform: [{ scale }],
    }}>
      <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={color} stopOpacity={opacity * 0.40} />
            <Stop offset="55%"  stopColor={color} stopOpacity={opacity * 0.20} />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Path
          d={`M${CX},${CY - halfSize} L${CX + halfSize},${CY} L${CX},${CY + halfSize} L${CX - halfSize},${CY} Z`}
          fill={`url(#${gradId})`}
        />
        <Path
          d={`M${CX},${CY - halfSize} L${CX + halfSize},${CY} L${CX},${CY + halfSize} L${CX - halfSize},${CY} Z`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeOpacity={opacity}
          strokeLinejoin="round"
        />
        {/* Corner glints */}
        {[[CX, CY - halfSize], [CX + halfSize, CY], [CX, CY + halfSize], [CX - halfSize, CY]].map(([px, py], i) => (
          <Circle key={i} cx={px} cy={py} r={strokeWidth} fill={color} fillOpacity={opacity * 0.9} />
        ))}
      </Svg>
    </Animated.View>
  )
}

// ─── Main RankBadge ───────────────────────────────────────────
// All badges use the SAME canvas size (BADGE_SIZE) so icons align perfectly.
// Ball is smaller for II/III to make room for diamonds within the same space.

const BADGE_SIZE = 180  // fixed container — all tiers same size

type Props = { tier: string; subTier: SubTier; size?: number }

export function RankBadge({ tier, subTier, size = BADGE_SIZE }: Props) {
  const colors = TIER_COLORS[tier] || TIER_COLORS.bronze

  // Ball radius: tier I = bigger, II/III = smaller to show diamonds
  const ballSize = subTier === 'I' ? Math.round(size * 0.88) : Math.round(size * 0.72)

  // Diamond half-sizes relative to container
  const innerH = size * 0.46   // inner diamond half-size
  const outerH = size * 0.56   // outer diamond half-size (III only)

  // Independent animations for non-unison pulse
  const innerAnim = useRef(new Animated.Value(0)).current
  const outerAnim = useRef(new Animated.Value(0.5)).current  // offset start

  useEffect(() => {
    if (subTier === 'II' || subTier === 'III') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(innerAnim, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(innerAnim, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start()
    }
    if (subTier === 'III') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(outerAnim, { toValue: 1, duration: 2300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(outerAnim, { toValue: 0, duration: 2300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start()
    }
  }, [subTier])

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>

      {/* Tier III: outer large faint diamond — independent pulse */}
      {subTier === 'III' && (
        <DiamondLayer
          containerSize={size}
          color={colors.glow}
          opacity={0.28}
          strokeWidth={1.5}
          halfSize={outerH}
          animValue={outerAnim}
        />
      )}

      {/* Tier II + III: inner diamond — independent pulse */}
      {(subTier === 'II' || subTier === 'III') && (
        <DiamondLayer
          containerSize={size}
          color={colors.glow}
          opacity={subTier === 'III' ? 0.68 : 0.75}
          strokeWidth={2}
          halfSize={innerH}
          animValue={innerAnim}
        />
      )}

      {/* Golf ball — centered, always on top */}
      <View style={{ position: 'absolute' }}>
        <GolfBallSvg colors={colors} size={ballSize} />
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
  { name: 'Master',       tier: 'grandmaster', subTier: 'II',  color: '#8B5CF6', minHdcp: 0,   maxHdcp: 2,  worstStat: 'approach play',     motivation: 'Tighten your approach shots to make Grand Master within reach.' },
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