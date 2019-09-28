const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('Email is invalid.!');
            }
        }
    },
    password: {
        type: String,
        minlength: 7,
        required: true,
        trim: true,
        validate(value) {
            if(value.includes('password')){
                throw new Error('password can not be set as "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0) {
                throw new Error('Age can not be negative...');
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
},{
    timestamps: true
})

// Establishing task data in user document ie, how many task a user is having 

userSchema.virtual('task', {
    ref: 'Task',
    localField: '_id', // field where the local data is stored here ID of the user 
    foreignField: 'owner' //field on the other thing here task
})

// Removing password and tokens array from user response to while sending back to user

userSchema.methods.toJSON = function () { // toJSON returns the containing with modification if done like here deleting some property is done
    const user = this;
    const userObject = user.toObject();  // returns raw object of the same. It is mongoose object

    delete userObject.password; // excluding password
    delete userObject.tokens;  // excluding tokens array
    delete userObject.avatar

    return userObject;
}

// object method (non static method) for generating authentication token

userSchema.methods.generateAuthToken = async function (next) {
    const user = this;
    const token = await jwt.sign({ _id: user._id.toString() }, process.env.JWT_PRIVATE_KEY , { expiresIn: '7 days' });
    
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
}

//static method (Model method) for login authentication

userSchema.statics.findByCredentials = async (email, password) => {

    //finding user by his email and checking its credential if valid or not
    const user = await User.findOne({ email });
    //console.log(user)
    if(!user) throw new Error('Unable to login!..');

    //Now checking password validity
    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch) throw new Error('Unable to login!..');

    return user;

}

//Hashing plain password to hash password before saving

userSchema.pre('save', async function (next) {
    const user = this;

    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
})

//remove all user's tasks when user gets removed/deleted

userSchema.pre('remove', async function (next) {
    const user = this;

    await Task.deleteMany({ owner: user._id })
    
})

const User = mongoose.model('User', userSchema);

module.exports = User