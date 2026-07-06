import mongoose, { Schema, Model } from 'mongoose';

export type ReturnStatus = 'pending' | 'verified' | 'approved' | 'rejected' | 'completed';

export interface IReturnHistoryItem {
  status: ReturnStatus;
  note: string;
  timestamp: Date;
}

export interface IReturnRequest {
  _id: mongoose.Types.ObjectId | string;
  orderId: mongoose.Types.ObjectId | string;
  customerEmail: string;
  reason: string;
  details?: string;
  status: ReturnStatus;
  history: IReturnHistoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const returnHistorySchema = new Schema<IReturnHistoryItem>(
  {
    status: {
      type: String,
      enum: ['pending', 'verified', 'approved', 'rejected', 'completed'],
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
    orderId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Order',
    },
    customerEmail: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    details: String,
    status: {
      type: String,
      enum: ['pending', 'verified', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
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