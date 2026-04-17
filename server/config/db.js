import mongoose,  {connect } from 'mongoose'

export const connectDb = async() =>{
    try {
       const conn = await mongoose.connect(process.env.MONGODB_URI);  
       console.log(`connection to mognodb server is successful: ${conn.connection.host}`);
    } catch (error) {
        console.error(`connection failed with mongoose server ${error.message}`);
        process.exit(1);
    }
   
}
