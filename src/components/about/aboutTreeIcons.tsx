import type { LucideIcon } from 'lucide-react'
import {
  Award,
  Briefcase,
  Building2,
  Compass,
  FileText,
  GraduationCap,
  HeartHandshake,
  Lightbulb,
  Mail,
  MapPin,
  Megaphone,
  Monitor,
  Music,
  Rocket,
  ShieldCheck,
  SmilePlus,
  Sprout,
  Target,
  TrendingUp,
  Users,
  Eye,
  Gem,
  Globe2,
  BadgeCheck,
} from 'lucide-react'
import { COMPANY } from '../../lib/constants'

type CoreValue = (typeof COMPANY.coreValues)[number]
type Area = (typeof COMPANY.areasOfInterest)[number]

type IconProps = {
  size?: number
  className?: string
  strokeWidth?: number
}

export function TreeIcon({
  icon: Icon,
  size = 20,
  className = '',
  strokeWidth = 1.75,
}: IconProps & { icon: LucideIcon }) {
  return <Icon size={size} className={className} strokeWidth={strokeWidth} aria-hidden />
}

export const ABOUT_TREE_SECTION_ICONS = {
  mission: Target,
  vision: Eye,
  values: Gem,
  areas: Compass,
  details: Building2,
} as const

export const CORE_VALUE_ICONS: Record<CoreValue, LucideIcon> = {
  Botho: HeartHandshake,
  Professionalism: Briefcase,
  'Customer satisfaction': SmilePlus,
  Innovation: Lightbulb,
  Excellence: Award,
  Empowerment: Rocket,
  Reliability: ShieldCheck,
  'Sustainable growth / Unemployment reduction': Sprout,
}

export const AREA_ICONS: Record<Area, LucideIcon> = {
  'Entrepreneurship training': Rocket,
  'Career development': TrendingUp,
  'Basic IT services': Monitor,
  'Real estate consulting': Building2,
  'Youth empowerment projects and mentorship': Users,
  'Music education': Music,
  'Academic tuitions': GraduationCap,
  'Platform mass marketing': Megaphone,
  'Basic farming practices': Sprout,
}

export const DETAIL_ICONS = {
  type: FileText,
  business: Briefcase,
  location: MapPin,
  email: Mail,
} as const

export const ROOT_META_ICONS = {
  registration: BadgeCheck,
  headOffice: MapPin,
  reach: Globe2,
} as const
