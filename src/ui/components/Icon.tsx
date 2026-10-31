/*
 * One file per glyph: Metro does not tree-shake, so importing from the package
 * root would ship all ~1,800 Lucide icons in the bundle.
 */
import Activity from 'lucide-react-native/icons/activity';
import Calendar from 'lucide-react-native/icons/calendar';
import Car from 'lucide-react-native/icons/car';
import Check from 'lucide-react-native/icons/check';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Clock from 'lucide-react-native/icons/clock';
import Cloud from 'lucide-react-native/icons/cloud';
import CloudRainWind from 'lucide-react-native/icons/cloud-rain-wind';
import Fish from 'lucide-react-native/icons/fish';
import Footprints from 'lucide-react-native/icons/footprints';
import Gauge from 'lucide-react-native/icons/gauge';
import ImagePlus from 'lucide-react-native/icons/image-plus';
import Layers from 'lucide-react-native/icons/layers';
import Lightbulb from 'lucide-react-native/icons/lightbulb';
import List from 'lucide-react-native/icons/list';
import MapIcon from 'lucide-react-native/icons/map';
import MapPin from 'lucide-react-native/icons/map-pin';
import Moon from 'lucide-react-native/icons/moon';
import MoonStar from 'lucide-react-native/icons/moon-star';
import Mountain from 'lucide-react-native/icons/mountain';
import NotebookPen from 'lucide-react-native/icons/notebook-pen';
import Pencil from 'lucide-react-native/icons/pencil';
import Play from 'lucide-react-native/icons/play';
import RefreshCw from 'lucide-react-native/icons/refresh-cw';
import Route from 'lucide-react-native/icons/route';
import Search from 'lucide-react-native/icons/search';
import Settings from 'lucide-react-native/icons/settings';
import Star from 'lucide-react-native/icons/star';
import Sun from 'lucide-react-native/icons/sun';
import Sunrise from 'lucide-react-native/icons/sunrise';
import Thermometer from 'lucide-react-native/icons/thermometer';
import User from 'lucide-react-native/icons/user';
import Waves from 'lucide-react-native/icons/waves-horizontal';
import WifiOff from 'lucide-react-native/icons/wifi-off';
import Wind from 'lucide-react-native/icons/wind';
import X from 'lucide-react-native/icons/x';
import { Platform } from 'react-native';

import { useColors } from '../theme';
import { ICON_STROKE_WIDTH, iconSize } from '../tokens';

/** Icon names are data: adding one is a line here, never a change in a screen. */
const ICONS = {
  activity: Activity,
  calendar: Calendar,
  car: Car,
  check: Check,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  clock: Clock,
  cloud: Cloud,
  'cloud-rain-wind': CloudRainWind,
  fish: Fish,
  footprints: Footprints,
  gauge: Gauge,
  'image-plus': ImagePlus,
  layers: Layers,
  lightbulb: Lightbulb,
  list: List,
  map: MapIcon,
  'map-pin': MapPin,
  moon: Moon,
  'moon-star': MoonStar,
  mountain: Mountain,
  'notebook-pen': NotebookPen,
  pencil: Pencil,
  play: Play,
  refresh: RefreshCw,
  route: Route,
  search: Search,
  settings: Settings,
  star: Star,
  sun: Sun,
  sunrise: Sunrise,
  thermometer: Thermometer,
  user: User,
  waves: Waves,
  'wifi-off': WifiOff,
  wind: Wind,
  x: X,
} as const;

export type IconName = keyof typeof ICONS;

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/*
 * Hidden from screen readers. In the browser the glyph is a bare <svg>, which
 * knows `aria-hidden` but not the native `accessibilityElementsHidden`.
 */
const HIDDEN =
  Platform.OS === 'web'
    ? { 'aria-hidden': true }
    : {
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants' as const,
      };

/** Decorative by default — labels come from the surrounding pressable. */
export function Icon({
  name,
  size = iconSize.inline,
  color: colorProp,
  strokeWidth = ICON_STROKE_WIDTH,
}: IconProps): React.JSX.Element {
  const colors = useColors();
  const color = colorProp ?? colors.text;
  const Glyph = ICONS[name];
  return <Glyph size={size} color={color} strokeWidth={strokeWidth} {...HIDDEN} />;
}
