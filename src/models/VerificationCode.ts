import mongoose, { Schema, Model } from 'mongoose';

export interface IVerificationCode {
  _id: mongoose.Types.ObjectId | string;
  email: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
}

const verificationCodeSchema = new Schema<IVerificationCode>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    used: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.VerificationCode) {
  delete mongoose.models.VerificationCode;
}

export const VerificationCode: Model<IVerificationCode> = mongoose.model<IVerificationCode>(
  'VerificationCode',
  verificationCodeSchema
);
