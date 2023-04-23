const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const fs = require("fs");
const Tour = require("../../model/tourModel");
const Review = require("../../model/reviewModel");
const User = require("../../model/userModel");

mongoose
  .connect(process.env.DATABASE)
  .then(() => console.log("db coddection successful"));

const tours = fs.readFileSync(`${__dirname}/tours.json`, "utf-8");
const users = fs.readFileSync(`${__dirname}/users.json`, "utf-8");
const reviews = fs.readFileSync(`${__dirname}/reviews.json`, "utf-8");
// console.log(tours);

const importData = async () => {
  try {
    // await Review.create(JSON.parse(reviews));

    await User.create(JSON.parse(users), { validateBeforeSave: false });
  } catch (err) {
    console.log(err);
  }
};

const deleteAll = async () => {
  await Tour.deleteMany();
  await User.deleteMany();
  await Review.deleteMany();
};

importData();
