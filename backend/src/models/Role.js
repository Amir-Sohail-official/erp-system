import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      enum: [
        "Admin",
        "Manager",
        "Salesman",
        "Inventory Manager",
        "Purchase Officer",
        "Accountant",
      ],
    },

    description: {
      type: String,
      default: "",
    },

    permissions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Role", roleSchema);
