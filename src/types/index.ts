export type ProductCategory = string;

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
  averageRating?: number;
  totalReviews?: number;
  careInstructions?: string;
  fit?: string;
  featured: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
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
  deliveredAt?: string;
  returnStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  returnRequestedAt?: string;
  returnApprovedAt?: string;
  returnRejectedAt?: string;
  returnNotes?: string;
  followUpNotes?: Array<{
    message: string;
    timestamp: string;
    sentBy?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export type ReturnStatus = 'pending' | 'approved' | 'rejected';

export interface ReturnHistoryItem {
  status: ReturnStatus;
  note: string;
  timestamp: string;
}

export interface ReturnRequest {
  _id: string;
  userId?: string;
  orderId: string | {
    _id: string;
    orderNumber: number;
    orderStatus: string;
    customerName?: string;
    customerEmail?: string;
    totalPrice?: number;
  };
  productId?: string;
  customerName?: string;
  email?: string;
  customerEmail?: string;
  reason: string;
  description?: string;
  details?: string;
  images?: string[];
  video?: string;
  status: ReturnStatus;
  adminMessage?: string;
  history: ReturnHistoryItem[];
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
  orderId?: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

// Homepage Component Types
export interface Arrival {
  updatedAt: any;
  createdAt: any;
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
  averageRating?: number;
  totalReviews?: number;
  reviewCount?: number;
  featured?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
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
  images?: string[];
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
