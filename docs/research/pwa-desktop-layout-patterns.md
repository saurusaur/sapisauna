# PWA Desktop Layout Patterns Research (2025-03)

## 1. Overview: The Problem

Mobile-first PWAs need to look good on desktop too. Two main strategies exist:
- **Fully responsive**: redesign layouts for desktop (columns, sidebars, etc.)
- **Mobile shell**: keep mobile layout, center it on desktop with decorative background

For apps like Sauna Log (record-keeping + Instagram story sharing), the mobile shell pattern is the right fit — the app is inherently mobile and doesn't benefit from a wide desktop layout.

---

## 2. The "Mobile Shell" Pattern

### What It Is
Wrap the entire app in a fixed max-width container (typically 390–430px, matching iPhone viewport), center it horizontally, and fill the remaining desktop space with a background color or pattern.

### Real-World Examples
| App | Desktop Behavior | Max-Width |
|-----|-----------------|-----------|
| Instagram Web (mobile view) | Centered column, ~470px | ~470px |
| Twitter/X Mobile Web | Centered main column, sidebars on wider screens | ~600px |
| Toss (토스) Web | Mobile UI centered, gray background | ~400px |
| KakaoBank Web | Mobile shell centered | ~400px |
| Banking PWAs (일반) | Fixed mobile width, centered | 375–430px |

### CSS Implementation

```css
/* Approach A: Simple max-width + mx-auto */
body {
  background-color: #e5e5e5; /* desktop background */
}
.app-shell {
  max-width: 430px;
  margin: 0 auto;
  min-height: 100vh;
  min-height: 100dvh; /* dynamic viewport height */
  background-color: #ffffff; /* app background */
  position: relative;
  overflow-x: hidden;
}
```

```html
<!-- Tailwind version -->
<body class="bg-stone-200 min-h-screen">
  <main class="max-w-[430px] mx-auto min-h-dvh bg-white relative">
    {children}
  </main>
</body>
```

```css
/* Approach B: Flexbox centering (adds vertical centering option) */
body {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  background-color: #f0f0f0;
}
.app-shell {
  width: 100%;
  max-width: 430px;
  min-height: 100vh;
}
```

```css
/* Approach C: With subtle shadow for depth */
.app-shell {
  max-width: 430px;
  margin: 0 auto;
  min-height: 100vh;
  box-shadow: 0 0 40px rgba(0,0,0,0.08);
}
```

---

## 3. Approach Comparison

### A. Mobile Shell (Fixed Max-Width, Centered)
**Pros:**
- Zero desktop layout work — mobile design "just works"
- Consistent UX across all devices
- No layout bugs from responsive breakpoints
- Fast to implement and maintain
- Perfect for apps that are inherently mobile (banking, logging, social)

**Cons:**
- Wastes screen real estate on desktop
- Looks "app-like" not "web-like" — some users expect full-width on desktop
- Not SEO-friendly for content-heavy sites (though irrelevant for auth-gated apps)

**Best for:** Record-keeping apps, banking apps, social sharing apps, any app where mobile is the primary platform

### B. Fully Responsive (Different Desktop Layout)
**Pros:**
- Uses full screen real estate
- Feels native to each platform
- Better for content-heavy or dashboard-style apps

**Cons:**
- 2x-3x design and development effort
- More layout bugs to maintain
- Inconsistent UX between mobile and desktop

**Best for:** News sites, dashboards, e-commerce, content platforms

### C. Hybrid (Mobile Shell + Desktop Sidebar/Info)
**Pros:**
- Mobile shell for core UI, desktop space for supplementary info
- Best of both worlds

**Cons:**
- Still requires desktop-specific design work
- Complexity of two layouts

**Best for:** Twitter/X style apps, messaging apps

---

## 4. Current Sauna Log Implementation

```tsx
// layout.tsx (current)
<body className="min-h-screen" style={{ backgroundColor: '#f5f2ef' }}>
  <main className="max-w-md mx-auto min-h-screen">
    {children}
  </main>
</body>
```

**Analysis:**
- `max-w-md` = 448px — already using the mobile shell pattern
- `mx-auto` — centered on desktop
- `bg-[#f5f2ef]` on body — warm background extends full width
- Missing: `min-h-dvh` (dynamic viewport), shadow for depth on desktop

---

## 5. Recommended Improvements for Sauna Log

### Priority 1: Use dvh for mobile viewport
```tsx
<body className="min-h-dvh" style={{ backgroundColor: '#f5f2ef' }}>
  <main className="max-w-md mx-auto min-h-dvh bg-white relative overflow-x-hidden">
```
- `dvh` handles mobile browser chrome (address bar show/hide)
- Explicit `bg-white` on main separates app from desktop background

### Priority 2: Add desktop visual separation
```tsx
<main className="max-w-md mx-auto min-h-dvh bg-white relative overflow-x-hidden
  shadow-[0_0_40px_rgba(0,0,0,0.06)]">
```

### Priority 3: Consider max-width fine-tuning
- `max-w-md` (448px) is slightly wider than iPhone 15 Pro Max (430px)
- Could use `max-w-[430px]` for pixel-perfect match
- Or keep `max-w-md` for slight breathing room — both valid

### Optional: Desktop background enhancement
Instead of plain color, could add subtle pattern or branding:
```tsx
<body className="min-h-dvh bg-stone-100
  md:bg-[url('/desktop-bg-pattern.svg')] md:bg-repeat">
```

---

## 6. Implementation Patterns (Next.js + Tailwind Specific)

### Pattern: Layout wrapper in root layout.tsx
```tsx
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-stone-200">
        <div className="max-w-[430px] mx-auto min-h-dvh bg-white
          shadow-[0_0_30px_rgba(0,0,0,0.06)] relative">
          {children}
        </div>
      </body>
    </html>
  )
}
```

### Pattern: CSS custom properties for the container width
```css
/* globals.css */
:root {
  --app-max-width: 430px;
}
```
```tsx
<main className="max-w-[var(--app-max-width)] mx-auto ...">
```

### Pattern: Safe area handling (for notched devices)
```css
/* globals.css */
.app-shell {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Pattern: Prevent horizontal scroll on mobile
```css
html, body {
  overflow-x: hidden;
}
```

---

## 7. Key Takeaways

1. **Sauna Log is already using the right pattern** (`max-w-md mx-auto`). It just needs minor polish.
2. **430px is the standard** for mobile-first PWAs targeting iPhone users (iPhone 15 Pro Max = 430px CSS width).
3. **`min-h-dvh` > `min-h-screen`** for mobile — handles address bar changes.
4. **Subtle shadow** on the container makes it feel like a "card" on desktop — much better visual separation.
5. **No need to go fully responsive** — for a record-keeping + story-sharing app, the mobile shell pattern is industry standard.

---

## Sources
- [web.dev - PWA App Design](https://web.dev/learn/pwa/app-design)
- [firt.dev - PWA Design Tips](https://firt.dev/pwa-design-tips/)
- [Smashing Magazine - Optimizing PWAs for Display Modes](https://www.smashingmagazine.com/2025/08/optimizing-pwas-different-display-modes/)
- [Tailwind CSS - Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Tailwind CSS - Max Width](https://tailwindcss.com/docs/max-width)
- [MDN - PWA Best Practices](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices)
- [DEV Community - Responsive Design Best Practices 2024](https://dev.to/linusmwiti21/best-practises-for-building-responsive-design-in-2024-48c4)
- [Next Native - Responsive Design Best Practices 2025](https://nextnative.dev/blog/responsive-design-best-practices)
- [SitePoint - CSS and PWAs](https://www.sitepoint.com/pwa-css-considerations/)
