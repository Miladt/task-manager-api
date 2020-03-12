const mongoose=require('mongoose')
const validator=require('validator')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const Task=require('./task')

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    age:{
        type:Number,
        trim:true,
        validate(value){
            if(value<0){
                throw new Error('Age must be positive')
            }
        }
    },
    email:{
        type:String,
        unique:true,
        trim:true,
        lowercase:true,
        required:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid!')
            }
        }
    },
    password:{
        type:String,
        trim:true,
        required:true,
        minlength:6,
        validate(value){
            if(value.includes('password')){
                throw new Error('password should not be contain /"passwoed/"  word')
            }
        }

    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }],
    avatar:{
        type:Buffer
    }
},{
    timestamps:true
})

userSchema.virtual('tasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
})

userSchema.methods.toJSON=function(){
    const user=this
    const userObject=user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

   return userObject
}


userSchema.methods.generateAuthToken=async function (){
  
    const user=this
    const token=jwt.sign({_id:user._id.toString()},process.env.JWT_SECRET)
    user.tokens= user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.statics.findByCredentials=async (email,password)=>{
    console.log('findByCredentials')
    const user=await User.findOne({email})

    if(!user){
        throw new Error('Invalid Information')
    }

    console.log('password',password,user.password)
    const isMatch =await bcrypt.compare(password.toString(),user.password)
    console.log(isMatch)

    if(!isMatch){
        throw new Error('Invalid Information')
    }
    return user
}

//hash password
userSchema.pre('save',async function(next){
    const user=this

    if(user.isModified('password')){
        user.password=await bcrypt.hash(user.password,8)
    }
    next()
})

//Remove all user tasks before delete
userSchema.pre('remove',async function(next){
    const user=this
    await Task.deleteMany({owner:user._id})
    next()
})

const User=mongoose.model('User',userSchema)



module.exports=User