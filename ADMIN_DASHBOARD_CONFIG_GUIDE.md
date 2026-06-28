# Admin Dashboard - Configuration & Customization Guide

## Configuration Options

### 1. Notification Settings

**File:** `src/app/admin/dashboard/DashboardClient.tsx`

#### Show/Hide Notification Dropdown
```tsx
// Current: Always shown when bell clicked
// To hide notifications permanently, comment out or remove this code:
{showNotificationDropdown && (
    <div className={`absolute right-0 z-10 mt-2 w-80...`}>
        {/* Notification dropdown content */}
    </div>
)}
```

#### Change Notification Count Threshold
```tsx
// Line ~192 in DashboardClient.tsx
const notificationCount = useMemo(() => {
    const pendingOrderCount = (orders || []).filter((order: any) => 
        ['pending', 'processing'].includes(order.orderStatus)
    ).length;
    
    // Add more conditions here:
    const cancelledOrderCount = (orders || []).filter((order: any) => 
        order.orderStatus === 'cancelled'
    ).length;
    
    return pendingOrderCount + (Array.isArray(pendingOrders) ? pendingOrders.length : 0);
}, [orders, pendingOrders]);
```

#### Filter Notification Types
```tsx
const getNotifications = () => {
    const pendingOrders = (orders || [])
        .filter((order: any) => ['pending', 'processing'].includes(order.orderStatus))
        // Add additional filters:
        .filter((order: any) => order.totalPrice > 100) // Only high-value orders
        .filter((order: any) => !dismissedNotifications.has(order._id));
    
    return [...pendingOrders, ...followUps].slice(0, 5);
};
```

---

### 2. Revenue Chart Customization

**File:** `src/components/admin/RevenueChart.tsx`

#### Change Time Period Defaults
```tsx
const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly'); // Change from 'weekly'
```

#### Add More Time Periods
```tsx
type TimePeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly'; // Add 'quarterly'

// In queryKey and endpoint selection:
timePeriod === 'quarterly' ? '/admin/revenue/quarterly' : ...
```

#### Customize Chart Colors
```tsx
<Bar dataKey="revenue" fill="#E5A93A" name="Revenue ($)" /> {/* Change #E5A93A */}
<Bar dataKey="orders" fill="#8C6219" name="Orders" /> {/* Change #8C6219 */}
```

#### Change Chart Type
```tsx
// Current: BarChart
// Replace with:
import { LineChart, Line } from 'recharts'; // For line chart

// Instead of BarChart and Bar components:
<LineChart data={chartData}>
    <Line type="monotone" dataKey="revenue" stroke="#E5A93A" />
    <Line type="monotone" dataKey="orders" stroke="#8C6219" />
</LineChart>
```

---

### 3. Notification Settings - What Counts as "Notification"

**File:** `src/app/admin/dashboard/DashboardClient.tsx` (Line ~191)

Current logic:
```tsx
const notificationCount = useMemo(() => {
    const pendingOrderCount = (orders || []).filter((order: any) => 
        ['pending', 'processing'].includes(order.orderStatus)
    ).length;
    return pendingOrderCount + (Array.isArray(pendingOrders) ? pendingOrders.length : 0);
}, [orders, pendingOrders]);
```

To add other notifications:
```tsx
// Include pending reviews
const pendingReviewCount = reviews?.filter(r => !r.approved).length ?? 0;

// Include low stock items
const lowStockCount = collections?.filter(c => c.stock < 5).length ?? 0;

// Updated count:
return pendingOrderCount + followUpCount + pendingReviewCount + lowStockCount;
```

---

### 4. Best Sellers Configuration

**File:** `src/components/admin/BestSellersSection.tsx`

#### Show More/Fewer Products
```tsx
// Line showing data fetch
const { data: bestSellers = [], isLoading } = useQuery<BestSeller[], Error>({
    queryKey: ['admin-best-sellers'],
    queryFn: async () => {
        const res = await api.get('/admin/best-sellers', true);
        return res?.data ?? res ?? [];
    },
    // ...
});

// In the map/render section, change:
.slice(0, 10) // Change 10 to desired number
```

#### Sort By Different Metrics
**File:** `src/app/api/admin/best-sellers/route.ts`

```tsx
// Current: sort by quantity
.sort((a, b) => b.quantity - a.quantity)

// Sort by revenue instead:
.sort((a, b) => b.revenue - a.revenue)

// Sort by revenue per unit:
.sort((a, b) => (b.revenue/b.quantity) - (a.revenue/a.quantity))
```

---

### 5. Reviews Component Settings

**File:** `src/components/admin/ReviewsComponent.tsx`

#### Set Default Filter
```tsx
const [filterApproved, setFilterApproved] = useState<'all' | 'approved' | 'pending'>('pending'); // Show pending by default
```

#### Change Review List Height
```tsx
{reviews.length > 0 ? (
    <div className="space-y-3 max-h-96 overflow-y-auto"> {/* Change max-h-96 */}
```

#### Show More Reviews Per Page
```tsx
// Change this line:
reviews.slice(0, 5) // Show 5 reviews

// To:
reviews.slice(0, 10) // Show 10 reviews
```

---

### 6. Activity Log Customization

**File:** `src/components/admin/ActivityLog.tsx`

#### Change Default Filter
```tsx
const [filterType, setFilterType] = useState<'all' | ActivityLog['type']>('system'); // Show system logs by default
```

#### Modify Activity Types
```tsx
// Add new activity types:
type ActivityLog['type'] = 'order' | 'product' | 'review' | 'user' | 'system' | 'payment' | 'refund';

// Add color mapping:
case 'payment':
    return 'bg-green-500/10 text-green-600';
case 'refund':
    return 'bg-red-500/10 text-red-600';
```

#### Change Log History Size
**File:** `src/app/api/admin/activity-logs/route.ts`

```tsx
// Keep only last X logs in memory (line ~63):
if (activityLogs.length > 1000) { // Change 1000
    activityLogs = activityLogs.slice(-1000);
}

// Limit returned logs:
.slice(0, 100) // Change 100
```

---

### 7. Color Theme Customization

All components use Tailwind classes. Change colors globally:

**Search and Replace:**
- `#E5A93A` → Your gold color
- `#8C6219` → Your brown color
- `neutral-800` → Your dark background
- `neutral-200` → Your light border

Or update in each component's className attributes.

---

### 8. Dark Mode Implementation

Current: Client-side state only (resets on refresh)

To persist dark mode:

**Add localStorage:**
```tsx
// In DashboardClient.tsx
const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('darkMode') === 'true';
    }
    return false;
});

const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
};
```

---

### 9. API Response Customization

#### Change Data Grouping in Revenue API
**File:** `src/app/api/admin/revenue/weekly/route.ts`

Current: Groups by calendar date

```tsx
// Change grouping logic:
const weekNum = Math.ceil(date.getDate() / 7);
// Or use ISO week:
const weekNum = Math.ceil((date.getDate() + date.getDay()) / 7);
```

#### Filter Orders by Status in Revenue
```tsx
// Add status filter:
const orders = await Order.find({
    createdAt: { $gte: sevenDaysAgo },
    orderStatus: { $in: ['shipped', 'delivered'] } // Only completed orders
});
```

---

### 10. Repeated Orders Threshold

**File:** `src/app/api/admin/repeated-orders/route.ts`

Current: Shows customers with 2+ orders

```tsx
// Line ~49:
.filter(([, data]) => data.orders.length > 1) // Change 1 to 2, 3, etc.

// Change to show only customers with 3+ orders:
.filter(([, data]) => data.orders.length > 2)

// Or add minimum spending threshold:
.filter(([, data]) => {
    const totalSpent = data.orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    return data.orders.length > 1 && totalSpent > 500; // At least $500 spent
})
```

---

### 11. Timezone Configuration

All components use server timezone. To change:

**File:** Any API route file

```tsx
// Add timezone handling:
const date = new Date(order.createdAt);
const tzDate = new Date(date.getTime() + (new Date().getTimezoneOffset() * 60000));
// Use tzDate instead of date
```

---

### 12. Real-time Updates

Current: Manual refetch based on intervals

To add real-time updates, integrate Socket.io:

```tsx
// In any component:
useEffect(() => {
    const socket = io('your-socket-server');
    socket.on('revenue-update', (data) => {
        // Update chart with new data
    });
    return () => socket.disconnect();
}, []);
```

---

## Performance Tuning

### 1. Reduce Refetch Interval
```tsx
// Current in any component:
refetchInterval: 60000, // 1 minute

// Change to:
refetchInterval: 30000, // 30 seconds for more updates
// OR
refetchInterval: 300000, // 5 minutes for less frequent updates
```

### 2. Cache Duration
```tsx
// Current:
staleTime: 1000 * 60 * 5, // 5 minutes

// Change to:
staleTime: 1000 * 60 * 10, // 10 minutes for longer cache
```

### 3. Data Pagination
Add pagination to best sellers, reviews, etc.:

```tsx
// In component:
const [page, setPage] = useState(1);
const itemsPerPage = 10;

// In API call:
const queryFn = async () => {
    const res = await api.get(`/admin/reviews?page=${page}&limit=${itemsPerPage}`, true);
    return res?.data ?? [];
};
```

---

## Database Optimization

### 1. Create Indexes

```javascript
// In MongoDB:
db.orders.createIndex({ "createdAt": -1 })
db.orders.createIndex({ "orderStatus": 1 })
db.reviews.createIndex({ "createdAt": -1, "approved": 1 })
db.collection.createIndex({ "_id": 1, "category": 1 })
```

### 2. Optimize Queries
Add `.select()` to limit fields returned:

```tsx
// Current:
const orders = await Order.find({}).lean();

// Optimized:
const orders = await Order.find({})
    .select('totalPrice orderStatus createdAt')
    .lean();
```

---

## Future Enhancement Ideas

1. **Export Reports**
   - Add PDF export buttons
   - CSV download functionality

2. **Custom Date Ranges**
   - Date picker for revenue charts
   - Custom range selection

3. **Email Alerts**
   - Alert on high-value orders
   - Review notification emails

4. **Webhooks**
   - Send order updates to external systems
   - Integrate with CRM

5. **Predictive Analytics**
   - Forecast revenue trends
   - Customer churn prediction

6. **Real-time Notifications**
   - WebSocket integration
   - Push notifications

7. **Advanced Filtering**
   - Multi-select filters
   - Complex query builder

8. **Bulk Operations**
   - Bulk review approval
   - Batch order status updates

9. **Custom Dashboards**
   - User-customizable widgets
   - Save custom layouts

10. **Mobile App**
    - Native admin mobile app
    - Push notifications

---

## Troubleshooting Common Customizations

### Issue: Changes don't appear
- Clear browser cache (Ctrl+Shift+Del)
- Clear Next.js cache (delete `.next` folder)
- Restart dev server

### Issue: Colors look different in dark mode
- Colors might need separate values for dark mode
- Use `dark:` prefix in Tailwind classes
- Check both light and dark variants

### Issue: API returns no data
- Verify database has test data
- Check auth token is valid
- Look for console errors in DevTools

### Issue: Performance is slow
- Enable DevTools Network tab
- Check API response times
- Reduce refetch interval
- Add proper database indexes

---

## Important Notes

- ⚠️ Activity logs are stored in-memory (not persisted)
- ⚠️ Dark mode state doesn't persist on refresh
- ⚠️ Some data aggregations may be slow with large datasets
- ⚠️ All API endpoints require admin authentication

---

Ready to customize! 🎨
