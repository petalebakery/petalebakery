// models/PreorderSlot.js
import mongoose from "mongoose";

const PreorderSlotSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },   // 'YYYY-MM-DD'
    window: { type: String, required: true }, // 'HH:mm-HH:mm'
    capacity: { type: Number, required: true },
    reserved: { type: Number, default: 0 },
    isBlackout: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PreorderSlotSchema.index({ date: 1, window: 1 }, { unique: true });

export default mongoose.model("PreorderSlot", PreorderSlotSchema);
