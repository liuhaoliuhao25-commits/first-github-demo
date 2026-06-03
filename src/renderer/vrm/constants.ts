export interface PetExpression {
  name: string
  weight: number
}

export interface PresetExpressions {
  neutral: PetExpression
  happy: PetExpression
  angry: PetExpression
  sad: PetExpression
  surprised: PetExpression
  blink: PetExpression
  a: PetExpression
  i: PetExpression
  u: PetExpression
  e: PetExpression
  o: PetExpression
}

// VRM 标准表情预设
export const EXPRESSION_PRESETS: PresetExpressions = {
  neutral: { name: 'neutral', weight: 1.0 },
  happy: { name: 'happy', weight: 1.0 },
  angry: { name: 'angry', weight: 1.0 },
  sad: { name: 'sad', weight: 1.0 },
  surprised: { name: 'surprised', weight: 1.0 },
  blink: { name: 'blink', weight: 1.0 },
  a: { name: 'a', weight: 1.0 },
  i: { name: 'i', weight: 1.0 },
  u: { name: 'u', weight: 1.0 },
  e: { name: 'e', weight: 1.0 },
  o: { name: 'o', weight: 1.0 },
}

// 表情与情绪的映射
export const EMOTION_EXPRESSION_MAP: Record<string, string> = {
  neutral: 'neutral',
  happy: 'happy',
  joy: 'happy',
  angry: 'angry',
  mad: 'angry',
  sad: 'sad',
  surprised: 'surprised',
  fear: 'surprised',
  love: 'happy',
  relaxed: 'neutral',
}

// 音素到口型的映射 (用于语音同步)
export const PHONEME_VISEME_MAP: Record<string, string> = {
  'aa': 'a',
  'ae': 'e',
  'ah': 'u',
  'ao': 'o',
  'aw': 'o',
  'ay': 'i',
  'b': 'u',
  'ch': 'i',
  'd': 'u',
  'dh': 'e',
  'eh': 'e',
  'er': 'u',
  'ey': 'i',
  'f': 'f',
  'g': 'u',
  'hh': 'u',
  'ih': 'i',
  'iy': 'i',
  'jh': 'i',
  'k': 'u',
  'l': 'e',
  'm': 'u',
  'n': 'u',
  'ng': 'u',
  'ow': 'o',
  'oy': 'o',
  'p': 'u',
  'r': 'u',
  's': 'i',
  'sh': 'u',
  't': 'u',
  'th': 'e',
  'uh': 'u',
  'uw': 'u',
  'v': 'f',
  'w': 'u',
  'y': 'i',
  'z': 'i',
  'zh': 'u',
}

export interface AnimationPreset {
  name: string
  clipName: string
  duration?: number
  loop?: boolean
}

// 常用动画预设
export const ANIMATION_PRESETS: AnimationPreset[] = [
  { name: 'idle', clipName: 'Idle', loop: true },
  { name: 'wave', clipName: 'WaveHello', loop: false },
  { name: 'nod', clipName: 'Nodding', loop: true },
  { name: 'jump', clipName: 'Jump', loop: false },
  { name: 'dance', clipName: 'Dance', loop: true },
  { name: 'sitting', clipName: 'Sitting', loop: true },
  { name: 'walking', clipName: 'Walking', loop: true },
]

export function getExpressionForEmotion(emotion: string): string {
  return EMOTION_EXPRESSION_MAP[emotion.toLowerCase()] || 'neutral'
}

export function getVisemeForPhoneme(phoneme: string): string {
  return PHONEME_VISEME_MAP[phoneme.toLowerCase()] || 'u'
}

export function getAnimationClip(name: string): string | undefined {
  const preset = ANIMATION_PRESETS.find((p) => p.name === name)
  return preset?.clipName
}
