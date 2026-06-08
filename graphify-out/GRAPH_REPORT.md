# Graph Report - . (2026-06-07)

## Corpus Check

- 216 files · ~92,333 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 962 nodes · 1612 edges · 77 communities (68 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges
  (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)

- [[_COMMUNITY_NPM UI Dependencies|NPM UI Dependencies]]
- [[_COMMUNITY_Chat and Export Panel|Chat and Export Panel]]
- [[_COMMUNITY_Core App Providers|Core App Providers]]
- [[_COMMUNITY_Mobile Layout Components|Mobile Layout Components]]
- [[_COMMUNITY_Playlist and Support UI|Playlist and Support UI]]
- [[_COMMUNITY_Build and Dev Config|Build and Dev Config]]
- [[_COMMUNITY_Progress and Module Cards|Progress and Module Cards]]
- [[_COMMUNITY_Admin Dashboard|Admin Dashboard]]
- [[_COMMUNITY_Learning Panel System|Learning Panel System]]
- [[_COMMUNITY_Toast Notification System|Toast Notification System]]
- [[_COMMUNITY_Settings and Notifications|Settings and Notifications]]
- [[_COMMUNITY_Site Footer|Site Footer]]
- [[_COMMUNITY_TypeScript App Config|TypeScript App Config]]
- [[_COMMUNITY_Navigation and Badges|Navigation and Badges]]
- [[_COMMUNITY_Auth and Support|Auth and Support]]
- [[_COMMUNITY_Home Feed Components|Home Feed Components]]
- [[_COMMUNITY_Quiz and Calendar UI|Quiz and Calendar UI]]
- [[_COMMUNITY_Core Product Specs|Core Product Specs]]
- [[_COMMUNITY_Component Library Config|Component Library Config]]
- [[_COMMUNITY_Notification Center|Notification Center]]
- [[_COMMUNITY_SEO and Growth Analytics|SEO and Growth Analytics]]
- [[_COMMUNITY_TypeScript Node Config|TypeScript Node Config]]
- [[_COMMUNITY_Admin Management|Admin Management]]
- [[_COMMUNITY_Notes and Video Player|Notes and Video Player]]
- [[_COMMUNITY_Backend Admin and Certs|Backend Admin and Certs]]
- [[_COMMUNITY_Carousel Component|Carousel Component]]
- [[_COMMUNITY_PWA Manifest|PWA Manifest]]
- [[_COMMUNITY_TypeScript Base Config|TypeScript Base Config]]
- [[_COMMUNITY_Form Components|Form Components]]
- [[_COMMUNITY_Menubar Component|Menubar Component]]
- [[_COMMUNITY_Brand and App Identity|Brand and App Identity]]
- [[_COMMUNITY_Frontend Architecture Concepts|Frontend Architecture Concepts]]
- [[_COMMUNITY_Payment and Packages|Payment and Packages]]
- [[_COMMUNITY_Supabase DB Types|Supabase DB Types]]
- [[_COMMUNITY_Chart Components|Chart Components]]
- [[_COMMUNITY_Context Menu Component|Context Menu Component]]
- [[_COMMUNITY_Table Component|Table Component]]
- [[_COMMUNITY_Gamification System|Gamification System]]
- [[_COMMUNITY_AI Message Templates|AI Message Templates]]
- [[_COMMUNITY_Breadcrumb Component|Breadcrumb Component]]
- [[_COMMUNITY_Drawer Component|Drawer Component]]
- [[_COMMUNITY_Navigation Menu|Navigation Menu]]
- [[_COMMUNITY_Learning and Outbox Events|Learning and Outbox Events]]
- [[_COMMUNITY_Course Detail View|Course Detail View]]
- [[_COMMUNITY_Card Component|Card Component]]
- [[_COMMUNITY_Toggle Components|Toggle Components]]
- [[_COMMUNITY_Import and Tutor Modules|Import and Tutor Modules]]
- [[_COMMUNITY_Platform and Caching Layer|Platform and Caching Layer]]
- [[_COMMUNITY_Lovable Auth Integration|Lovable Auth Integration]]
- [[_COMMUNITY_Authentication Backend|Authentication Backend]]
- [[_COMMUNITY_Quiz System|Quiz System]]
- [[_COMMUNITY_Alert Component|Alert Component]]
- [[_COMMUNITY_OTP Input Component|OTP Input Component]]
- [[_COMMUNITY_AI Tutor Edge Function|AI Tutor Edge Function]]
- [[_COMMUNITY_Courses Backend|Courses Backend]]
- [[_COMMUNITY_Playlist Import Function|Playlist Import Function]]
- [[_COMMUNITY_Template Helper Util|Template Helper Util]]
- [[_COMMUNITY_Playlist Import Alt|Playlist Import Alt]]
- [[_COMMUNITY_Avatar Component|Avatar Component]]
- [[_COMMUNITY_MCQ Answer Function|MCQ Answer Function]]
- [[_COMMUNITY_Edge Function CORS|Edge Function CORS]]
- [[_COMMUNITY_Edge Function CORS|Edge Function CORS]]
- [[_COMMUNITY_Edge Function CORS|Edge Function CORS]]
- [[_COMMUNITY_Edge Function CORS|Edge Function CORS]]
- [[_COMMUNITY_Idempotency Keys|Idempotency Keys]]

## God Nodes (most connected - your core abstractions)

1. `cn()` - 97 edges
2. `useAuth()` - 55 edges
3. `supabase` - 42 edges
4. `Button` - 38 edges
5. `AppShell()` - 30 edges
6. `ZverTs Product Specification` - 22 edges
7. `compilerOptions` - 19 edges
8. `zverts-api HTTP Server` - 16 edges
9. `Input` - 14 edges
10. `compilerOptions` - 14 edges

## Surprising Connections (you probably didn't know these)

- `Supabase Edge Functions` --semantically_similar_to--> `Import Module`
  [INFERRED] [semantically similar] README.md → BACKEND.md
- `Supabase Edge Functions` --semantically_similar_to-->
  `Tutor Module (Stateless SSE Proxy)` [INFERRED] [semantically similar]
  README.md → BACKEND.md
- `Cache Invalidation Matrix (Mutation-based)` --semantically_similar_to-->
  `Redis Cache and Rate Limit Strategy` [INFERRED] [semantically similar]
  FRONTEND.md → BACKEND.md
- `Tech Stack (React 18 + Vite + Supabase)` --semantically_similar_to-->
  `Supabase SSR Client Integration` [INFERRED] [semantically similar] README.md
  → FRONTEND.md
- `ZverTs Design System (Tokens, Typography, Color)`
  --conceptually_related_to-->
  `ZverTs Logo (White bg, lime chain-link icon, ZverTs. wordmark)` [INFERRED]
  FRONTEND.md → src/assets/zverts-logo.png

## Import Cycles

- None detected.

## Hyperedges (group relationships)

- **Core Learn Loop: Progress Sync → Gamification → MCQ → Certificate** —
  product_progress_sync, product_gamification, product_mcq_quizzes,
  product_certificates, product_sequential_unlock [EXTRACTED 0.95]
- **Backend Service Layer: All Go Service Interfaces** — backend_authservice,
  backend_userservice, backend_courseservice, backend_importservice,
  backend_progressservice, backend_quizservice, backend_gamificationservice,
  backend_certificateservice, backend_tutorservice, backend_notificationservice,
  backend_adminservice [EXTRACTED 1.00]
- **ZverTs Brand Identity: Logo, Favicon, PWA Icons** — assets_zverts_logo,
  public_favicon, public_icon_192, public_apple_touch_icon [INFERRED 0.90]

## Communities (77 total, 9 thin omitted)

### Community 0 - "NPM UI Dependencies"

Cohesion: 0.03 Nodes (67): dependencies, class-variance-authority, clsx, cmdk,
date-fns, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+59 more)

### Community 1 - "Chat and Export Panel"

Cohesion: 0.08 Nodes (36): ChatHistorySidebar(), Props, download(),
exportAsMarkdown(), exportAsPdf(), exportAsTxt(), fmtDate(), slug() (+28 more)

### Community 2 - "Core App Providers"

Cohesion: 0.05 Nodes (33): ThemeProvider(), ErrorBoundary, AuthProvider(), bn,
en, Admin, AdminBroadcast, AdminManagement (+25 more)

### Community 3 - "Mobile Layout Components"

Cohesion: 0.05 Nodes (36): useIsMobile(), Separator, SheetContent,
SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay
(+28 more)

### Community 4 - "Playlist and Support UI"

Cohesion: 0.07 Nodes (30): PlaylistPreview(), Preview, Video, COUNTRY_CODES,
nameSchema, phoneSchema, SupportContactPopup(), Checkbox (+22 more)

### Community 5 - "Build and Dev Config"

Cohesion: 0.06 Nodes (35): devDependencies, autoprefixer, eslint, @eslint/js,
eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom (+27
more)

### Community 6 - "Progress and Module Cards"

Cohesion: 0.07 Nodes (25): CircularProgress(), Props, ContinueWatching(), fmt(),
ModuleCard(), Props, StatCard(), TodayMissionCard() (+17 more)

### Community 7 - "Admin Dashboard"

Cohesion: 0.13 Nodes (10): Status, AppShell(), InstallPrompt,
NotificationCenter, SiteFooter, SupportContactPopup, useAdminPaymentAlerts(),
useBrowserNotifications() (+2 more)

### Community 8 - "Learning Panel System"

Cohesion: 0.10 Nodes (18): ChatPanel(), ActiveSource, Course, Mod,
SourcesPanel(), TranscriptPanel(), UsageChip(), ALLOWED (+10 more)

### Community 9 - "Toast Notification System"

Cohesion: 0.11 Nodes (24): Action, ActionType, actionTypes, addToRemoveQueue(),
dispatch(), genId(), listeners, memoryState (+16 more)

### Community 10 - "Settings and Notifications"

Cohesion: 0.13 Nodes (18): DEFAULTS, Prefs, SmartNotificationSettings(),
Profile, Settings(), AlertDialogAction, AlertDialogCancel, AlertDialogContent
(+10 more)

### Community 11 - "Site Footer"

Cohesion: 0.10 Nodes (11): categories, features, legal, LinkItem, socials,
support, OfficialEmail(), OfficialEmailProps (+3 more)

### Community 12 - "TypeScript App Config"

Cohesion: 0.09 Nodes (21): compilerOptions, allowImportingTsExtensions,
isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 13 - "Navigation and Badges"

Cohesion: 0.10 Nodes (11): BADGES, NavLink, NavLinkCompatProps,
AccordionContent, AccordionItem, AccordionTrigger, HoverCardContent, Progress
(+3 more)

### Community 14 - "Auth and Support"

Cohesion: 0.19 Nodes (14): Row, SupportContacts(), AITutorPanel(),
RequireRole(), AuthCtx, Ctx, useAuth(), Entitlements (+6 more)

### Community 15 - "Home Feed Components"

Cohesion: 0.15 Nodes (10): Row, MCQ, BIPEvent, LanguageToggle(), ThemeToggle(),
Mission, Props, State (+2 more)

### Community 16 - "Quiz and Calendar UI"

Cohesion: 0.17 Nodes (16): DailyChallenge(), cn(), ButtonProps, buttonVariants,
Calendar(), CalendarProps, Pagination(), PaginationContent (+8 more)

### Community 17 - "Core Product Specs"

Cohesion: 0.17 Nodes (18): module_progress DB Table, ZverTs Backend
Specification, ZverTs Frontend Specification, F-10 Certificates with PDF
Download, F-5 Personal Dashboard, F-11 Explore Public Courses, F-7 Gamification
(XP, Gems, Streak, Daily Challenge, Badges), F-16 i18n English and Bangla (+10
more)

### Community 18 - "Component Library Config"

Cohesion: 0.12 Nodes (16): aliases, components, hooks, lib, ui, utils, rsc,
$schema (+8 more)

### Community 19 - "Notification Center"

Cohesion: 0.18 Nodes (11): categoryEmoji, NotificationCenter(), Notification,
requestBrowserNotificationPermission(), useNotifications(), Badge(), BadgeProps,
badgeVariants (+3 more)

### Community 20 - "SEO and Growth Analytics"

Cohesion: 0.15 Nodes (9): SEO(), SEOProps, DayStats, Growth, Mission, pct(),
Task, Trend() (+1 more)

### Community 21 - "TypeScript Node Config"

Cohesion: 0.12 Nodes (15): compilerOptions, allowImportingTsExtensions,
isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7
more)

### Community 22 - "Admin Management"

Cohesion: 0.22 Nodes (5): Props, Profile(), Input, Label, labelVariants

### Community 23 - "Notes and Video Player"

Cohesion: 0.18 Nodes (9): Note, NotesPanel(), Props, Window, YouTubePlayer,
YouTubePlayerHandle, AITutorPanel, Mod (+1 more)

### Community 24 - "Backend Admin and Certs"

Cohesion: 0.15 Nodes (14): Admin Module, AdminService, Certificates Module,
certificates DB Table, CertificateService, email_logs DB Table, Modular Monolith
Architecture, Notifications Module (+6 more)

### Community 25 - "Carousel Component"

Cohesion: 0.14 Nodes (12): Carousel, CarouselApi, CarouselContent,
CarouselContext, CarouselContextProps, CarouselItem, CarouselNext,
CarouselOptions (+4 more)

### Community 26 - "PWA Manifest"

Cohesion: 0.17 Nodes (11): background_color, categories, description, display,
icons, name, orientation, scope (+3 more)

### Community 27 - "TypeScript Base Config"

Cohesion: 0.17 Nodes (11): compilerOptions, allowJs, noImplicitAny,
noUnusedLocals, noUnusedParameters, paths, skipLibCheck, strictNullChecks (+3
more)

### Community 28 - "Form Components"

Cohesion: 0.17 Nodes (9): FormControl, FormDescription, FormFieldContext,
FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue,
FormLabel (+1 more)

### Community 29 - "Menubar Component"

Cohesion: 0.17 Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent,
MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut()
(+3 more)

### Community 30 - "Brand and App Identity"

Cohesion: 0.20 Nodes (11): ZverTs Logo (White bg, lime chain-link icon, ZverTs.
wordmark), ZverTs Design System (Tokens, Typography, Color), Google Analytics
(G-SC178QVMZZ), index.html App Entry Point, PWA Manifest and Icons
Configuration, ZverTs SEO and OG Metadata, LLMs.txt AI Sitemap, ZverTs Apple
Touch Icon (Dark bg, lime chain-link) (+3 more)

### Community 31 - "Frontend Architecture Concepts"

Cohesion: 0.18 Nodes (11): AITutorPanel Component, Next.js App Router
Architecture, RSC-first Rendering Strategy, shadcn/ui Primitive Components,
Supabase SSR Client Integration, YouTubePlayer Component, Zustand Feature
Stores, AITutorPanel Header Cleanup Plan (+3 more)

### Community 32 - "Payment and Packages"

Cohesion: 0.29 Nodes (8): MERCHANT_NUMBERS, METHOD_LABELS, PackageKey, PACKAGES,
ORDER, Method, METHODS, Payment()

### Community 33 - "Supabase DB Types"

Cohesion: 0.18 Nodes (10): CompositeTypes, Constants, Database,
DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 34 - "Chart Components"

Cohesion: 0.18 Nodes (7): ChartConfig, ChartContainer, ChartContext,
ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 35 - "Context Menu Component"

Cohesion: 0.20 Nodes (9): ContextMenuCheckboxItem, ContextMenuContent,
ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator,
ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 36 - "Table Component"

Cohesion: 0.22 Nodes (8): Table, TableBody, TableCaption, TableCell,
TableFooter, TableHead, TableHeader, TableRow

### Community 37 - "Gamification System"

Cohesion: 0.25 Nodes (8): achievements DB Table, attendance DB Table,
Gamification Module, GamificationService, profiles DB Table, Users Module,
UserService, F-13 Leaderboard (Global XP Rankings)

### Community 38 - "AI Message Templates"

Cohesion: 0.29 Nodes (6): Ctx, pick(), renderTemplate(), T, TemplateCategory,
Tpl

### Community 39 - "Breadcrumb Component"

Cohesion: 0.25 Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem,
BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 40 - "Drawer Component"

Cohesion: 0.25 Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(),
DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 41 - "Navigation Menu"

Cohesion: 0.25 Nodes (7): NavigationMenu, NavigationMenuContent,
NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger,
navigationMenuTriggerStyle, NavigationMenuViewport

### Community 42 - "Learning and Outbox Events"

Cohesion: 0.29 Nodes (7): Learn Module, notes DB Table, outbox_events DB Table,
Outbox Pattern for Cross-module Events, ProgressService, SSE Hub for Realtime
Fan-out, F-6 Smart Notes with Timestamp

### Community 43 - "Course Detail View"

Cohesion: 0.33 Nodes (6): Course, CourseDetail(), fmt(), Module, Progress,
SortableRow()

### Community 44 - "Card Component"

Cohesion: 0.29 Nodes (6): Card, CardContent, CardDescription, CardFooter,
CardHeader, CardTitle

### Community 45 - "Toggle Components"

Cohesion: 0.33 Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem,
Toggle, toggleVariants

### Community 46 - "Import and Tutor Modules"

Cohesion: 0.40 Nodes (6): Import Module, ImportService, Tutor Module (Stateless
SSE Proxy), TutorService (SSE Proxy), F-1 Playlist Import Feature, Supabase Edge
Functions

### Community 47 - "Platform and Caching Layer"

Cohesion: 0.33 Nodes (6): Platform Module (Cross-cutting), RateLimitService
(Token Bucket), Redis Cache and Rate Limit Strategy, Cache Invalidation Matrix
(Mutation-based), Centralized Query Keys (lib/query-keys.ts), TanStack Query v5
State Management

### Community 48 - "Lovable Auth Integration"

Cohesion: 0.40 Nodes (4): lovable, lovableAuth, SignInOptions, Auth()

### Community 49 - "Authentication Backend"

Cohesion: 0.40 Nodes (5): Auth Module, AuthService, JWT RS256 Session Model,
user_roles DB Table, F-4 Authentication (Magic Link + Google OAuth)

### Community 50 - "Quiz System"

Cohesion: 0.40 Nodes (5): daily_challenges DB Table, mcq_attempts DB Table,
mcq_questions DB Table, Quiz Module, QuizService

### Community 51 - "Alert Component"

Cohesion: 0.40 Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 52 - "OTP Input Component"

Cohesion: 0.40 Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator,
InputOTPSlot

### Community 53 - "AI Tutor Edge Function"

Cohesion: 0.50 Nodes (3): corsHeaders, MODE_PROMPTS, MODEL_MAP

### Community 54 - "Courses Backend"

Cohesion: 0.50 Nodes (4): Courses Module, courses DB Table, CourseService,
modules DB Table

### Community 58 - "Avatar Component"

Cohesion: 0.50 Nodes (3): Avatar, AvatarFallback, AvatarImage

## Knowledge Gaps

- **504 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+499
  more) These have ≤1 connection - possible missing edges or undocumented
  components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query`
  to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Quiz and Calendar UI` to `Chat and Export Panel`,
  `Mobile Layout Components`, `Playlist and Support UI`,
  `Progress and Module Cards`, `Admin Dashboard`, `Learning Panel System`,
  `Toast Notification System`, `Settings and Notifications`, `Site Footer`,
  `Navigation and Badges`, `Auth and Support`, `Home Feed Components`,
  `Notification Center`, `SEO and Growth Analytics`, `Admin Management`,
  `Carousel Component`, `Form Components`, `Menubar Component`,
  `Chart Components`, `Context Menu Component`, `Table Component`,
  `Breadcrumb Component`, `Drawer Component`, `Navigation Menu`,
  `Card Component`, `Toggle Components`, `Alert Component`,
  `OTP Input Component`, `Avatar Component`?** _High betweenness centrality
  (0.156) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Auth and Support` to `Payment and Packages`,
  `Chat and Export Panel`, `Playlist and Support UI`,
  `Progress and Module Cards`, `Admin Dashboard`, `Learning Panel System`,
  `Settings and Notifications`, `Course Detail View`, `Home Feed Components`,
  `Lovable Auth Integration`, `Notification Center`, `SEO and Growth Analytics`,
  `Admin Management`, `Notes and Video Player`?** _High betweenness centrality
  (0.022) - this node is a cross-community bridge._
- **Why does `Button` connect `Home Feed Components` to `Payment and Packages`,
  `Chat and Export Panel`, `Mobile Layout Components`,
  `Playlist and Support UI`, `Progress and Module Cards`, `Admin Dashboard`,
  `Learning Panel System`, `Settings and Notifications`, `Course Detail View`,
  `Auth and Support`, `Lovable Auth Integration`, `Notification Center`,
  `SEO and Growth Analytics`, `Admin Management`, `Notes and Video Player`,
  `Carousel Component`?** _High betweenness centrality (0.021) - this node is a
  cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?** _506
  weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `NPM UI Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.029850746268656716 - nodes in this community are weakly
  interconnected._
- **Should `Chat and Export Panel` be split into smaller, more focused
  modules?** _Cohesion score 0.0824829931972789 - nodes in this community are
  weakly interconnected._
- **Should `Core App Providers` be split into smaller, more focused modules?**
  _Cohesion score 0.046464646464646465 - nodes in this community are weakly
  interconnected._
