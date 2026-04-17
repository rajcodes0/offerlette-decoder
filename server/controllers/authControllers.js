import User from "../models/user.js";
import { generateToken } from "../utils/jwt.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "user already exists with email",
      });
    }
    const newUser = new User({
      name,
      email,
      password,
    });
    await newUser.save();

    // send success response

    res.status(201).json({
      success: true,
      message: "user registerd successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
if(error.name === "validationError"){
    const errors = Object.values(error.errors).map(err =>err.message);
    return res.status(400).json({
        success:false,
        errors:errors
    });
}
res.status(500).json({
    success:false,
    message:"server error",
    error:error.message
})
  }
};

export const loginUser = async(req,res)=>{
  try {
    const {email,password} = req.body;
  if (!email || !password) {
      return res.status(400).json({message:'please provide email and pasword'})
    }

    const user = await User.findOne({email});
    if(!user){
      return res.status(401).json({message:'Invalid email and password '})
    }

    const isMatch = await user.comparePassword(password)
    if(!isMatch){
      return res.status(401).json({message:"inavalid email or password "})
    }

    const token  = generateToken(user._id);

  res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.log('login failed',error)
    res.status(500).json({message:'server error'})
  }
}

