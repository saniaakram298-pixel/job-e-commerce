import { connectDB } from '@/lib/mongodb';
import { Collection as CollectionModel } from '@/models/Collection';
import dynamic from 'next/dynamic';

const DashboardClient = dynamic(() => import('./DashboardClient'), { ssr: false });

export const revalidate = 0;

async function fetchInitialCollections() {
  try {
    await connectDB();

    // Run queries without an artificial timeout wrapper to avoid premature cancellations
    const [collections, total] = await Promise.all([
      CollectionModel.find()
        .select('_id title tag img category stock price description collection createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
        .exec(),
      CollectionModel.estimatedDocumentCount().exec(),
    ]);

    const sanitized = (collections || []).map((item: any) => ({
      ...item,
      _id: item._id?.toString?.() ?? item._id,
      productId: item.productId?.toString?.() ?? item.productId,
    }));

    return { collections: sanitized, total: typeof total === 'number' ? total : sanitized.length, error: null };
  } catch (error: any) {
    console.error('[admin/dashboard] fetchInitialCollections error:', error?.message ?? error);
    const errorDetails = error?.reason?.message || error?.message || String(error ?? 'Unable to load dashboard data');
    return {
      collections: [],
      total: 0,
      error: errorDetails,
    };
  }
}

export default async function Page() {
  const { collections, total, error } = await fetchInitialCollections();
  return <DashboardClient collections={collections} total={total} initialError={error} />;
}
