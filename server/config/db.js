import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing — .env / Render environment variables check karo');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ MongoDB connected:', mongoose.connection.host);
}
