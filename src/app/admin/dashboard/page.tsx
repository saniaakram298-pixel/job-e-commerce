import { connectDB, withQueryTimeout } from '@/lib/mongodb';
import { Collection as CollectionModel } from '@/models/Collection';
import dynamic from 'next/dynamic';

const DashboardClient = dynamic(() => import('./DashboardClient'), { ssr: false });

export const revalidate = 0;

async function fetchInitialCollections() {
  try {
    await connectDB();

    // Wrap queries with server-side maxTimeMS to prevent hanging queries
    const collections = await withQueryTimeout(
      () =>
        CollectionModel.find()
          .select('_id title tag img category stock price description createdAt updatedAt')
          .sort({ createdAt: -1 })
          .limit(20)
          .lean()
          .maxTimeMS(25000)
          .exec(),
      30000 // 30 second timeout for initial fetch
    );

    const sanitized = (collections || []).map((item: any) => ({
      ...item,
      _id: item._id?.toString?.() ?? item._id,
      productId: item.productId?.toString?.() ?? item.productId,
    }));

    return { collections: sanitized, error: null };
  } catch (error: any) {
    console.error('[admin/dashboard] fetchInitialCollections error:', error?.message ?? error);
    const errorDetails = error?.reason?.message || error?.message || String(error ?? 'Unable to load dashboard data');
    return {
      collections: [],
      error: errorDetails,
    };
  }
}

export default async function Page() {
  const { collections, error } = await fetchInitialCollections();
  return <DashboardClient collections={collections} initialError={error} />;
}
