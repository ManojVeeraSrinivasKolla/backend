const User = require("../models/user");
const EmailToken = require("../models/emailToken");
const ResetPassword = require("../models/resetPassword");
const { isValidObjectId } = require("mongoose");
const { generateOTP, generateMailTransporter } = require("../utils/mail");
const { generateRandomBytes } = require("../utils/helper");
require("regenerator-runtime/runtime");

const crypto = require("crypto");
const jwt = require("jsonwebtoken");

//Create USER @POST
const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(409).json({ error: "User email already exists" }); // Conflicting emaill
    }

    const newUser = new User({
      name,
      email,
      password, // Storing plain text password
    });

    // Save the user to the database
    await newUser.save();

    // Return success response
    return res.status(201).json({
      data: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        isVerified: true, // Assuming the user is not verified yet
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" }); // Avoid sending raw error
  }
};


//Verify USER EMAIL @POST
const verifyEmail = async (req, res) => {
   const { userId, OTP } = req.body;

   // checking if user exists in DB
   if (!isValidObjectId(userId))
      // isValidObjectId() is mongoose method
      return res.status(404).json({ error: "Invalid User / User Not Found" });

   // find the user using the userId
   const currentUser = await User.findById(userId);
   if (!currentUser) return res.status(404).json({ error: "Invalid User / User Not Found" });
   if (currentUser.isVerified) return res.status(409).json({ error: "User is already Verified" });

   // getting the hashed OTP from the DB
   const token = await EmailToken.findOne({ owner: userId });
   if (!token) return res.status(404).json({ error: "Invalid Token / Token Not Found" });

   // checking whether the OTP is valid
   const isMatched = await token.compareToken(OTP); // custom compareToken() method
   if (!isMatched) return res.status(400).json({ error: "invalid OTP" });

   // if OTP is correct then update DB isVerified value to true and save
   currentUser.isVerified = true;
   await currentUser.save();

   // after successful verification , delete the OTP/token from Database
   await EmailToken.findByIdAndDelete(token._id);
   var transport = generateMailTransporter(); // nodemailer.transport

   await transport.sendMail({
      from: "emailVerification@movieRRReview.com", // sender address
      to: currentUser.email, // list of receivers
      subject: "Welcome Email ✔", // Subject line
      html: `<h1>Welcome to our App and thanks for choosing us</h1>`, // html body
   });
   // generating JWT token
   const jwtToken = jwt.sign({ userId: currentUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
   });
   return res.status(200).json({
      data: {
         id: currentUser._id,
         name: currentUser.name,
         email: currentUser.email,
         token: jwtToken,
         isVerified: currentUser.isVerified,
         role: currentUser.role,
      },
      msg: "Email Verification Successful",
   });
};

//RESEND USER EMAIL_OTP @POST
const resendOTP = async (req, res) => {
   const { userId } = req.body;

   // find the user details from our DB
   const currentUser = await User.findById(userId);
   if (!currentUser) return res.status(404).json({ error: "Invalid User / User Not Found" });
   if (currentUser.isVerified)
      return res.status(409).json({ error: "This User is already Verified" });

   // if token already exist
   const existingToken = await EmailToken.findOne({ owner: userId });
   if (existingToken)
      return res.status(409).json({ error: "next Token request available after 1 hour" });

   // if token not found
   let OTP = generateOTP(6); // 6 digit OTP
   // Store OTP inside DB
   const newEmailToken = EmailToken({
      owner: currentUser._id,
      token: OTP,
   });
   await newEmailToken.save();
   // send OTP to user Email
   var transport = generateMailTransporter(); // nodemailer.transporter

   const info = await transport.sendMail({
      from: "emailVerification@movieRRReview.com", // sender address
      to: currentUser.email, // list of receivers
      subject: "Email Verification ✔", // Subject line
      html: `<p>Your Email Verification OTP : </p>
            <h1>${OTP}</h1>
      `, // html body
   });
   return res.status(201).json({
      msg: "OTP has been sent to your registered Email Address,Please Verify your email. ",
   });
};

// FORGET PASSWORD @POST
const forgotPassword = async (req, res) => {
   const { email } = req.body;
   if (!email) return res.status(403).json({ error: "Email not Provided" });

   // checking if user exists in DB
   const user = await User.findOne({ email: email });
   if (!user) return res.status(404).json({ error: "User Email not found" });

   // checking if reset password token is already present in DB
   const existingToken = await ResetPassword.findOne({ owner: user._id });
   if (existingToken)
      return res.status(409).json({ error: "next Token request available after 1 hour" });

   // reset pass token needs to be unique for each user hence, generate random bytes
   // generating Token (Generates cryptographically strong pseudorandom data.)
   const token = await generateRandomBytes();

   // creating new instance of this token inside our DB
   const newPasswordResetToken = await ResetPassword({ owner: user._id, token: token });
   await newPasswordResetToken.save();

   // password reset URL
   //! change later
   const resetPasswordURL = `http://localhost:5173/auth/reset-password?token=${token}&id=${user._id}`;

   // send URL to user Email
   var transport = generateMailTransporter(); // nodemailer.transporter
   await transport.sendMail({
      from: "security@movieRRReview.com", // sender address
      to: user.email, // list of receivers
      subject: "Password Reset Link ✔", // Subject line
      html: `<p>Your Password Link is : </p>
            <a href=${resetPasswordURL}>Click Here</a>
            <p> Valid only for next 1 hour</p>
      `, // html body
   });

   return res.status(201).json({
      msg: "Rest Password Link has been sent to your registered Email Address. ",
   });
};

// VERIFYING RESET PASSWORD TOKEN @POST
const resetPasswordTokenStatus = async (req, res) => {
   return res.status(200).json({ valid: true });
};

// CHANGE PASSWORD @POST
const resetPassword = async (req, res) => {
   const { newPassword, userId } = req.body;

   const user = await User.findById(userId);

   // checking if oldPass !== newPass
   const isMatched = await user.comparePassword(newPassword);
   if (isMatched) {
      return res
         .status(409)
         .json({ error: "New Password cannot be same as Old one. Try something else" });
   }

   // assigning new password
   user.password = newPassword;
   await user.save();

   //remove reset-password-token from DB
   await ResetPassword.findByIdAndDelete(req.resetToken._id);

   // send password change success message to user Email
   var transport = generateMailTransporter(); // nodemailer.transporter

   await transport.sendMail({
      from: "security@movieRRReview.com", // sender address
      to: user.email, // list of receivers
      subject: "Password Changed successfully ✔", // Subject line
      html: `<p>Now you can sign in with new password ✔</p>
     `, // html body
   });

   return res.status(200).json({ msg: "Password changed successfully" });
};

// SIGN IN
const signIn = async (req, res) => {
   const { email, password } = req.body;
   try {
      // checking if user email exists
      const user = await User.findOne({ email: email });
      if (!user) res.status(404).json({ error: `User with email: ${email} not found` });

      // check if password is correct
      const isMatched = await user.comparePassword(password);
      if (!isMatched) res.status(404).json({ error: `Incorrect Password` });

      // generating JWT token
      const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      // console.log(user.email,user.password)
      return res.status(200).json({
         data: {
            id: user._id,
            name: user.name,
            email: user.email,
            token: jwtToken,
            isVerified: true,
            role: user.role,
         },
      });
   } catch (error) {
      return res.status(500).status({ error: error });
   }
};

module.exports = {
   createUser,
   verifyEmail,
   resendOTP,
   forgotPassword,
   resetPasswordTokenStatus,
   resetPassword,
   signIn,
};
