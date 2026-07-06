import mongoose, { Schema, Model } from 'mongoose';

export interface IEmailVerification {
  _id: mongoose.Types.ObjectId | string;
  email: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

const emailVerificationSchema = new Schema<IEmailVerification>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

if (mongoose.models.EmailVerification) {
  delete mongoose.models.EmailVerification;
}

export const EmailVerification: Model<IEmailVerification> = mongoose.model<IEmailVerification>(
  'EmailVerification',
  emailVerificationSchema
);