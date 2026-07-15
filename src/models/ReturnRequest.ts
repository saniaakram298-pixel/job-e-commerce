import mongoose, { Schema, Model } from 'mongoose';

export type ReturnStatus = 'pending' | 'approved' | 'rejected';

export interface IReturnHistoryItem {
  status: ReturnStatus;
  note: string;
  timestamp: Date;
}

export interface IReturnRequest {
  _id: mongoose.Types.ObjectId | string;
  userId?: mongoose.Types.ObjectId | string;
  orderId: mongoose.Types.ObjectId | string;
  productId?: mongoose.Types.ObjectId | string;
  customerName?: string;
  email: string;
  customerEmail?: string;
  reason: string;
  description?: string;
  details?: string;
  images?: string[];
  video?: string;
  status: ReturnStatus;
  adminMessage?: string;
  history: IReturnHistoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const returnHistorySchema = new Schema<IReturnHistoryItem>(
  {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      required: true,
    },
    note: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const returnRequestSchema = new Schema<IReturnRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Order',
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    customerName: String,
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    customerEmail: String,
    reason: {
      type: String,
      required: true,
    },
    description: String,
    details: String,
    images: [String],
    video: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminMessage: String,
    history: {
      type: [returnHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

if (mongoose.models.ReturnRequest) {
  delete mongoose.models.ReturnRequest;
}

export const ReturnRequest: Model<IReturnRequest> = mongoose.model<IReturnRequest>('ReturnRequest', returnRequestSchema);