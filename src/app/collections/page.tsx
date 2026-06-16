import { connectDB } from '@/lib/mongodb';
import { Collection as CollectionModel } from '@/models/Collection';
import CollectionsClient from './CollectionsClient';

export const dynamic = 'force-dynamic';

interface Product {
  id: string;
  _id: string;
  name: string;
  title: string;
  price: string;
  numericPrice: number;
  img: string;
  category: string;
  createdAt: string;
  description?: string;
  tags?: string[];
  sizes?: Array<{ size: string; stock: number }>;
  stock?: number;
  collection?: string;
}

interface Section {
  title: string;
  category: string;
  items: Product[];
}

async function fetchInitialCollections(): Promise<{
  rawProducts: Product[];
  activeSections: Section[];
}> {
  try {
    await connectDB();
    const collectionsData = await CollectionModel.find()
      .sort({ createdAt: -1 })
      .lean();

    const formattedProducts: Product[] = (collectionsData || []).map((item: any) => ({
      id: item._id?.toString?.() ?? item._id,
      _id: item._id?.toString?.() ?? item._id,
      name: item.title,
      title: item.title,
      price: `$${item.price}`,
      numericPrice: Number(item.price),
      img: item.img || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80',
      category: item.category || 'General',
      createdAt: item.createdAt,
      description: item.description || '',
      tags: item.tags || [],
      sizes: item.sizes || [],
      stock: item.stock || 0,
      collection: item.collection || 'general',
    }));

    const structuredData: Section[] = [];
    formattedProducts.forEach((adminItem: Product) => {
      const categoryName = adminItem.category || 'General';
      const matchedSection = structuredData.find(
        section => section.category.toLowerCase() === categoryName.toLowerCase()
      );

      const newItem: Product = {
        ...adminItem,
        category: categoryName,
      };

      if (matchedSection) {
        matchedSection.items.push(newItem);
      } else {
        structuredData.push({
          title: `${categoryName} Collection`,
          category: categoryName,
          items: [newItem],
        });
      }
    });

    return {
      rawProducts: formattedProducts,
      activeSections: structuredData,
    };
  } catch (error) {
    console.error('Error fetching collections:', error);
    return {
      rawProducts: [],
      activeSections: [],
    };
  }
}

export default async function Page() {
  const { rawProducts, activeSections } = await fetchInitialCollections();
  return (
    <CollectionsClient
      initialRawProducts={rawProducts}
      initialActiveSections={activeSections}
    />
  );
}