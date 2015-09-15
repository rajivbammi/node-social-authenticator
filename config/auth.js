// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {
    'facebook' : {
        'consumerKey': '',
        'consumerSecret': '',
        'callbackUrl': 'http://socialauthenticator.com:8000/auth/facebook/callback'
    },
    'twitter' : {
        'consumerKey': '',
        'consumerSecret': '',
        'callbackUrl': 'http://socialauthenticator.com:8000/auth/twitter/callback'
    }
}