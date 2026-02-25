import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for OAuth users
  image: { type: String },
  googleId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const User = models.User || model('User', UserSchema);

const PersonSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: 'Unknown Person' },
  personId: { type: String, required: true },
  thumbnailUrl: { type: String }, // Base64 or GDrive link
  centroid: { type: [Number] }, // Average embedding for faster search
  createdAt: { type: Date, default: Date.now },
});

// Compound index for uniqueness per user
PersonSchema.index({ userId: 1, personId: 1 }, { unique: true });

export const Person = models.Person || model('Person', PersonSchema);

const FaceEmbeddingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  personId: { type: String, required: true },
  embedding: { type: [Number], required: true }, // Vector
  imageUrl: { type: String, required: true }, // GDrive link or IndexedDB key
  source: { type: String, enum: ['local', 'gdrive'], default: 'local' },
  createdAt: { type: Date, default: Date.now },
});

export const FaceEmbedding = models.FaceEmbedding || model('FaceEmbedding', FaceEmbeddingSchema);

const SuggestionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed', 'implemented'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export const Suggestion = models.Suggestion || model('Suggestion', SuggestionSchema);

const ContactSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Contact = models.Contact || model('Contact', ContactSchema);

const SubscriptionSchema = new Schema({
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export const Subscription = models.Subscription || model('Subscription', SubscriptionSchema);
