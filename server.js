const express = require("express");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const engine = require("ejs-locals");
const session = require("express-session");
const flash = require("express-flash");
const Jwt = require("jsonwebtoken");
const cookie = require("cookie");
const cookieParser = require('cookie-parser')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({secret: "dasdasdasdasdasd", resave: false, saveUninitialized: false, cookie: { maxAge: 60000 }}))
app.use(flash())
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser())

app.engine('ejs', engine)
app.set('views', './views')
app.set("view engine", "ejs")

app.get("/hello", (req, res) => {
    res.render("hello")
})

var arrayOfNums = []
app.route("/sortnum")
    .get((req, res) => {
        res.render("sortnum", {inputedNum: "", warning: "", sortedArray: arrayOfNums})    
    })
    .post((req, res) => {
        if (isNaN(Number(req.body.inputedNum))) {
            res.render("sortnum", {inputedNum: req.body.inputedNum, sortedArray: arrayOfNums, warning: "Please enter a valid value"}) 
        } else {
            arrayOfNums.push(Number(req.body.inputedNum))
            for (let i = 0; i < arrayOfNums.length; i++) {
                for (let j = 0; j < (arrayOfNums.length - 1); j++) {
                    var firstNum = arrayOfNums[j]
                    var secondNum = arrayOfNums[(j + 1)]
                    if (firstNum > secondNum) {
                        let tempNum = secondNum
                        secondNum = firstNum 
                        firstNum = tempNum 
                        arrayOfNums[j] = firstNum
                        arrayOfNums[(j + 1)] = secondNum
                    }
                }
            }
            res.render("sortnum", {inputedNum: req.body.inputedNum, warning: "", sortedArray: arrayOfNums})  
        }

    })

const users = [{username: "admin", password: "Admin&8181"}]

passport.use(new LocalStrategy(
    function(username, password, done) {
        try {
            const user = users.find(i => i.username === username)
            console.log(user)
            if (user === undefined) { 
                console.log("Invalid User")
                return done(null, false, {message: "Invalid User"}); 
            }
            if (user.password != password) { 
                console.log("Incorrect Password")
                return done(null, false, {message: "Incorrect Password"}); 
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
  ));

passport.serializeUser(function(user, done) {
  done(null, user.username);
});

passport.deserializeUser(function(username, done) {
    try {
        const user = users.find(user => user.username = username)
        done(null, user);
    } catch (err) {
        done(err)
    }
});

app.route("/login")
    .get((req, res) => {
        res.render("login")
    })
    .post(
        passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), 
        (req, res) => {
            const claims = { sub: req.body.username};            
            const jwt = Jwt.sign(claims, "asfasfasfasfasfasfasf", { expiresIn: '1h' });
            res.setHeader('Set-Cookie', cookie.serialize('auth', jwt, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development',
                sameSite: 'strict',
                maxAge: 3600,
                path: '/'
            }))            
            res.redirect("/welcome");
        }
    )

app.get("/welcome", (req, res) => {
    Jwt.verify(req.cookies.auth, "asfasfasfasfasfasfasf", async function (err, decoded) {
        if (!err && decoded) {
            console.log("authenticated by the authentication check function")
            console.log(req.cookies.auth)
            res.render("welcome", {accessToken: req.cookies.auth})
          } else {
            res.redirect("/login")
          }
        }) 
})    
app.listen(3000)