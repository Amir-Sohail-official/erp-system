import mongoose from 'mongoose';

export const connectDatabase = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI or MONGODB_URI environment variable is not defined.');
  }

  const isLocalMongoUri = mongoUri.startsWith('mongodb://');
  const normalizedMongoUri = isLocalMongoUri && !mongoUri.includes('replicaSet=') && !mongoUri.includes('directConnection=')
    ? `${mongoUri}${mongoUri.includes('?') ? '&' : '?'}replicaSet=rs0`
    : mongoUri;

  try {
    await mongoose.connect(normalizedMongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.error('MongoDB connection failed:', message);
    throw new Error(`Unable to connect to MongoDB: ${message}`);
  }
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
};
