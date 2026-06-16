/**
 * Product Types - Separated from Mongoose models to prevent bundling
 * These types should be used in client-side code
 */

export type ProductCategory = 
  | 'bridal' 
  | 'groom' 
  | 'formal' 
  | 'informal' 
  | 'children' 
  | 'men' 
  | 'women' 
  | 'old-people' 
  | 'young' 
  | 'new-arrival'
  | 'accessories';

export interface ProductTypedef {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  collection: string;
  category: ProductCategory;
  images: string[];
  img?: string;
  materials: string[];
  sizes: Array<{
    size: string;
    stock: number;
  }>;
  colors: Array<{
    color: string;
    stock: number;
  }>;
  tags: string[];
  rating: number;
  reviews: string[];
  careInstructions?: string;
  fit?: string;
  featured: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategoryRecord = Record<ProductCategory, string>;
