const express = require('express');
const multer = require('multer');
const sharp = require('sharp')
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')


const router = express.Router();

router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save()

        sendWelcomeEmail(user.email, user.name)

        const token = await user.generateAuthToken();

        res.status(201).send({ user, token });
    } catch (e) {
        res.status(400).send(e);
    }
    
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        
        res.send({ user, token });
    } catch (e) {
        res.status(400).send(e);
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        })

        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []

        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
})

//get profile pic

const upload = multer({
    
    limits: {
        fileSize: 1000000  // file size should be max of 1MB size
    },
    fileFilter(req, file, cb) {   //called whenever a file attempt is done ...filtering on file being uploaded
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('please upload jpg / jpeg / png image file only.'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {  //to add profile pic of user
    //req.user.avatar = req.file.buffer

    const buffer =  await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer

    await req.user.save()
    
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {  // Tp delete the profile pic of user
    req.user.avatar = undefined
    await req.user.save()
    res.send();
})

router.get('/users/:id/avatar',async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if(!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png'); // setting response header for client to get the image

        res.send(user.avatar);
                                           
        
    } catch (e) {
        res.status(404).send()
    }
    
    
})

//GET routes

router.get('/users/me', auth, async (req, res) => {  //user profile route
    res.send(req.user);
}) 

//UPDATE routes

router.patch('/users/me', auth, async (req, res) => {  // route for update 

    //Some restriction on updating options
    const updates = Object.keys(req.body); // Object.key gives all key of a object as array 
    const allowedUpdates = ['name', 'password', 'age', 'email'];
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    })

    if(!isValidOperation) {
        return res.status(400).send({ error: 'Invalid update!' })
    }

    //Now update is done 
    try {
        // const user = await User.findById(req.params.id);

        updates.forEach((update) => {
            req.user[update] = req.body[update];
        })

        //const user = await User.findByIdAndUpdate(req.params.id, req.body , { new: true, runValidators: true });

        await req.user.save();

        // if(!user) {
        //     return res.status(400).send();
        // }

        res.send(req.user);
    } catch (e) {   
        res.status(400).send(e);
    }
})

// Deleting routes for removing user

router.delete('/users/me', auth, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.params.id);

        // if(!user) return res.status(404).send();

        await req.user.remove();
        
        sendCancellationEmail(req.user.email, req.user.name)

        res.send(req.user);

    } catch (e) {
        return res.status(500).send(e);
    }
})

module.exports = router;
