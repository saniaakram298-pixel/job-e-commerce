import mongoose, { Schema, Model } from 'mongoose';

export interface ICart {
  _id: mongoose.Types.ObjectId | string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    size?: string;
    color?: string;
    price: number;
  }>;
  totalPrice: number;
  updatedAt: Date;
}

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    items: [
      {
        productId: String,
        quantity: { type: Number, default: 1 },
        size: String,
        color: String,
        price: Number,
      },
    ],
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

if (mongoose.models.Cart) {
  delete mongoose.models.Cart;
}
export const Cart: Model<ICart> = mongoose.model<ICart>('Cart', cartSchema);
