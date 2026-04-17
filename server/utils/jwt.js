import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();


console.log('JWT_SECRET from env:', process.env.JWT_SECRET ? '✅ exists' : '❌ MISSING');
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = '7d';

export const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

export const verifytoken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.log(error);
        return null;
    }
};