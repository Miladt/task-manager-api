const express=require('express')
const userRouter=require('./routers/user')
const taskRouter=require('./routers/task')
require('./db/mongoose')

const port=process.env.PORT

const app=express()

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)


app.listen(port,()=>{
    console.log('Server up on port ',port)
})