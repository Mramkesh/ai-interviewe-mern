import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    messages: [{ role: { type: String, enum: ['user', 'ai'] }, text: String, time: { type: Date, default: Date.now }, _id: false }],
  },
  { timestamps: true }
);

export default mongoose.model('Chat', chatSchema);
