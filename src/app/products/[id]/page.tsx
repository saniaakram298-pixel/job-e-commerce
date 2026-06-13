import { redirect } from 'next/navigation';

interface ProductsLegacyPageProps {
  params: { id: string };
}

export default function ProductsLegacyPage({ params }: ProductsLegacyPageProps) {
  redirect(`/product/${params.id}`);
}
