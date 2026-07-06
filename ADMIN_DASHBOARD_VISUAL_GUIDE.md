# Admin Dashboard - Visual Layout & UI Guide

## Dashboard Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          NAVBAR / HEADER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  🔍 Search components, orders, clients, admin                  │  │
│  │  [Visit Site] [🔔] [⚙️/☀️] [👤 Admin ▼]                         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┬─────────────────────────────────────────────────────┐
│   SIDEBAR        │          MAIN CONTENT AREA                          │
│                  │                                                     │
│ ☰ ATELIER       │ ┌─────────────────────────────────────────────┐    │
│   ADMIN         │ │  Welcome back Admin!                        │    │
│                 │ │  Manage collections, orders...  [Visit Site]│    │
│                 │ │ └─────────────────────────────────────────────┘    │
│                 │                                                     │
│ ⊞ Overview     │ ┌─────────────────────────────────────────────┐    │
│ ⊞ Home         │ │ Total Collections │ Total Orders            │    │
│ ⊞ Orders       │ │ $XX,XXX           │ XX Follow-ups          │    │
│ ⊞ Inventory    │ │ Total Revenue     │                         │    │
│ ⊞ Reviews ✨   │ └─────────────────────────────────────────────┘    │
│ ⊞ Activity Log │                                                     │
│   ✨ NEW!      │ ┌──────────────────────────────────────────────────┐ │
│                 │  REVENUE OVERVIEW                                │ │
│ ----            │  [Weekly] [Monthly] [Yearly]                   │ │
│                 │                                                  │ │
│ [Logout]        │  [Bar Chart with Revenue Data]                 │ │
│                 │ └──────────────────────────────────────────────────┘ │
│                 │                                                     │
│                 │ ┌────────────────────┐  ┌────────────────────┐   │
│                 │ │ Repeated Orders    │  │ Recent Reviews     │   │
│                 │ │                    │  │                    │   │
│                 │ │ [Customer List]    │  │ ⭐⭐⭐⭐⭐ 4.2 avg│   │
│                 │ │                    │  │ [Review List]      │   │
│                 │ └────────────────────┘  └────────────────────┘   │
│                 │                                                     │
│                 │ ┌──────────────────────────────────────────────────┐ │
│                 │ │ BEST SELLERS                                     │ │
│                 │ │ 🥇 Product 1 - 150 sold - $3,000               │ │
│                 │ │ 🥈 Product 2 - 120 sold - $2,400               │ │
│                 │ │ 🥉 Product 3 - 95 sold - $1,900                │ │
│                 │ │ [More products...]                              │ │
│                 │ └──────────────────────────────────────────────────┘ │
└──────────────────┴─────────────────────────────────────────────────────┘
```

---

## Bell Icon Notification Dropdown

```
                    ┌─────────────────────────────┐
                    │    NOTIFICATIONS            │
                    │                             │
                    │ [✕]                         │
                    │ ─────────────────────────   │
                    │ 📦 Customer Order           │
                    │    Order #123456            │
                    │    🟡 PROCESSING            │
                    │                             │
                    │ 📦 John Doe Order           │
                    │    Order #789012            │
                    │    🟠 PENDING               │
                    │                             │
                    │ No notifications            │
                    └─────────────────────────────┘
```

---

## Search Results Display

```
  🔍 Search Results (4 found)
  ═════════════════════════════════════════════════════════════════
  
  🔗 Overview
     Navigate to Overview                        [Sidebar]
  
  📊 Orders
     Navigate to Orders                          [Sidebar]
  
  👔 Blue Silk Shirt
     Category • Featured                         [Component]
  
  📝 Email from Customer
     customer@example.com                        [Order]
```

---

## Revenue Chart Component

```
┌─────────────────────────────────────────────────────┐
│ Revenue Overview                                    │
│                 [Weekly] [Monthly] [Yearly]         │
│ Last 7 days                                         │
│                                                     │
│         ┌─────────────────────────────────┐        │
│         │                                   │        │
│    $5K  │     ┌──┐                         │        │
│         │     │  │     ┌──┐               │        │
│    $3K  │     │  │     │  │     ┌──┐      │        │
│         │     │  │     │  │     │  │      │        │
│    $1K  │     │  │     │  │     │  │      │        │
│         │     │  │     │  │     │  │      │        │
│      $0 └─────┴──┴─────┴──┴─────┴──┴──────┘        │
│         Mon   Tue   Wed   Thu   Fri    Sat   Sun   │
│         • Revenue  • Orders                         │
└─────────────────────────────────────────────────────┘
```

---

## Repeated Orders Section

```
┌──────────────────────────────────────────┐
│ 🔄 Repeated Orders                  5    │
│ Customers with multiple purchases        │
├──────────────────────────────────────────┤
│                                          │
│ 👤 Sarah Johnson                    ⬆️   │
│    sarah@email.com                       │
│    4 orders • $1,200 spent               │
│                                          │
│ 👤 Mike Chen                             │
│    mike@email.com                        │
│    3 orders • $850 spent                 │
│                                          │
│ 👤 Emma Wilson                           │
│    emma@email.com                        │
│    2 orders • $450 spent                 │
│                                          │
└──────────────────────────────────────────┘
```

---

## Best Sellers Section

```
┌───────────────────────────────────────────────────┐
│ 🏆 Best Sellers                                   │
│ Top performing products by sales                  │
├───────────────────────────────────────────────────┤
│                                                   │
│ 🥇 [Image] Blue Silk Shirt             👆        │
│            Category                     155 sold  │
│            $3,100                                 │
│                                                   │
│ 🥈 [Image] White Cotton Dress                     │
│            Category                     120 sold  │
│            $2,400                                 │
│                                                   │
│ 🥉 [Image] Black Denim Jeans                      │
│            Category                     95 sold   │
│            $1,900                                 │
│                                                   │
│ 4️⃣ Gray Wool Sweater                   95 sold  │
│    Category                             $1,425    │
│                                                   │
│ 5️⃣ Brown Leather Belt                  72 sold  │
│    Category                             $1,080    │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## Reviews Overview Section

```
┌──────────────────────────────────┐
│ 💬 Recent Reviews          4.2   │
│ Weekly customer feedback          │
├──────────────────────────────────┤
│                                  │
│ ⭐⭐⭐⭐⭐ Sarah Johnson           │
│ "Amazing quality! Highly..."     │
│ Jan 15, 2026                     │
│                                  │
│ ⭐⭐⭐⭐ John Doe                  │
│ "Good product, fast shipping."   │
│ Jan 14, 2026                     │
│                                  │
│ ⭐⭐⭐⭐⭐ Emma Wilson             │
│ "Love it! Will buy again."       │
│ Jan 13, 2026                     │
│                                  │
└──────────────────────────────────┘
```

---

## Reviews Tab (Full Page)

```
┌──────────────────────────────────────────────────┐
│ 💬 All Reviews                           Total: 24 │
│                                                   │
│ ┌──────────────┬──────────────┬──────────────┐  │
│ │ Avg Rating   │ Approved     │ Pending      │  │
│ │     4.2      │     18       │      6       │  │
│ └──────────────┴──────────────┴──────────────┘  │
│                                                   │
│ [All] [Approved] [Pending]                       │
│                                                   │
│ ┌────────────────────────────────────────────┐  │
│ │ 👤 Sarah Johnson          ✅               │  │
│ │    sarah@email.com                         │  │
│ │    Jan 15, 2026                            │  │
│ │    ⭐⭐⭐⭐⭐                            │  │
│ │    "Amazing quality! Highly recommend!"   │  │
│ └────────────────────────────────────────────┘  │
│                                                   │
│ ┌────────────────────────────────────────────┐  │
│ │ 👤 Mike Chen              ⚠️               │  │
│ │    mike@email.com                          │  │
│ │    Jan 14, 2026                            │  │
│ │    ⭐⭐⭐⭐                              │  │
│ │    "Good product, but shipping took..."   │  │
│ │    [Approve]                               │  │
│ └────────────────────────────────────────────┘  │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## Activity Log Tab (Full Page)

```
┌─────────────────────────────────────────────────────┐
│ 📊 Activity Log                                     │
│                                                     │
│ [All] [Order] [Product] [Review] [User] [System]   │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ 🛒 Order Placed                        2h ago │ │
│ │ by Admin (admin@example.com)                  │ │
│ │ Customer placed order #12345 for $250.00      │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ 📦 Product Added                       5h ago │ │
│ │ by Admin (admin@example.com)                  │ │
│ │ New product "Blue Shirt" added to inventory   │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ 💬 Review Approved                    1d ago  │ │
│ │ by Admin (admin@example.com)                  │ │
│ │ Customer review "Amazing!" approved           │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ ⚙️ Settings Updated                   2d ago  │ │
│ │ by Admin (admin@example.com)                  │ │
│ │ Dashboard theme changed to dark mode          │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Dark Mode Appearance

```
┌─────────────────────────────────────────────────────────────┐
│ LIGHT MODE           →          DARK MODE                   │
├─────────────────────────────────────────────────────────────┤
│ White background              Dark background (#0A0A0A)     │
│ Dark text (#1F2937)           Light text (gray-200)         │
│ Light borders (gray-200)      Dark borders (neutral-800)    │
│ Gold accents (#E5A93A)        Gold accents (#E5A93A)        │
│                               Semi-transparent overlays      │
│ Hover: light gold             Hover: light gold             │
│ Clear shadows                 Subtle shadows                │
└─────────────────────────────────────────────────────────────┘
```

---

## Responsive Mobile Layout

### Mobile (< 640px)

```
┌──────────────────┐
│  NAVBAR          │
├──────────────────┤
│  [☰] Search [🔔] │
│      [⚙️] [👤]   │
├──────────────────┤
│                  │
│  SIDEBAR         │
│  (Collapsed)     │
│                  │
│  ────────────    │
│                  │
│  CONTENT AREA    │
│  (Full Width)    │
│                  │
│  Welcome Card    │
│  ────────────    │
│  Summary Cards   │
│  (1 Column)      │
│  ────────────    │
│  Revenue Chart   │
│  ────────────    │
│  Reviews         │
│  ────────────    │
│  Repeated Orders │
│  ────────────    │
│  Best Sellers    │
│                  │
└──────────────────┘
```

### Tablet (640-1024px)

```
┌────────────────────────────────────────┐
│  NAVBAR                                │
├────────────────────────────────────────┤
│  [☰] Search          [🔔] [⚙️] [👤]   │
├──────────┬───────────────────────────┤
│ SIDEBAR  │  CONTENT                  │
│          │  Welcome Card             │
│ ────     │  Summary Cards (2 cols)   │
│          │  Revenue Chart            │
│ ────     │  Reviews | Repeated Ord.  │
│          │  Best Sellers             │
│          │                           │
│ ────     │  ────────────────────     │
│[Logout]  │                           │
└──────────┴───────────────────────────┘
```

### Desktop (> 1024px)

```
Full layout as shown in main structure above
With 2+ column layouts for optimal use of space
```

---

## Color Palette

```
Primary Colors:
┌─────────────────────────────────┐
│ Gold Accent:    #E5A93A        │ (Main brand color)
│ Gold Light:     #E5A93A (10%)  │ (Background)
│ Brown:          #8C6219        │ (Secondary)
└─────────────────────────────────┘

Neutral Colors (Light Mode):
┌─────────────────────────────────┐
│ Background:     #F9F9F9        │
│ Surface:        #FFFFFF        │
│ Border:         #E5E7EB        │
│ Text Primary:   #1F2937        │
│ Text Secondary: #6B7280        │
│ Text Tertiary:  #9CA3AF        │
└─────────────────────────────────┘

Neutral Colors (Dark Mode):
┌─────────────────────────────────┐
│ Background:     #0A0A0A        │
│ Surface:        #0F0F0F        │
│ Border:         #404040        │
│ Text Primary:   #F3F4F6        │
│ Text Secondary: #D1D5DB        │
│ Text Tertiary:  #9CA3AF        │
└─────────────────────────────────┘

Status Colors:
┌─────────────────────────────────┐
│ Success:        #10B981        │
│ Warning:        #F59E0B        │
│ Danger:         #EF4444        │
│ Info:           #3B82F6        │
│ Pending:        #F59E0B        │
│ Processing:     #3B82F6        │
│ Approved:       #10B981        │
└─────────────────────────────────┘
```

---

## Typography

```
Page Title (h1):
• Font Size: 30px
• Font Weight: Bold (700)
• Letter Spacing: Tight

Section Title (h3):
• Font Size: 18px
• Font Weight: Semibold (600)
• Color: Primary text

Label/Badge:
• Font Size: 10px
• Font Weight: Semibold (600)
• Letter Spacing: Wide
• Text Transform: Uppercase

Body Text:
• Font Size: 14px
• Font Weight: Regular (400)
• Line Height: 1.5
• Color: Primary/Secondary text

Small Text:
• Font Size: 12px
• Font Weight: Regular (400)
• Color: Secondary/Tertiary text
```

---

## Icon Reference

```
Navigation:
📊 LayoutGrid      = Overview
⊞ Layers          = Home/Collections
🚚 Truck           = Orders
📦 Package         = Inventory
💬 MessageSquare   = Reviews
📈 Activity        = Activity Log

Actions:
🔔 Bell           = Notifications
🔍 Search         = Search bar
🌙 Moon           = Dark mode
☀️  Sun           = Light mode
👤 UserCircle     = Profile
🚪 LogOut         = Logout
🔗 ExternalLink   = Visit Site

Data Display:
💵 DollarSign     = Revenue
🛒 ShoppingCart   = Orders
⏱️  Clock         = Timing
👥 Users          = Customers
⭐ Star           = Ratings
🏆 Award          = Best sellers
🔄 Repeat2        = Repeated orders
✓ Check           = Approved
⚠️  AlertCircle   = Pending
```

---

## Interaction States

```
Button States:
┌─────────────────────────────────────┐
│ Default:   Border light, text dark  │
│ Hover:     Border gold, text gold   │
│ Active:    Gold bg, dark text       │
│ Disabled:  Gray border, gray text   │
└─────────────────────────────────────┘

Input States:
┌─────────────────────────────────────┐
│ Default:   Light border             │
│ Focus:     Gold border, outline     │
│ Error:     Red border               │
│ Disabled:  Gray background          │
└─────────────────────────────────────┘

Card States:
┌─────────────────────────────────────┐
│ Default:   Light bg, light border   │
│ Hover:     Subtle gold border       │
│ Active:    Gold bg (10%)            │
│ Dark:      Dark bg, dark border     │
└─────────────────────────────────────┘
```

---

## Animation Timing

```
Fade In:       700ms (ease-in-out)
Hover Effects: 300ms (ease-in-out)
Loading Pulse: Continuous animation
Transitions:   500ms (color/border changes)
```

---

## Accessibility Features

✅ Semantic HTML
✅ ARIA labels for icon buttons
✅ Color contrast meets WCAG AA
✅ Keyboard navigation support
✅ Focus states visible
✅ Error messages descriptive
✅ Form labels associated
✅ Dark mode reduces eye strain

---

This completes the visual reference guide for the admin dashboard!
