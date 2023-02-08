const express = require("express");
const ExpressError = require("../expressError");
const User = require("../models/user");
const Message = require("../models/message");
const {SECRET_KEY} = require("../config");
const jwt = require("jsonwebtoken");


const router = new express.Router()

const db = require("../db");


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post("/login", async function(req, res, next){
    try{
        const {username, password } = req.body;
        const ress = await User.authenticate(username, password) // this method will return true or false
            if(ress){ // if it returns true and user is authenticated then we want to generate token
                let token= jwt.sign({username},SECRET_KEY) // we call jwt.sign and pass in the payload (AKA username this time) and our secret key to generate token 
                User.updateLoginTimestamp(username);
                return res.json({token}) // return this so we know the use has successfully logged in
            }
            else{
                throw new ExpressError("Invalid username/password", 400)
            }

    }
    catch(e){
        next(e)
    }
})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */


router.post("/register", async function(req, res, next){
    try{
        let {username} = await User.register(req.body) // extracting "username" variable from the .register method which returns an obj with the registered users "username"
        let token = jwt.sign({username}, SECRET_KEY);
        User.updateLoginTimestamp(username)
        return res.json({token})

    }
    catch(e){
        next(e)
    }
})


module.exports = router