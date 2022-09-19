const express = require('express');
const bcryptjs = require('bcryptjs');
const router = express.Router();
const {asyncHandler, authorizeUser} = require('../middleware');
const { User } = require('../models');


// GET route to return  all properties and values for the currently authenticated 
// user along with a 200 HTTP status code.
router.get('/', authorizeUser, asyncHandler(async(req, res)=>{
    const {password, ...user} = req.currentUser
    res.json(user);
}));

// POST route to create new users
router.post('/', asyncHandler(async(req, res, next)=>{
    let newUser = req.body; // sets new user from body of post request
    try{
        //checks if post request came with a password
        if(newUser.password){
            newUser.password = bcryptjs.hashSync(newUser.password);
        } 
        newUser = await User.create(newUser);
        res.location('/');
        res.status(201).end();
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            let errorList = [];
            error.errors.map(err =>{errorList.push(err.message)})
            res.status(400).json({error: errorList});
            } else {
            next(error);
            }
    }
    
}));

module.exports = router;




