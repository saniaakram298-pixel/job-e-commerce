import mongoose, { Schema, Model } from 'mongoose';

export interface IOrder {
  _id: mongoose.Types.ObjectId | string;
  userId?: string;
  orderNumber?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
  }>;
  totalPrice: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  notes?: string;
  followUpNotes?: Array<{
    message: string;
    timestamp: Date;
    sentBy?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: String,
      required: false,
    },
    orderNumber: {
      type: Number,
      unique: true,
      sparse: true,
    },
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    items: [
      {
        productId: String,
        name: String,
        quantity: Number,
        price: Number,
        size: String,
        color: String,
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    billingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    paymentMethod: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    trackingNumber: String,
    notes: String,
    followUpNotes: [
      {
        message: String,
        timestamp: { type: Date, default: Date.now },
        sentBy: String,
      },
    ],
  },
  { timestamps: true }
);

if (mongoose.models.Order) {
  delete mongoose.models.Order;
}
export const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);
