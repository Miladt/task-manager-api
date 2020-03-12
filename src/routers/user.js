const express=require('express')
const User=require('../models/user')
const multer=require('multer')
const sharp=require('sharp')
const{sendWelcomeEmail}=require('../emails/account')
const router=express.Router()
const auth=require('../middleware/auth')


router.post('/users',async (req,res)=>{
    const user= new User(req.body)
    
try{
   await user.save()
   sendWelcomeEmail(user.email,user.name)
   const token= await user.generateAuthToken()
    res.status(201).send({user,token})

}catch(e){
    res.status(500).send(e)
}
})

router.post('/users/login',async(req,res)=>{
    try{
        const user = await User.findByCredentials(req.body.email,req.body.password)
       const token = await user.generateAuthToken()
        res.send({user,token})
    }catch(e){
        res.status(400).send(e)
    }
})

router.post('/users/logout',auth,async(req,res)=>{
    try{
      req.user.tokens=req.user.tokens.filter((token)=>{
            return token.token!==req.token
        })
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.post('/users/logoutAll',auth,async(req,res)=>{

    try{
        req.user.tokens=[]
        req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.get('/users/me',auth,async(req,res)=>{

    try{
       const user=await req.user
       const token=req.token
        res.send({user,token})
    }catch(e){
        res.status(500).send(e)
    }
})

router.get('/users/:id',async (req,res)=>{

    try{
        const _id=req.params.id
        const user=await User.findById(_id)
        if(!user){
            return res.status(404).send()
        }
        res.send(user)       
    }catch(e){  
        res.status(500).send(e)
    }

})

router.patch('/users/me',auth,async(req,res)=>{
    const updates=Object.keys(req.body)
    const allowedUpdates=['name','password','email','age']
    const isValidatOperation=updates.every((update)=>allowedUpdates.includes(update))

    if(!isValidatOperation){
        return res.status(400).send({error:'Invalid Updates!'})
    }

    try{
        //const user=await User.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true})

        // const user=await User.findById(req.params.id)
        //  updates.forEach((update)=> user[update]=req.body[update])
        // await user.save()

        // if(!user){
        //   return res.status(404).send()
        // }
        updates.forEach((update)=>req.user[update]=req.body[update])
        await req.user.save()
        res.send(req.user)
    }catch(e){
        res.status(400).send(e)
    }
})

router.delete('/users/me',auth,async(req,res)=>{
    try{
  
        await req.user.remove()
        res.send(req.user)
    
    }catch(e){
        res.status(500).send()
    }
})

const upload=multer({
  
    limits:{
        fileSize:1000000
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('File must be jpg or jpeg or png'))
        }
        return cb(undefined,true)
    }
})

router.post('/users/me/avatar',auth,upload.single('avatar'),async (req,res)=>{
   const buffer=await sharp(req.file.buffer)
   .resize({width:300,height:300})
   .png()
   .toBuffer()
   
    req.user.avatar=buffer
    await req.user.save()
    res.send()
},(error,req,res,next)=>{
    res.status(400).send({error:error.message})
})

router.get('/users/:id/avatar',async (req,res)=>{
    try{
        const user=await User.findById(req.params.id)

        if(!user || !user.avatar){
            res.status(404).send()
        }
        res.set('Content-Type','image/png')
        res.send(user.avatar)
    }catch(e){
        res.status(500).send()
    }
  
})

router.delete('/users/me/avatar',auth,async (req,res)=>{
    req.user.avatar=undefined
    await req.user.save()
    res.send()
})
module.exports=router