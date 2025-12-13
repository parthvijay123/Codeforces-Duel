import mongoose from 'mongoose';
 
const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
}
 
// Declare global type for caching
declare global { 
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}
 
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };
 
if (!cached) {
  cached = { conn: null, promise: null };
  global.mongoose = cached;
}
 
async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }
 
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
 
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }
 
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
 
  return cached.conn;
}
 
export default dbConnect;
