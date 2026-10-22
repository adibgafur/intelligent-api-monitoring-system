import mongoose from 'mongoose';

const AnomalySchema = new mongoose.Schema(
  {
    apiName: {
      type: String,
      required: [true, 'API name is required'],
      trim: true,
      index: true,
    },
    types: {
      type: [String],
      required: true,
      enum: ['HIGH_RESPONSE_TIME', 'FAILED_REQUEST', 'ZERO_RECORDS', 'MISSING_DATA'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one anomaly type must be specified',
      },
    },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      index: true,
    },
    metrics: {
      responseTimeMs: { type: Number, required: true },
      statusCode: { type: Number, required: true },
      recordsReturned: { type: Number, default: null },
    },
    reasons: {
      type: [String],
      default: [],
    },
    aiMessage: {
      type: String,
      required: [true, 'Alert message is required'],
      trim: true,
    },
    aiGenerated: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['active', 'resolved'],
      default: 'active',
      index: true,
    },
    occurrences: {
      type: Number,
      default: 1,
      min: 1,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast dashboard queries and de-duplication
AnomalySchema.index({ status: 1, createdAt: -1 });
AnomalySchema.index({ apiName: 1, status: 1 });

export const Anomaly = mongoose.model('Anomaly', AnomalySchema);
