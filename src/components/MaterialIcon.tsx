import React from "react";
import {
  Home,
  Favorite,
  Assessment,
  Search,
  Public,
  Settings,
  Star,
  Dashboard,
  Analytics,
  TrendingUp,
  Business,
  School,
  Work,
  Person,
  Group,
  Store,
  ShoppingCart,
  AttachMoney,
  AccountBalance,
  Timeline,
  BarChart,
  PieChart,
  ShowChart,
  InsertChart,
  TableChart,
  BubbleChart,
  ScatterPlot,
  DonutLarge,
  DonutSmall,
  ViewModule,
  ViewList,
  ViewQuilt,
  GridOn,
  GridOff,
  ViewColumn,
  ViewWeek,
  ViewDay,
  ViewAgenda,
  ViewHeadline,
  ViewStream,
  ViewComfy,
  ViewCompact,
  ViewArray,
  ViewCarousel,
  ViewTimeline,
  ViewKanban,
  ViewSidebar,
  ViewQuiltOutlined,
  ViewModuleOutlined,
  ViewListOutlined,
  ViewComfyOutlined,
  ViewCompactOutlined,
  ViewArrayOutlined,
  ViewCarouselOutlined,
  ViewTimelineOutlined,
  ViewKanbanOutlined,
  ViewSidebarOutlined,
  ViewQuiltRounded,
  ViewModuleRounded,
  ViewListRounded,
  ViewComfyRounded,
  ViewCompactRounded,
  ViewArrayRounded,
  ViewCarouselRounded,
  ViewTimelineRounded,
  ViewKanbanRounded,
  ViewSidebarRounded,
  ViewQuiltSharp,
  ViewModuleSharp,
  ViewListSharp,
  ViewComfySharp,
  ViewCompactSharp,
  ViewArraySharp,
  ViewCarouselSharp,
  ViewTimelineSharp,
  ViewKanbanSharp,
  ViewSidebarSharp,
  ViewQuiltTwoTone,
  ViewModuleTwoTone,
  ViewListTwoTone,
  ViewComfyTwoTone,
  ViewCompactTwoTone,
  ViewArrayTwoTone,
  ViewCarouselTwoTone,
  ViewTimelineTwoTone,
  ViewKanbanTwoTone,
  ViewSidebarTwoTone,
  // Additional icons for shipping, retail, transportation, banking, finance, analytics
  DirectionsCar,
  DirectionsBus,
  DirectionsBike,
  DirectionsWalk,
  Flight,
  Train,
  Warehouse,
  Inventory,
  ShoppingBag,
  ShoppingBasket,
  Storefront,
  LocalMall,
  LocalGroceryStore,
  LocalConvenienceStore,
  LocalPharmacy,
  LocalGasStation,
  LocalCarWash,
  LocalLaundryService,
  LocalPizza,
  LocalCafe,
  LocalBar,
  LocalHotel,
  LocalHospital,
  LocalPolice,
  LocalFireDepartment,
  LocalLibrary,
  LocalPostOffice,
  LocalPrintshop,
  LocalFlorist,
  LocalDining,
  LocalDrink,
  LocalActivity,
  LocalAirport,
  LocalAtm,
  LocalTaxi,
  LocalParking,
  LocalPhone,
  LocalPlay,
  LocalMovies,
  LocalOffer,
  LocalSee,
  LocalShipping,
  AccountBalanceWallet,
  AccountBox,
  AccountCircle,
  AccountTree,
  MonetizationOn,
  MoneyOff,
  Payment,
  CreditCard,
  Savings,
  CurrencyExchange,
  CurrencyPound,
  CurrencyYen,
  CurrencyRuble,
  CurrencyFranc,
  CurrencyLira,
  CurrencyYuan,
  CurrencyRupee,
  TrendingDown,
  TrendingFlat,
  InsertChartOutlined,
  InsertChartRounded,
  InsertChartSharp,
  InsertChartTwoTone,
  PieChartOutlined,
  PieChartRounded,
  PieChartSharp,
  PieChartTwoTone,
  BarChartOutlined,
  BarChartRounded,
  BarChartSharp,
  BarChartTwoTone,
  BubbleChartOutlined,
  BubbleChartRounded,
  BubbleChartSharp,
  BubbleChartTwoTone,
  ScatterPlotOutlined,
  ScatterPlotRounded,
  ScatterPlotSharp,
  ScatterPlotTwoTone,
  TimelineOutlined,
  TimelineRounded,
  TimelineSharp,
  TimelineTwoTone,
  AnalyticsOutlined,
  AnalyticsRounded,
  AnalyticsSharp,
  AnalyticsTwoTone,
  AssessmentOutlined,
  AssessmentRounded,
  AssessmentSharp,
  AssessmentTwoTone,
  DashboardOutlined,
  DashboardRounded,
  DashboardSharp,
  DashboardTwoTone,
  Pets,
  PetsOutlined,
  PetsRounded,
  PetsSharp,
  PetsTwoTone,
  VolumeUp,
  NotificationsActive,
  SmartToy,
  SmartToyOutlined,
  SmartToyRounded,
  SmartToySharp,
  SmartToyTwoTone,
  Flag,
} from "@mui/icons-material";

// Icon mapping from string names to Material Icons
const iconMap: Record<
  string,
  React.ComponentType<{ sx?: React.CSSProperties; className?: string }>
> = {
  // Standard menu icons
  home: Home,
  favorites: Favorite,
  "my-reports": Assessment,
  spotter: Search,
  search: Search,
  "full-app": Public,
  settings: Settings,
  flag: Flag,

  // Common icons
  star: Star,
  dashboard: Dashboard,
  analytics: Analytics,
  trending: TrendingUp,
  business: Business,
  school: School,
  work: Work,
  person: Person,
  group: Group,
  store: Store,
  "shopping-cart": ShoppingCart,
  shipping: LocalShipping,
  money: AttachMoney,
  bank: AccountBalance,
  timeline: Timeline,
  "bar-chart": BarChart,
  "pie-chart": PieChart,
  "line-chart": ShowChart,
  chart: InsertChart,
  table: TableChart,
  "bubble-chart": BubbleChart,
  "scatter-plot": ScatterPlot,
  "donut-large": DonutLarge,
  "donut-small": DonutSmall,

  // View icons
  "view-module": ViewModule,
  "view-list": ViewList,
  "view-quilt": ViewQuilt,
  "grid-on": GridOn,
  "grid-off": GridOff,
  "view-column": ViewColumn,
  "view-week": ViewWeek,
  "view-day": ViewDay,
  "view-agenda": ViewAgenda,
  "view-headline": ViewHeadline,
  "view-stream": ViewStream,
  "view-comfy": ViewComfy,
  "view-compact": ViewCompact,
  "view-array": ViewArray,
  "view-carousel": ViewCarousel,
  "view-timeline": ViewTimeline,
  "view-kanban": ViewKanban,
  "view-sidebar": ViewSidebar,

  // Outlined variants
  "view-quilt-outlined": ViewQuiltOutlined,
  "view-module-outlined": ViewModuleOutlined,
  "view-list-outlined": ViewListOutlined,
  "view-comfy-outlined": ViewComfyOutlined,
  "view-compact-outlined": ViewCompactOutlined,
  "view-array-outlined": ViewArrayOutlined,
  "view-carousel-outlined": ViewCarouselOutlined,
  "view-timeline-outlined": ViewTimelineOutlined,
  "view-kanban-outlined": ViewKanbanOutlined,
  "view-sidebar-outlined": ViewSidebarOutlined,

  // Rounded variants
  "view-quilt-rounded": ViewQuiltRounded,
  "view-module-rounded": ViewModuleRounded,
  "view-list-rounded": ViewListRounded,
  "view-comfy-rounded": ViewComfyRounded,
  "view-compact-rounded": ViewCompactRounded,
  "view-array-rounded": ViewArrayRounded,
  "view-carousel-rounded": ViewCarouselRounded,
  "view-timeline-rounded": ViewTimelineRounded,
  "view-kanban-rounded": ViewKanbanRounded,
  "view-sidebar-rounded": ViewSidebarRounded,

  // Sharp variants
  "view-quilt-sharp": ViewQuiltSharp,
  "view-module-sharp": ViewModuleSharp,
  "view-list-sharp": ViewListSharp,
  "view-comfy-sharp": ViewComfySharp,
  "view-compact-sharp": ViewCompactSharp,
  "view-array-sharp": ViewArraySharp,
  "view-carousel-sharp": ViewCarouselSharp,
  "view-timeline-sharp": ViewTimelineSharp,
  "view-kanban-sharp": ViewKanbanSharp,
  "view-sidebar-sharp": ViewSidebarSharp,

  // Two-tone variants
  "view-quilt-two-tone": ViewQuiltTwoTone,
  "view-module-two-tone": ViewModuleTwoTone,
  "view-list-two-tone": ViewListTwoTone,
  "view-comfy-two-tone": ViewComfyTwoTone,
  "view-compact-two-tone": ViewCompactTwoTone,
  "view-array-two-tone": ViewArrayTwoTone,
  "view-carousel-two-tone": ViewCarouselTwoTone,
  "view-timeline-two-tone": ViewTimelineTwoTone,
  "view-kanban-two-tone": ViewKanbanTwoTone,
  "view-sidebar-two-tone": ViewSidebarTwoTone,

  // Transportation icons
  "directions-car": DirectionsCar,
  "directions-bus": DirectionsBus,
  "directions-bike": DirectionsBike,
  "directions-walk": DirectionsWalk,
  flight: Flight,
  train: Train,

  warehouse: Warehouse,
  inventory: Inventory,

  // Retail icons
  "shopping-bag": ShoppingBag,
  "shopping-basket": ShoppingBasket,
  storefront: Storefront,
  "local-mall": LocalMall,
  "local-grocery-store": LocalGroceryStore,
  "local-convenience-store": LocalConvenienceStore,
  "local-pharmacy": LocalPharmacy,
  "local-gas-station": LocalGasStation,
  "local-car-wash": LocalCarWash,
  "local-laundry-service": LocalLaundryService,
  "local-pizza": LocalPizza,
  "local-cafe": LocalCafe,
  "local-bar": LocalBar,
  "local-hotel": LocalHotel,
  "local-hospital": LocalHospital,
  "local-police": LocalPolice,
  "local-fire-department": LocalFireDepartment,
  "local-library": LocalLibrary,
  "local-post-office": LocalPostOffice,
  "local-printshop": LocalPrintshop,
  "local-florist": LocalFlorist,
  "local-dining": LocalDining,
  "local-drink": LocalDrink,
  "local-activity": LocalActivity,
  "local-airport": LocalAirport,
  "local-atm": LocalAtm,

  "local-taxi": LocalTaxi,
  "local-parking": LocalParking,
  "local-phone": LocalPhone,
  "local-play": LocalPlay,
  "local-movies": LocalMovies,
  "local-offer": LocalOffer,
  "local-see": LocalSee,

  // Banking & Finance icons
  "account-balance-wallet": AccountBalanceWallet,
  "account-box": AccountBox,
  "account-circle": AccountCircle,
  "account-tree": AccountTree,
  "monetization-on": MonetizationOn,
  "money-off": MoneyOff,
  payment: Payment,
  "credit-card": CreditCard,
  savings: Savings,
  "currency-exchange": CurrencyExchange,
  "currency-pound": CurrencyPound,
  "currency-yen": CurrencyYen,
  "currency-ruble": CurrencyRuble,
  "currency-franc": CurrencyFranc,
  "currency-lira": CurrencyLira,
  "currency-yuan": CurrencyYuan,
  "currency-rupee": CurrencyRupee,

  // Analytics icons
  "trending-down": TrendingDown,
  "trending-flat": TrendingFlat,
  "insert-chart-outlined": InsertChartOutlined,
  "insert-chart-rounded": InsertChartRounded,
  "insert-chart-sharp": InsertChartSharp,
  "insert-chart-two-tone": InsertChartTwoTone,
  "pie-chart-outlined": PieChartOutlined,
  "pie-chart-rounded": PieChartRounded,
  "pie-chart-sharp": PieChartSharp,
  "pie-chart-two-tone": PieChartTwoTone,
  "bar-chart-outlined": BarChartOutlined,
  "bar-chart-rounded": BarChartRounded,
  "bar-chart-sharp": BarChartSharp,
  "bar-chart-two-tone": BarChartTwoTone,
  "bubble-chart-outlined": BubbleChartOutlined,
  "bubble-chart-rounded": BubbleChartRounded,
  "bubble-chart-sharp": BubbleChartSharp,
  "bubble-chart-two-tone": BubbleChartTwoTone,
  "scatter-plot-outlined": ScatterPlotOutlined,
  "scatter-plot-rounded": ScatterPlotRounded,
  "scatter-plot-sharp": ScatterPlotSharp,
  "scatter-plot-two-tone": ScatterPlotTwoTone,
  "timeline-outlined": TimelineOutlined,
  "timeline-rounded": TimelineRounded,
  "timeline-sharp": TimelineSharp,
  "timeline-two-tone": TimelineTwoTone,
  "analytics-outlined": AnalyticsOutlined,
  "analytics-rounded": AnalyticsRounded,
  "analytics-sharp": AnalyticsSharp,
  "analytics-two-tone": AnalyticsTwoTone,
  "assessment-outlined": AssessmentOutlined,
  "assessment-rounded": AssessmentRounded,
  "assessment-sharp": AssessmentSharp,
  "assessment-two-tone": AssessmentTwoTone,
  "dashboard-outlined": DashboardOutlined,
  "dashboard-rounded": DashboardRounded,
  "dashboard-sharp": DashboardSharp,
  "dashboard-two-tone": DashboardTwoTone,

  // Pet icons
  pets: Pets,
  "pets-outlined": PetsOutlined,
  "pets-rounded": PetsRounded,
  "pets-sharp": PetsSharp,
  "pets-two-tone": PetsTwoTone,
  "sound-detection-dog-barking": VolumeUp,
  "dog-alert": NotificationsActive,

  // Robot icons
  "smart-toy": SmartToy,
  "smart-toy-outlined": SmartToyOutlined,
  "smart-toy-rounded": SmartToyRounded,
  "smart-toy-sharp": SmartToySharp,
  "smart-toy-two-tone": SmartToyTwoTone,
};

interface MaterialIconProps {
  icon: string;
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const MaterialIcon: React.FC<MaterialIconProps> = ({
  icon,
  size = 26,
  color = "currentColor",
  className,
  style,
}) => {
  // Handle legacy icon paths and emojis
  if (icon.startsWith("/icons/")) {
    // Convert legacy icon paths to Material Icon names
    const iconName = icon.replace("/icons/", "").replace(".png", "");
    const mappedIcon = iconMap[iconName];
    if (mappedIcon) {
      const IconComponent = mappedIcon;
      return (
        <IconComponent
          sx={{
            fontSize: size,
            color: color,
            ...style,
          }}
          className={className}
        />
      );
    }
  }

  // Handle emoji icons
  if (
    icon.match(
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
    )
  ) {
    return (
      <span
        style={{
          fontSize: size,
          color: color,
          ...style,
        }}
        className={className}
      >
        {icon}
      </span>
    );
  }

  // Handle data URLs (base64 images)
  if (icon.startsWith("data:")) {
    return (
      <img
        src={icon}
        alt="Menu icon"
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          color: color,
          ...style,
        }}
        className={className}
      />
    );
  }

  // Handle image file paths (both relative and absolute)
  if (icon.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
    // If it's already a full URL or starts with /, use as is
    const imageSrc =
      icon.startsWith("http") || icon.startsWith("/") ? icon : `/icons/${icon}`;

    return (
      <img
        src={imageSrc}
        alt="Menu icon"
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          color: color,
          ...style,
        }}
        className={className}
      />
    );
  }

  // Handle Material Icon names
  const IconComponent = iconMap[icon];
  if (IconComponent) {
    return (
      <IconComponent
        sx={{
          fontSize: size,
          color: color,
          ...style,
        }}
        className={className}
      />
    );
  }

  // Fallback to text if no icon found
  return (
    <span
      style={{
        fontSize: size,
        color: color,
        ...style,
      }}
      className={className}
    >
      {icon}
    </span>
  );
};

export default MaterialIcon;
