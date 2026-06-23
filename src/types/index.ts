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

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  collection: string;
  category: ProductCategory;
  images: string[];
  materials: string[];
  sizes: Array<{
    size: string;
    stock: number;
  }>;
  colors: Array<{
    color: string;
    stock: number;
  }>;
  img?: string;
  rating: number;
  reviews: string[];
  careInstructions?: string;
  fit?: string;
  featured: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
  price: number;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  totalPrice: number;
  updatedAt: string;
}

export interface ProductRef {
  _id: string;
  name: string;
  images: string[];
  img?: string;
}

export interface OrderItem {
  productId: string | ProductRef;
  name: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

export interface Order {
  _id: string;
  userId: string;
  orderNumber: number;
  items: OrderItem[];
  totalPrice: number;
  shippingAddress: Address;
  billingAddress: Address;
  customerName?: string;
  customerEmail?: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  notes?: string;
  followUpNotes?: Array<{
    message: string;
    timestamp: string;
    sentBy?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Review {
  _id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

// Homepage Component Types
export interface Arrival {
  id: string;
  name: string;
  img: string;
  price: string;
  cat: string;
  category?: string;
  images?: string[];
  collectionName?: string;
  tags?: string[];
  rating?: number;
  featured?: boolean;
  collection?: string;
  _id?: string;
  stock?: number;
}

export interface NavLink {
  name: string;
  href: string;
}

export interface HeroData {
  title: string;
  buttonText: string;
  imagePath: string;
  href: string;
  subtitle?: string;
}

export interface Category {
  products: number[];
  name: string;
  id: string;
  img: string;
}

export interface TrustBadge {
  icon: string;
  title: string;
  desc: string;
}

export interface SubItem {
  name: string;
  id: string;
}
