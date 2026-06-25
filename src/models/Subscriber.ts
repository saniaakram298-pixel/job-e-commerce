
import mongoose, { Schema, Model } from 'mongoose';

export interface ISubscriber {
  _id: mongoose.Types.ObjectId | string;
  email: string;
  subscribedAt: Date;
  active: boolean;
}

const subscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: 'subscribedAt', updatedAt: false },
  }
);

if (mongoose.models.Subscriber) {
  delete mongoose.models.Subscriber;
}
export const Subscriber: Model<ISubscriber> = mongoose.model<ISubscriber>('Subscriber', subscriberSchema);
