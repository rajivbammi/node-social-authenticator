let passport = require('passport')
let FacebookStrategy = require('passport-facebook')
let TwitterStrategy = require('passport-twitter')
let LocalStrategy = require('passport-local').Strategy
let nodeifyit = require('nodeifyit')
let User = require("../models/user")
let crypto = require('crypto')
let SALT = 'CodePathHeartNodeJS'
let config = require('../../config/auth')

require('songbird')

passport.serializeUser(nodeifyit(async(user) => user.email))
passport.deserializeUser(nodeifyit(async(email) => {
  return await User.findOne({
    email
  }).exec()
}))

passport.use('local-login', new LocalStrategy({
  // Use "email" field instead of "username"
  usernameField: 'email',
  // We'll need this later
  failureFlash: true
}, nodeifyit(async(email, password) => {
  let user
  if (email.indexOf('@') != -1) {
    //let email = email.toLowerCase()
    user = await User.promise.findOne({
      email
    })
  } else {
    return [false, {
      message: 'Invalid Email'
    }]
  }
  if (!user) {
    return [false, {
      message: 'Invalid user email'
    }]
  }

  if (!await user.validatePassword(password)) {
    return [false, {
      message: 'Invalid password'
    }]
  }

  return user
}, {
  spread: true
})))

passport.use('local-signup', new LocalStrategy({
  // Use "email" field instead of "username"
  usernameField: 'email',
  failureFlash: true,
  passReqToCallback: true
}, nodeifyit(async(req, email, password) => {
  console.log("inside local signup")
  email = (email || '').toLowerCase()
    // Is the email taken?
  if (await User.promise.findOne({
      email
    })) {
    return [false, {
      message: 'That email is already taken.'
    }]
  }

  // create the user
  let user = new User()
  user.email = email
    //user.username = username
    // Use a password hash instead of plain-text
  user.password = (await crypto.promise.pbkdf2(password, SALT, 4096, 512, 'sha256')).toString('hex')
  user.password = password
  try {
    console.log("Saving user...", user.email, user.password)
    return await user.save()
  } catch (e) {
    return [false, {
      message: e + "####"
    }]
  }
  console.log("outside local signup")
}, {
  spread: true
})))


useExternalPassportStrategy(FacebookStrategy, {
  clientID: config.facebook.consumerKey,
  clientSecret: config.facebook.consumerSecret,
  callbackURL: config.facebook.callbackUrl
}, 'facebook')

useExternalPassportStrategy(TwitterStrategy, {
  consumerKey: config.twitter.consumerKey,
  consumerSecret: config.twitter.consumerSecret,
  callbackURL: config.twitter.callbackUrl,
  passReqToCallback: true
}, 'twitter')

function useExternalPassportStrategy(OauthStrategy, config, field) {
  //console.log("Inside useExternalPassportStrategy")

  config.passReqToCallback = true
  passport.use(new OauthStrategy(config,
    nodeifyit(authCB, {
      spread: true
    })))

  async function authCB(req, token, _ignored_, account) {
    let email = req.user.email
    let password = req.user.password
    let user = await User.promise.findOne({
      email
    })
    if (!user) {
      return [false, {
        message: 'Oops! No user found. Please login'
      }]
    }
    if (user[field].id || user[field].token) {
      return [false, {
        message: 'Record already exists. Showing profile.'
      }]
    }
    user[field].id = account.id
    user[field].token = token
    user[field].secret = _ignored_
    user[field].email = email
    user[field].name = account.displayName

    try {
      console.log("Saving user...", user.email, user.password)
      return await user.save()
    } catch (e) {
      return [false, {
        message: e + "####"
      }]
    }
  }
}

function configure(config) {
  // Required for session support / persistent login sessions
  passport.serializeUser(nodeifyit(async(user) => {
    throw new Erro('Not implemented.')
  }))

  passport.deserializeUser(nodeifyit(async(user) => {
    throw new Erro('Not implemented.')
  }))

  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'linkedin')
  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'facebook')
  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'google')
  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'twitter')
  // passport.use('local-login', new LocalStrategy({...}, (req, email, password, callback) => {...}))
  // passport.use('local-signup', new LocalStrategy({...}, (req, email, password, callback) => {...}))
  return passport
}

module.exports = {
  passport, configure
}