import jwt from "jsonwebtoken";
import User from '../models/user.js'
import { verifytoken } from "../utils/jwt.js";


export const authProtect = async (req,res,next) =>{
   console.log('Authorization header:', req.headers.authorization);
  
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // removes 'Bearer ' (7 chars)
    console.log('✅ Token extracted (length):', token.length);
  } else {
    console.log('❌ Header missing or invalid format');
  }
    if(!token){
        return res.status(401).json({
            message:"token not found"
        })
    }

    const decoded = verifytoken(token);
    if(!decoded){
        return res.status(401).json({message:"Not authorized,invalid token"})
    }
const user  = await User.findById(decoded.userId).select('-password')
if(!user){
    return res.status(401).json({message:'user not found'});
}
req.user = user;
next();
}