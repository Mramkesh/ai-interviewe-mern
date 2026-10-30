import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 40 },
    lastName: { type: String, trim: true, maxlength: 40, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, trim: true, maxlength: 80, default: 'Software Engineer' },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    lastLogin: Date,
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
