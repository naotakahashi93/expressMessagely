const express = require("express");
const ExpressError = require("../expressError");
const User = require("../models/user");
const Message = require("../models/message");
const {SECRET_KEY} = require("../config");
const jwt = require("jsonwebtoken");


const router = new express.Router()

const db = require("../db");



/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get("/", async function(req, res, next){
    try{

        const all = await User.all()
        return res.json({users: all})

    }
    catch(e){
        next(e)
    }
})

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get("/:username", async function(req, res, next){
    try{
        const userDetail = await User.get(req.params.username)
        return res.json({user: userDetail})

    }
    catch(e){
        next(e)
    }
})

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/


router.get("/:username/to", async function(req, res, next){
    try{
        const toUser = await User.messagesTo(req.params.username)
        return res.json({messages: toUser})

    }
    catch(e){
        next(e)
    }
})


/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get("/:username/from", async function(req, res, next){
    try{
        const fromUser = await User.messagesFrom(req.params.username)
        return res.json({user: fromUser})

    }
    catch(e){
        next(e)
    }
})


module.exports = router;