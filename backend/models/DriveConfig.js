import mongoose from 'mongoose';

const driveConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'primary',
      unique: true,
    },
    accessToken: {
      type: String,
      default: '',
    },
    refreshToken: {
      type: String,
      default: '',
    },
    expiryDate: {
      type: Number,
      default: 0,
    },
    scope: {
      type: String,
      default: '',
    },
    connectedEmail: {
      type: String,
      default: '',
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const DriveConfig = mongoose.model('DriveConfig', driveConfigSchema);
export default DriveConfig;
