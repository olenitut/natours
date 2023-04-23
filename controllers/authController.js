const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../model/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const Email = require("../utils/email");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const url = `${req.protocol}://${req.get("host")}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  const token = signToken(newUser._id);
  res.cookie("jwt", token, {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    secure: true,
    httpOnly: true,
  });

  res.status(201).json({
    status: "success",
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(new AppError("Please, provide an email and a password", 400));
    return;
  }

  const user = await User.findOne({ email }).select("+password"); // need to explicitly select because it is set to not select in the schema

  if (!user || !(await user.correctPassword(password, user.password))) {
    next(new AppError("Incorrect email or password", 401)); //unauthorized
    return;
  }

  const token = signToken(user._id);
  res.cookie("jwt", token, {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    secure: true,
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let userToken;
  //check if token exists
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    userToken = req.headers.authorization.split(" ")[1];
  }

  if (req.cookies.jwt) {
    userToken = req.cookies.jwt;
  }

  if (!userToken) {
    next(new AppError("Please, log in to access this route", 401));
    return;
  }

  //check if token is valid

  const decoded = await promisify(jwt.verify)(
    userToken,
    process.env.JWT_SECRET
  );

  //check if user still exists

  const user = await User.findById(decoded.id).select("+password");

  if (!user) {
    next(new AppError("No user found. Please log in again", 401));
    return;
  }

  //check if password has been changed after token was issued
  if (user.changedPasswordAfter(decoded.iat)) {
    next(new AppError("Password has been changed, log in again", 401));
    return;
  }

  req.user = user;
  res.locals.user = user;

  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (!req.cookies.jwt) {
    next();
    return;
  }
  try {
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );
    const user = await User.findById(decoded.id).select("+password");

    if (!user) {
      next();
      return;
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      next();
      return;
    }

    res.locals.user = user;
    req.user = user;

    next();
  } catch (err) {
    next();
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      next(new AppError("You have no access to this action", 403)); //forbidden
      return;
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    next(new AppError("No user with this email", 404));
    return;
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //to save the reset token without setting the email

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a patch request with your new password and password confirm to: ${resetURL}`;
  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: "Your password reset token (valid for 10 minutes)",
    //   message,
    // });

    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    next(
      new AppError(
        "There has been an error resetting the password. Try again",
        500
      )
    );
    return;
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const needed = await User.findOne({ email: req.user.email });
  console.log(needed);
  const token = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    next(
      new AppError("The token is wrong or has expired. Please try again", 400)
    );
    return;
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;

  await user.save();

  const loginToken = signToken(user._id);
  res.cookie("jwt", loginToken, {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    secure: true,
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
    loginToken,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const { currentPassword, newPassword, passwordConfirm } = req.body;
  const correctPass = await user.correctPassword(
    currentPassword,
    user.password
  );

  if (!correctPass) {
    next(new AppError("The password is incorrect, try again", 401));
    return;
  }

  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  user.passwordConfirm = passwordConfirm;
  await user.save();
  const loginToken = signToken(user._id);
  res.cookie("jwt", loginToken, {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    secure: true,
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
    token: loginToken,
  });
});

exports.logout = (req, res) => {
  res.cookie("jwt", "logged out", {
    expires: new Date(Date.now() + 10000),
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
  });
};
