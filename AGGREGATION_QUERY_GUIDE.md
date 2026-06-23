# Mongoose Aggregation Query Breakdown

## Overview
The follow-up system uses a MongoDB aggregation pipeline to efficiently fetch orders pending for 48+ hours directly from the database.

---

## The Aggregation Pipeline (Step-by-Step)

### Location
📄 [src/app/api/admin/pending-orders/route.ts](src/app/api/admin/pending-orders/route.ts)

### Query Code
```typescript
const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000);

const pendingOrders = await Order.aggregate([
  {
    $match: {
      orderStatus: { $in: ['pending', 'processing'] },
      createdAt: { $lt: cutoffTime },
    },
  },
  {
    $addFields: {
      hoursOld: {
        $divide: [
          { $subtract: [new Date(), '$createdAt'] },
          1000 * 60 * 60,
        ],
      },
      daysOld: {
        $divide: [
          { $subtract: [new Date(), '$createdAt'] },
          1000 * 60 * 60 * 24,
        ],
      },
    },
  },
  {
    $sort: { createdAt: 1 },
  },
  {
    $limit: 50,
  },
  {
    $project: {
      _id: 1,
      orderNumber: 1,
      customerName: 1,
      customerEmail: 1,
      orderStatus: 1,
      totalPrice: 1,
      createdAt: 1,
      hoursOld: { $round: ['$hoursOld', 2] },
      daysOld: { $round: ['$daysOld', 2] },
      followUpNotes: 1,
    },
  },
]);
```

---

## Stage-by-Stage Explanation

### Stage 1: `$match` (Filter)
```javascript
{
  $match: {
    orderStatus: { $in: ['pending', 'processing'] },
    createdAt: { $lt: cutoffTime }
  }
}
```

**What it does:**
- Filters orders where `orderStatus` is either "pending" or "processing"
- Filters to only orders created BEFORE the 48-hour cutoff time
- This is like a WHERE clause in SQL

**Example:**
```
Input: All 1000 orders in database
Output: 23 orders matching the criteria
```

---

### Stage 2: `$addFields` (Compute)
```javascript
{
  $addFields: {
    hoursOld: {
      $divide: [
        { $subtract: [new Date(), '$createdAt'] },
        1000 * 60 * 60
      ]
    },
    daysOld: {
      $divide: [
        { $subtract: [new Date(), '$createdAt'] },
        1000 * 60 * 60 * 24
      ]
    }
  }
}
```

**What it does:**
- Calculates the age of each order in hours and days
- `$subtract`: Subtracts createdAt from current time (gives milliseconds elapsed)
- `$divide`: Converts milliseconds to hours or days
- Results are added as new fields to each document

**Example:**
```
Order created: 2026-06-20 14:00 (3 days ago)
Current time: 2026-06-23 16:00
hoursOld = (3 days + 2 hours) × 24 = 74 hours
daysOld = 3.08 days
```

---

### Stage 3: `$sort` (Order)
```javascript
{
  $sort: { createdAt: 1 }
}
```

**What it does:**
- Sorts results by creation date in ascending order (oldest first)
- Shows the most urgent orders first
- Like ORDER BY in SQL

**Example:**
```
Before: [Order #42 (3 days), Order #15 (4 days), Order #8 (2.5 days)]
After:  [Order #15 (4 days), Order #42 (3 days), Order #8 (2.5 days)]
```

---

### Stage 4: `$limit` (Reduce)
```javascript
{
  $limit: 50
}
```

**What it does:**
- Limits results to first 50 documents
- Prevents overwhelming the UI with too many orders
- Improves performance for large datasets

**Example:**
```
Before: 23 pending orders
After: 23 pending orders (no change since we have less than 50)
```

---

### Stage 5: `$project` (Shape)
```javascript
{
  $project: {
    _id: 1,
    orderNumber: 1,
    customerName: 1,
    customerEmail: 1,
    orderStatus: 1,
    totalPrice: 1,
    createdAt: 1,
    hoursOld: { $round: ['$hoursOld', 2] },
    daysOld: { $round: ['$daysOld', 2] },
    followUpNotes: 1
  }
}
```

**What it does:**
- Selects which fields to include in the result (1 = include, 0 = exclude)
- `$round`: Rounds hoursOld and daysOld to 2 decimal places
- Like SELECT in SQL
- Reduces payload size by excluding unnecessary fields

**Example:**
```
Before: {_id, userId, orderNumber, items[], shippingAddress, billingAddress, ...40+ fields}
After: {_id, orderNumber, customerName, hoursOld, daysOld, ...8 fields}
Reduction: ~80% smaller document size
```

---

## Complete Data Flow

```
MongoDB Database (All Orders)
         ↓
    $match Stage
    (23 orders match 48h+ filter)
         ↓
   $addFields Stage
   (Calculate hoursOld, daysOld)
         ↓
    $sort Stage
    (Sort by oldest first)
         ↓
   $limit Stage
   (Keep first 50)
         ↓
  $project Stage
  (Shape response)
         ↓
React Query Component
(Display in PendingOrdersAlert)
```

---

## Performance Benefits

### 1. **Server-Side Filtering**
- Filters happen in MongoDB before sending to client
- Only 23 documents returned instead of 1000+
- ✅ 98% smaller network payload

### 2. **Server-Side Calculation**
- Computed fields (hoursOld, daysOld) calculated in database
- No extra JavaScript needed on client
- ✅ Faster UI rendering

### 3. **Indexed Query**
- MongoDB can index `orderStatus` and `createdAt` fields
- Aggregation leverages existing indexes
- ✅ Query runs in milliseconds even with millions of orders

### 4. **Shaped Response**
- Only necessary fields included
- Removes nested objects not needed in UI
- ✅ Less memory on client side

---

## Example Output

```json
{
  "success": true,
  "data": [
    {
      "_id": "609c6e1d8f3c4a0015a9b2c1",
      "orderNumber": 15,
      "customerName": "Sarah Johnson",
      "customerEmail": "sarah@example.com",
      "orderStatus": "pending",
      "totalPrice": 599.99,
      "createdAt": "2026-06-19T14:00:00.000Z",
      "hoursOld": 98.5,
      "daysOld": 4.1,
      "followUpNotes": [
        {
          "message": "First follow-up sent",
          "timestamp": "2026-06-21T10:30:00.000Z",
          "sentBy": "admin"
        }
      ]
    },
    {
      "_id": "609c6e1d8f3c4a0015a9b2c2",
      "orderNumber": 42,
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "orderStatus": "processing",
      "totalPrice": 299.99,
      "createdAt": "2026-06-20T14:00:00.000Z",
      "hoursOld": 74.5,
      "daysOld": 3.1,
      "followUpNotes": []
    }
  ]
}
```

---

## Database Requirements

For optimal performance, ensure these indexes exist:

```javascript
// In your database initialization or migration
db.orders.createIndex({ orderStatus: 1, createdAt: 1 });
db.orders.createIndex({ orderStatus: 1 });
db.orders.createIndex({ createdAt: 1 });
```

---

## Time Complexity

| Component | Complexity | Time |
|-----------|-----------|------|
| $match | O(log n) | ~5-10ms |
| $addFields | O(n) | ~2-5ms |
| $sort | O(n log n) | ~5-10ms |
| $limit | O(1) | <1ms |
| $project | O(n) | ~1-2ms |
| **Total** | **O(n log n)** | **~15-30ms** |

*Approximate times for 10,000 orders database*

---

## SQL Equivalent

If you're familiar with SQL, here's the equivalent query:

```sql
SELECT 
  _id,
  orderNumber,
  customerName,
  customerEmail,
  orderStatus,
  totalPrice,
  createdAt,
  ROUND(EXTRACT(EPOCH FROM (NOW() - createdAt)) / 3600, 2) AS hoursOld,
  ROUND(EXTRACT(EPOCH FROM (NOW() - createdAt)) / 86400, 2) AS daysOld,
  followUpNotes
FROM orders
WHERE 
  orderStatus IN ('pending', 'processing')
  AND createdAt < NOW() - INTERVAL '48 hours'
ORDER BY createdAt ASC
LIMIT 50;
```

---

## Next Optimization Ideas

1. **Pagination:** Add $skip stage for page-based results
2. **Text Search:** Add $match with $text for customer name search
3. **Grouping:** Use $group to count by status or date
4. **Facets:** Use $facet for multiple aggregations in one query
5. **Lookup:** Join with other collections using $lookup
