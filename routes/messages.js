const express = require("express");
const ExpressError = require("../expressError");
const User = require("../models/user");
const Message = require("../models/message");
const {SECRET_KEY} = require("../config");
const jwt = require("jsonwebtoken");


const router = new express.Router()

const db = require("../db");
const { ensureLoggedIn } = require("../middleware/auth");
const { isAsyncFunction } = require("util/types");
const { create, markRead } = require("../models/message");


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn,  async function(req, res, next){
    try{
        let username = req.user.username // req.user should be present per the middleware if the user is logged in and there should be a username as part of that payload
        let msg = await Message.get(req.params.id) // returns obj of that message with details
        
        if (msg.to_user.username !== username && msg.from_user.username !== username) { // if the the msg to_user and from_user are both not the current user then we throw an error, if either or is we can move on
            throw new ExpressError("Cannot read this message", 401);
          }
      
          return res.json({message: msg});
    }
    catch(e){
        next(e)
    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async function(req, res, next){
    try{
        let {from_username, to_username, body} = req.body;
        let newMsg = await Message.create(from_username, to_username, body)

         /** register new message -- returns
   *    {id, from_username, to_username, body, sent_at}
   */
        return res.json({message: newMsg})

    }
    catch(e){
        next(e)
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async function(req, res, next){
    try{
        let username = req.user.username // a variable to ensure for the user that is logged in
        let  msg = await Message.get(req.params.id); // calling the .get from the Message class to grab that message with the id which will give us access to the detials of that message, who its to and who its from etc
        if(msg.to_user.username !== username) {// if that message is not sent to the userlogged in we throw error
            throw new ExpressError("Cannot set this message to read", 401)
        }
        // if no error then we can mark that message as read      
        const read = await Message.markRead(req.params.id); 
        return res.json({read}) //　and return that message
        
    }
    catch(e){
        next(e)
    }
})

module.exports = router;