//require('./middlewares/isLoggedIn')

let posts = require('../data/post')
let Twitter = require('twitter')
let then = require("express-then")
let networks = {
  twitter: {
    network: {
      icon: 'facebook',
      name: 'Facebook',
      class: 'btn-primary'
    }
  }
}

module.exports = (app) => {
  let twitterConfig = app.config.auth.twitter
  let passport = app.passport
    // Scope specifies the desired data fields from the user account
  let fbScope = 'email'
  let twitterScope = 'email'

  app.get('/', (req, res) => res.render('index.ejs'))

  app.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile.ejs', {
      user: req.user,
      message: req.flash('error')
    })
  })

  app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
  })

  app.get('/login', (req, res) => {
    res.render('login.ejs', {
      message: req.flash('error')
    })
  })

  app.get('/timeline', isLoggedIn, then(async(req, res) => {
    try {
      let twitterClient = new Twitter({
        consumer_key: twitterConfig.consumerKey,
        consumer_secret: twitterConfig.consumerSecret,
        access_token_key: req.user.twitter.token,
        access_token_secret: req.user.twitter.secret,
      })

      let [tweets] = await twitterClient.promise.get('statuses/home_timeline')
      tweets = tweets.map(tweet => {
        return {
          id: tweet.id_str,
          image: tweet.user.profile_image_url,
          text: tweet.text,
          name: tweet.user.name,
          username: '@' + tweet.user.screen_name,
          liked: tweet.favorited,
          network: networks.twitter
        }
      })
      res.render('timeline.ejs', {
        posts: tweets
      })
    } catch (e) {
      console.log("E!!!", e)
    }
  }))

  app.get('/signup', (req, res) => {
    console.log("Sign up Get...")
    res.render('signup.ejs', {
      message: req.flash('error')
    })
  })

  // Authentication route & Callback URL
  app.get('/auth/facebook', isLoggedIn, passport.authenticate('facebook', {
    fbScope
  }))

  app.get('/auth/twitter', isLoggedIn, passport.authenticate('twitter', {
    twitterScope
  }))

  app.get('/auth/facebook/callback', isLoggedIn, passport.authenticate('facebook', {
    successRedirect: '/profile',
    failureRedirect: '/profile',
    failureFlash: true
  }))

  app.get('/auth/twitter/callback', isLoggedIn, passport.authenticate('twitter', {
    successRedirect: '/profile',
    failureRedirect: '/profile',
    failureFlash: true
  }))

  // Authorization route & Callback URL
  app.get('/connect/facebook', passport.authorize('facebook', {
    fbScope
  }))

  app.get('/connect/facebook/callback', passport.authorize('facebook', {
    successRedirect: '/profile',
    failureRedirect: '/profile',
    failureFlash: true
  }))

  app.get('/connect/twitter', passport.authorize('twitter', {
    fbScope
  }))

  app.get('/connect/twitter/callback', passport.authorize('twitter', {
    successRedirect: '/profile',
    failureRedirect: '/profile',
    failureFlash: true
  }))

  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  }))

  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
  }))

  

  /*app.get('/reply/:id', isLoggedIn, then(async(req, res) => {
   //console.log("!!!!!!!!!!!!!inside reply", req)
   res.end()
  }))*/

  app.get('/share/:id', isLoggedIn, then(async(req, res) =>  {
  console.log("inside share get", req.params.id)
  let twitterClient = new Twitter({
      consumer_key: twitterConfig.consumerKey,
      consumer_secret: twitterConfig.consumerSecret,
      access_token_key: req.user.twitter.token,
      access_token_secret: req.user.twitter.secret,
    })
   let id = req.params.id
   let [tweet] = await twitterClient.promise.get('statuses/show', {id})
   let post = {}
   post['id'] = tweet.id_str
   post['image'] = tweet.user.profile_image_url
   post['text'] = tweet.text
   post['username'] = tweet.user.name
   console.log(post)
   res.render('share.ejs', {
        post: post
      })
  }))

  app.post('/share/:id', isLoggedIn, then(async(req, res) => {
    console.log("inside share post", req.params.id)
    try{
    let status = req.body.share
    let twitterClient = new Twitter({
      consumer_key: twitterConfig.consumerKey,
      consumer_secret: twitterConfig.consumerSecret,
      access_token_key: req.user.twitter.token,
      access_token_secret: req.user.twitter.secret,
    })
    if (!status) {
      return req.flash('error', 'Please enter share message!')
    }

    await twitterClient.promise.post('statuses/retweet', {
      id: req.params.id,
      status: status
    })
    } catch(e) {console.log(e)}
    res.redirect('/timeline')
  }))

  app.post('/unlike/:id', isLoggedIn, then(async(req, res) => {
    let twitterClient = new Twitter({
      consumer_key: twitterConfig.consumerKey,
      consumer_secret: twitterConfig.consumerSecret,
      access_token_key: req.user.twitter.token,
      access_token_secret: req.user.twitter.secret,
    })
    let id = req.params.id
    await twitterClient.promise.post('favorites/destroy', {id})
    res.end()
   }))


  app.get('/reply/:id', isLoggedIn, then(async(req, res) => {
     //console.log("inside reply get", req.params.id)
     let id = req.params.id
     let twitterClient = new Twitter({
      consumer_key: twitterConfig.consumerKey,
      consumer_secret: twitterConfig.consumerSecret,
      access_token_key: req.user.twitter.token,
      access_token_secret: req.user.twitter.secret,
    })
   let [tweet] = await twitterClient.promise.get('statuses/show', {id})
   let post = {}
   post['id'] = tweet.id_str
   post['image'] = tweet.user.profile_image_url
   post['text'] = tweet.text
   post['username'] = tweet.user.name
   //console.log(post)
   res.render('reply.ejs', {
        post: post
      })
  }))

  app.post('/reply/:id', isLoggedIn, then(async(req, res) => {
     console.log("POST,", req.body)
     let username= ''
     let id = req.params.id
    let status = req.body.reply
    let twitterClient = new Twitter({
      consumer_key: twitterConfig.consumerKey,
      consumer_secret: twitterConfig.consumerSecret,
      access_token_key: req.user.twitter.token,
      access_token_secret: req.user.twitter.secret,
    })
    let [tweet] = await twitterClient.promise.get('statuses/show', {id})
    await twitterClient.promise.post('statuses/update', {
      in_reply_to_status_id: id,
      status: '@' + tweet.user.screen_name + " " + status
    })
    res.redirect('/timeline')
  }))

  app.get('/compose', isLoggedIn, (req, res) => {
    message: req.flash('error')
    res.render('compose.ejs')
  })

  app.post('/compose', isLoggedIn, then(async(req, res) => {
     console.log("inside compose", status)
    let status = req.body.text
    let twitterClient = new Twitter({
      consumer_key: twitterConfig.consumerKey,
      consumer_secret: twitterConfig.consumerSecret,
      access_token_key: req.user.twitter.token,
      access_token_secret: req.user.twitter.secret,
    })
    console.log("Status", status)
    if (status.length > 140) {
      return req.flash('error', 'Status is over 140 characters!')
    }

    if (!status) {
      return req.flash('error', 'Please enter status!')
    }

    await twitterClient.promise.post('statuses/update', {
    status
    })
    res.redirect('/timeline')
  }))
}

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next()
  res.redirect('/login')
}