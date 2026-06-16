import { connectDB } from '@/lib/mongodb';
import { Collection as CollectionModel } from '@/models/Collection';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

async function fetchInitialCollections() {
  try {
    await connectDB();
    const collections = await CollectionModel.find().sort({ createdAt: -1 }).lean();
    const sanitized = (collections || []).map((item: any) => ({
      ...item,
      _id: item._id?.toString?.() ?? item._id,
      productId: item.productId?.toString?.() ?? item.productId,
    }));
    return { collections: sanitized, error: null };
  } catch (error: any) {
    console.error('[admin/dashboard] fetchInitialCollections error:', error);
    return {
      collections: [],
      error: String(error?.message ?? error ?? 'Unable to load dashboard data'),
    };
  }
}

export default async function Page() {
  const { collections, error } = await fetchInitialCollections();
  return <DashboardClient collections={collections} initialError={error} />;
}
