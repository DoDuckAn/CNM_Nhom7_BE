const express=require('express')
require('dotenv').config()
const cors=require('cors')
const connectDB = require('./database/connect')
const userRoutes=require('./routes/userRoutes')
const messageTypeRoutes=require('./routes/messageTypeRoutes')
const messageRoutes=require('./routes/messageRoutes')

const app=express()

app.use(cors())
app.use(express.json())

app.use('/api/user',userRoutes)
app.use('/api/messageType',messageTypeRoutes)
app.use('/api/message',messageRoutes)

connectDB();

const PORT=process.env.PORT||5000
app.listen(PORT,()=>console.log(`Server run on port ${PORT}`))