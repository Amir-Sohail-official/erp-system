import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    referenceType: {
      type: String,
      enum: ['SALE', 'PURCHASE', 'REFUND'],
      default: 'SALE',
      trim: true,
      index: true,
    },
    referenceId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE'],
      default: 'CASH',
    },
    paymentType: {
      type: String,
      enum: ['SALE', 'PURCHASE', 'REFUND'],
      default: 'SALE',
    },
    transactionReference: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ createdAt: -1, referenceType: 1, paymentType: 1, customer: 1, supplier: 1 });
paymentSchema.index({ referenceId: 1, referenceType: 1 });

export default mongoose.model('Payment', paymentSchema);
