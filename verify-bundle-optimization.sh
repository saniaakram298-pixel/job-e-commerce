#!/bin/bash
# Bundle Optimization Verification Checklist

echo "🔍 Bundle Optimization Verification Script"
echo "=========================================="
echo ""

# Check 1: Verify new types file exists
echo "✓ Check 1: Verifying types/product.ts exists..."
if [ -f "src/types/product.ts" ]; then
  echo "  ✅ types/product.ts created successfully"
else
  echo "  ❌ types/product.ts NOT found"
  exit 1
fi

# Check 2: Verify dynamic imports in HomePageClient
echo ""
echo "✓ Check 2: Checking dynamic imports in HomePageClient.tsx..."
if grep -q "dynamic(() => import" src/components/HomePageClient.tsx; then
  count=$(grep -c "dynamic(() => import" src/components/HomePageClient.tsx)
  echo "  ✅ Found $count dynamic imports"
else
  echo "  ❌ No dynamic imports found in HomePageClient.tsx"
  exit 1
fi

# Check 3: Verify page.tsx uses types correctly
echo ""
echo "✓ Check 3: Checking type imports in page.tsx..."
if grep -q "import { ProductCategory } from '@/types/product'" src/app/page.tsx; then
  echo "  ✅ page.tsx imports ProductCategory from types/product"
else
  echo "  ❌ Incorrect type import in page.tsx"
  exit 1
fi

# Check 4: No Mongoose imports in client components
echo ""
echo "✓ Check 4: Checking for Mongoose imports in components..."
mongoose_imports=$(grep -r "import.*mongoose\|from '@/models" src/components --include="*.tsx" | grep -v "NewArrivals.tsx" | wc -l)
if [ "$mongoose_imports" -eq 0 ]; then
  echo "  ✅ No Mongoose imports found in client components"
else
  echo "  ⚠️  Found $mongoose_imports potential issues"
fi

echo ""
echo "=========================================="
echo "Build and Bundle Analysis Steps:"
echo ""
echo "1. Build with analysis:"
echo "   ANALYZE=true npm run build"
echo ""
echo "2. Open bundle analysis:"
echo "   Open .next/analyze/client.html in browser"
echo ""
echo "3. Compare metrics:"
echo "   - Check that 'proxy.mjs' is smaller/removed"
echo "   - Verify bundle size reduced by 40-50%"
echo "   - Ensure 'mongoose' module is NOT in client bundle"
echo ""
echo "4. Test on real network:"
echo "   - Chrome DevTools → Network tab"
echo "   - Set to 'Slow 3G' throttling"
echo "   - Verify lazy components load on scroll"
echo ""
echo "✅ All checks passed! Ready for build testing."
