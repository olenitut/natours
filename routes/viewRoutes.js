const express = require("express");
const viewController = require("../controllers/viewController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.isLoggedIn);

router.get("/", viewController.getOverview);
router.get("/tours/:slug", viewController.getTour);
router.get("/login", viewController.login);
router.get("/signup", viewController.signup);
router.get("/me", viewController.getAccount);

router.post("/submit-user-data", viewController.updateUser);
module.exports = router;
