const mongoose = require("mongoose");

const bookingsSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: "Tour",
    required: [true, "Booking must belong to a tour!"],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Booking must belong to a user!"],
  },
  price: {
    type: Number,
    required: [true, "Booking must have a price"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paind: {
    type: Boolean,
    default: true,
  },
});

bookingsSchema.pre(/^find/, function (next) {
  this.populate("user");
  this.populate("tour");
  next();
});

const Bookign = mongoose.model("Booking", bookingsSchema);

module.exports = Bookign;
