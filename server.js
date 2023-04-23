const mongoose = require("mongoose");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
  console.log(err.message);
  process.exit(1);
});

const app = require("./app");

mongoose
  .connect(process.env.DATABASE)
  .then(() => console.log("db connection successful"));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log("App running...");
});

process.on("unhandledRejection", (err) => {
  console.log(err.message);

  server.close(() => {
    process.exit(1);
  });
});
