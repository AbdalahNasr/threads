import mongoose from "mongoose";

const communitySchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true 
  },
  clerkId: {
    type: String,
    sparse: true,  // Allows null/undefined values and creates a unique index
    index: true,   // Index for faster queries
  },
  name: { 
    type: String, 
    required: true 
  },
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  image: String,
  bio: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  threads: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread"
    }
  ],
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  isPrivate: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a username from the community name before saving
communitySchema.pre("save", function (next) {
  if (this.isModified("name") && !this.username) {
    this.username = this.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  }
  
  if (this.isModified()) {
    this.updatedAt = new Date();
  }
  
  next();
});

const Community = mongoose.models.Community || mongoose.model("Community", communitySchema);

export default Community;
