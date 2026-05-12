# StyleShop — Premium Frontend Redesign

A production-grade ecommerce frontend built with React + TypeScript + Tailwind CSS + shadcn/ui.

## ✨ What's New in This Redesign

### Design System
- **Syne** (display) + **DM Sans** (body) font pairing for premium typography
- Complete CSS variable token system: colors, shadows, gradients, radii, motion
- Dark/light theme support with smooth transitions
- Glassmorphism, layered surfaces, soft shadows
- Animated gradient hero sections

### Component Upgrades
- All UI primitives (Button, Input, Select, Table, Dialog, etc.) redesigned with `rounded-xl` and premium feel
- Skeleton loaders with shimmer animation
- Empty states with illustrative icons
- Toast notifications with rounded-2xl style

### Pages Redesigned
| Page | Changes |
|------|---------|
| **Home (Index)** | Hero with ambient gradient blobs, feature pills, animated headline |
| **Auth** | Split card design, password show/hide, social proof footer |
| **ProductCard** | Skeleton loading, cleaner layout, animated image hover |
| **ProductGrid** | Skeleton loaders, empty state, premium load-more button |
| **ProductPage** | Full-screen layout, thumbnail strip, sticky header bar |
| **CartPage** | Premium cart items, sticky summary panel, WhatsApp CTA |
| **Admin Layout** | Custom sidebar (no shadcn SidebarProvider dependency), mobile sheet |
| **Admin Products** | Page header with stats, improved tab layout |
| **Admin Categories** | Stat cards, clean table design |
| **SAJ Calculator** | Centered card with gradient branding |
| **404 Page** | Gradient 404 text, helpful CTAs |

### Removed
- ❌ All Supabase dependencies (already removed in original)
- ❌ `lovable-tagger` dev dependency
- ❌ Supabase environment variables

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Update VITE_API_BASE_URL to your Express backend

# Start dev server
npm run dev

# Build for production
npm run build
```

## 📁 Architecture

```
src/
├── app/              # Redux store setup
├── components/
│   ├── ui/           # Redesigned shadcn/ui primitives
│   ├── admin/        # Admin-specific components
│   ├── ProductCard   # Premium product card
│   ├── ProductGrid   # Grid with skeletons + pagination
│   ├── SiteHeader    # Sticky nav with search + theme toggle
│   ├── ColorSelector # Color picker
│   ├── ShareButton   # WhatsApp share
│   └── MiniCart      # Cart badge
├── features/
│   └── auth/         # Redux auth slice + thunks
├── hooks/            # Custom React hooks
├── pages/
│   ├── admin/        # Admin panel pages
│   ├── Index         # Home page
│   ├── Auth          # Sign in / Sign up
│   ├── ProductPage   # Product detail
│   ├── CartPage      # Shopping cart
│   └── ...
├── routes/           # App routing + protected routes
├── services/         # Axios API layer (Express backend)
└── index.css         # Complete design system tokens
```

## 🎨 Design Tokens

All design tokens are CSS variables defined in `src/index.css`:

```css
--primary: 246 78% 56%;           /* Indigo-violet */
--accent: 340 82% 56%;            /* Coral-rose */
--gradient-primary: linear-gradient(135deg, ...);
--shadow-primary: 0 8px 24px ...;
--radius: 0.75rem;
```

## 🔌 API Integration

The frontend connects to your Express backend via:
- `VITE_API_BASE_URL` env variable (default: `http://localhost:8000/api/v1`)
- JWT auth via localStorage (`auth_token`)
- Axios interceptors for auto token refresh
- Cookie-based refresh tokens (`withCredentials: true`)

## 📱 Responsive Breakpoints

- Mobile: `< 640px`
- Tablet: `640px – 1024px`  
- Desktop: `> 1024px`
- Wide: `> 1400px` (container max-width)
