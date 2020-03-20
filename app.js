// -------------------------------------------------- start -------------------------------------------------- //


const express = require('express');
const ejs = require('ejs');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const crypto = require('crypto');
const MongoStore = require('connect-mongo')(session);
const upload = require('express-fileupload');
const fs = require('fs').promises;
const dotenv = require('dotenv');
const jwt = require('jwt-simple');
const nodemailer = require('nodemailer');



// -------------------------------------------------- server settings -------------------------------------------------- //


const app = express();
dotenv.config();
mongoose.connect(process.env.CONN, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        touchAfter: 3600
    })
}));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static('public/index'));
app.use(express.static('public/log-in'));
app.use(express.static('public/profile'));
app.use(express.static('public/search'));
app.use(express.static('public/settings'));
app.use(express.static('public/sign-up'));
app.use(express.static('public/upload'));
app.use(express.static('public/view-profile'));
app.use(bodyParser.urlencoded({
    extended: true
}));
const userDetail = new mongoose.Schema({
    fullName: String,
    userName: String,
    email: String,
    password: String,
    profilePic: String,
    list: Array,
    followers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    }],
    following: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    }]
});
const detail = mongoose.model('user', userDetail);
app.use(upload());
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_EMAIL,
        pass: process.env.MAIL_PASS
    }
});


// -------------------------------------------------- root route -------------------------------------------------- //


app.get('/', (req, res) => {
    if (!req.session.uid) {
        res.render('index');
    } else {
        detail.findById(req.session.uid, (err, user) => {
            res.render('profile', {
                details: user
            });
        });
    }
});

/*------------------Search Anime--------------------*/

app.get("/searchanime", function (req, res) {
    res.render("searchanim");
});

app.post("/add", function (req, res) {
    if (!req.session.uid)
        return res.redirect("/loginP");
    detail.findOne({
        _id: req.session.uid
    }, async function (err, data) {
        if (!err) {
            var flag = 0,
                index_i, index_j;
            for (i in data.list) {
                if (req.body.listvalue == data.list[i].listname) {
                    index_i = i;
                    console.log(index_i);
                    console.log("aa gaya");
                    for (j in data.list[i].lists) {
                        if (req.body.id == data.list[i].lists[j].id) {
                            index_j = j;
                            flag = 1;
                            //console.log("index_i,index_j");
                            break;
                        }
                    }
                    break;
                }

            }
            console.log(flag);
            if (flag) {
                //http://api.jikan.moe/v3/anime/1535
            } else {
                data.list[index_i].lists.push({
                    id: req.body.id,
                    image_url: req.body.img,
                    title: req.body.title
                });
                //console.log(data.list[index_i].lists);

                await detail.updateOne({
                    _id: req.session.uid
                }, data);
                /*await detail.findOne({_id:req.session.uid},function(err,d){
                    console.log(data.list[0].lists);
                });*/
            }
        } else {
            res.send(err);
        }
        res.send("correct")
    })
});

app.get("/showlist", function (req, res) {
    detail.findOne({
        _id: req.session.uid
    }, function (err, data) {
        res.render("list", {
            listx: data.list
        });
    });
});

app.get("/getlist", function (req, res) {
    detail.findOne({
        _id: req.session.uid
    }, function (err, data) {
        res.send({
            listx: data.list
        });
    });
});

/*-------------------------delete list-----------------------------*/

app.get("/deletelist", function (req, res) {
    res.render("deleteList");
});

app.post("/del", async function (req, res) {
    console.log(req.body);
    for (i in req.body) {
        await detail.update({
            _id: req.session.uid
        }, {
            $pull: {
                list: {
                    listname: i
                }
            }
        });
    }
    res.redirect("/deletelist");
});


/*-------------------------Edit list-------------------------------*/

app.get("/editlist", function (req, res) {
    detail.findOne({
        _id: req.session.uid
    }, function (err, data) {
        res.render("editlist", {
            listx: data.list
        });
    });
});

app.post("/deleteListItems/:lstName", function (req, res) {
    console.log(req.body,req.params);
    detail.findOne({_id:req.session.uid},'list',function(err,data){
        console.log(data);
        for(i in data.list){
            console.log(data.list[i].listname);
            if((data.list[i].listname==req.params.lstName)&&(data.list[i].listname!=req.body[req.params.lstName]))
            {
                data.list[i].listname=req.body[req.params.lstName];
            }
            for(j in data.list[i].lists)
            {
                if((req.params.lstName+data.list[i].lists[j].title) in req.body)
                data.list[i].lists.splice(j, 1);
            }
        }
        //console.log(data.list);
        detail.updateOne({
            _id: req.session.uid
        }, data,function(err,d){
            detail.findOne({
                _id: req.session.uid
            }, function(err,d1){
                //console.log(d1.list);
                res.redirect("/editlist");
            });
        });
    });
});


/*------------------------create list------------------------------*/

app.post("/create-list", function (req, res) {
    console.log(req.body);
    detail.findOne({
        _id: req.session.uid
    }, function (err, data) {
        var flag = 0;
        for (i in data.list) {
            if (data.list[i].listname == req.body.listID) {
                flag = 1;
                break;
            }
        }
        console.log(flag);
        if (!flag) {
            console.log("here");
            
            detail.updateOne({
                _id: req.session.uid
            }, {
                $push: {
                    list: {
                        listname: req.body.listID,
                        lists: []
                    }
                }
            },function(err,d){
                if(!err){
                    res.send({message:"Updated"});
                }
                else{
                    console.log(err);
                }
            });
            /*await detail.findOne({
                _id: req.session.uid
            }, function (err, d) {
                console.log(d.list);
                res.send("Test");
            });*/
        }
        else{
            res.send({message:"Already Exists"});
        }
    });
});


/*--------------------------show followers-------------------------*/

app.post("/showfollowers", async function (req, res) {
    var followers = [];
    await detail.findOne({
        _id: req.session.uid
    }, 'followers').populate("followers.user", "userName profilePic").exec(function (err, data) {
        if (data) {
            console.log(data.followers);
            data.followers.forEach((ele)=>{
                followers.push({userName:ele.user.userName,img:ele.user.profilePic});
                console.log(followers);
            });
            console.log(followers);
    res.render("follow", {
         info: followers,
         status: "followers"
     });
        }
    });
});

/*--------------------------show following-------------------------*/

app.post("/showfollowing", async function (req, res) {
    var following = [];
    await detail.findOne({
        _id: req.session.uid
    }, 'following').populate("following.user", "userName profilePic").exec(function (err, data) {
        if (data) {
            console.log(data.following);
            data.following.forEach((ele)=>{
                following.push({userName:ele.user.userName,img:ele.user.profilePic});
                console.log(following);
            });
            console.log(following);
    res.render("follow", {
         info: following,
         status: "following"
     });
        }
    });
   // res.sendStatus(200)
});


/*--------------------------show followers not login-------------------------*/

app.post("/showfollowers/:showfollowers", async function (req, res) {
    console.log(req.params,req.url);
    var followers = [];
    await detail.findOne({
        _id: req.params.showfollowers
    }, 'followers').populate("followers.user", "userName profilePic").exec(function (err, data) {
        if (data) {
            console.log(data.followers);
            data.followers.forEach((ele)=>{
                followers.push({userName:ele.user.userName,img:ele.user.profilePic});
                console.log(followers);
            });
            console.log(followers);
    res.render("follow1", {
         info: followers,
         status: "followers"
     });
        }
    });
});

/*--------------------------show following not login-------------------------*/

app.post("/showfollowing/:showfollowing", async function (req, res) {
    console.log(req.params);
    var following = [];
    await detail.findOne({
        _id: req.params.showfollowing
    }, 'following').populate("following.user", "userName profilePic").exec(function (err, data) {
        if (data) {
            console.log(data.following);
            data.following.forEach((ele)=>{
                following.push({userName:ele.user.userName,img:ele.user.profilePic});
                console.log(following);
            });
            console.log(following);
    res.render("follow1", {
         info: following,
         status: "following"
     });
        }
    });
   // res.sendStatus(200)
});



/*-------------------------search list----------------------------*/
app.post("/searchlist", function (req, res) {
    detail.findOne({
        _id: req.session.uid
    }, function (err, data) {
        console.log(data.list, data.list.length, data.list[0].listname);
        // res.send("found");
        res.send({
            a: data.list
        });
        // res.send({a})
    });
});

/*---------------------------------follow user-----------------------------------*/

app.post('/follow-user', async (req, res) => {
    if (req.body.follows == '-1') {
        await detail.updateOne({
            _id: req.session.uid
        }, {
            $push: {
                following: {user: req.body.id}
            }
        });
        detail.updateOne({
            _id: req.body.id
        }, {
            $push: {
                followers: {user: req.session.uid}
            }
        }, () => {
            res.send('1');
        });
    } else {
        await detail.updateOne({
            _id: req.session.uid
        }, {
            $pull: {
                following: {user: req.body.id}
            }
        });
        detail.updateOne({
            _id: req.body.id
        }, {
            $pull: {
                followers: {user: req.session.uid}
            }
        }, () => {
            res.send('-1');
        });
    }
});


// -------------------------------------------------- sign-up routes -------------------------------------------------- //


app.get('/sign-up', (req, res) => {
    if (!req.session.uid) {
        res.render('sign-up', {
            message: '',
            bg: 'white'
        });
    } else {
        res.redirect('/');
    }
});

app.post('/save-user', (req, res) => {
    detail.findOne({
        userName: req.body.userName
    }, (err, found) => {
        if (found) {
            res.render('sign-up', {
                message: 'User name already exists!',
                bg: 'danger'
            });
        } else {
            detail.findOne({
                email: req.body.email
            }, (err, user) => {
                if (!user) {
                    const newUser = new detail({
                        fullName: req.body.fullName,
                        userName: req.body.userName,
                        email: req.body.email,
                        password: crypto.createHash('sha256').update(req.body.password).digest('hex').toString(),
                        profilePic: 'profile-pic-default.png'
                    });
                    newUser.save();
                    req.session.uid = newUser._id;
                    req.session.uun = newUser.userName;
                    req.session.upp = newUser.profilePic;
                    if (req.body.remember == 'true') {
                        req.session.cookie.maxAge = 5 * 24 * 60 * 60 * 1000;
                    }
                    req.session.save(() => {
                        res.redirect('/');
                    });
                } else {
                    res.render('log-in', {
                        message: 'You already have an account!',
                        bg: 'warning'
                    });
                }
            });
        }
    });
});


// -------------------------------------------------- log-in routes -------------------------------------------------- //


app.get('/log-in', (req, res) => {
    if (!req.session.uid) {
        res.render('log-in', {
            message: '',
            bg: 'white'
        });
    } else {
        res.redirect('/');
    }
});

app.post('/check-user', (req, res) => {
    const password = crypto.createHash('sha256').update(req.body.password).digest('hex').toString();
    detail.findOne({
        userName: req.body.userName
    }, (err, user) => {
        if (user && user.password == password) {
            req.session.uid = user._id;
            req.session.uun = user.userName;
            req.session.upp = user.profilePic;
            if (req.body.remember == 'true') {
                req.session.cookie.maxAge = 5 * 24 * 60 * 60 * 1000;
            }
            req.session.save(() => {
                res.redirect('/');
            });
        } else {
            res.render('log-in', {
                message: 'Incorrect user name or password!',
                bg: 'danger'
            });
        }
    });
});

app.get('/log-out', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});


// -------------------------------------------------- settings routes -------------------------------------------------- //


app.get('/settings', (req, res) => {
    if (!req.session.uid) {
        res.redirect('/');
    } else {
        detail.findById(req.session.uid, (err, user) => {
            res.render('settings', {
                message: ['Account Settings'],
                bg: ["primary"],
                details: user
            });
        });
    }
});

app.post('/save-settings', async (req, res) => {
    var message = [],
        bg = []
    const user = await detail.findById(req.session.uid);
    if (!(req.body.newp1 == '' && req.body.newp2 == '')) {
        if (crypto.createHash('sha256').update(req.body.oldp).digest('hex').toString() != user.password) {
            message.push('Incorrect Password!');
            bg.push('danger');
        } else if (req.body.newp1 != req.body.newp2) {
            message.push('Passwords do not match!');
            bg.push('danger');
        } else {
            message.push('Password updated successfully!');
            bg.push('success');
            user.password = crypto.createHash('sha256').update(req.body.newp1).digest('hex').toString();
        }
    }
    if (req.body.email != user.email) {
        const found = await detail.findOne({
            email: req.body.email
        });
        if (found) {
            message.push('Account with that e-mail already exists!');
            bg.push('danger');
        } else {
            message.push('E-mail updated successfully!');
            bg.push('success');
            user.email = req.body.email;
        }
    }
    if (req.body.userName != user.userName) {
        const found = await detail.findOne({
            userName: req.body.userName
        });
        if (found) {
            message.push('Account with that user name already exists!');
            bg.push('danger');
        } else {
            message.push('User name updated successfully!');
            bg.push('success');
            user.userName = req.body.userName;
        }
    }
    if (req.files) {
        const pic = req.files.profilePic;
        if (req.session.upp != 'profile-pic-default.png') {
            fs.unlink(__dirname + '/public/upload/' + req.session.upp);
        }
        pic.name = 'profile-pic-' + req.session.uun + '-' + pic.name;
        await pic.mv(__dirname + '/public/upload/' + pic.name);
        message.push('Profile picture updated successfully!');
        bg.push('success');
        user.profilePic = pic.name;
    }
    await detail.updateOne({
        _id: user._id
    }, user);
    req.session.upp = user.profilePic;
    req.session.uun = user.userName;
    req.session.save(() => {
        detail.findById(req.session.uid, (err, user) => {
            res.render('settings', {
                message: message,
                bg: bg,
                details: user
            });
        });
    });
});

app.post('/delete-account', async (req, res) => {
    if (req.session.upp != 'profile-pic-default.png') {
        fs.unlink(__dirname + '/public/upload/' + req.session.upp);
    }
    await detail.findByIdAndDelete(req.session.uid);
    res.redirect('/log-out');
});


// -------------------------------------------------- search routes -------------------------------------------------- //


app.get('/search-user', (req, res) => {
    res.render('search');
});

app.post('/showprofile', (req, res) => {
    console.log(req.body);
    detail.findOne({
        _id: req.body["hello"]
    }, function (err, user) {
        res.redirect("/users/" + user.userName)
        console.log(user);
    });
});

app.post('/search-user', (req, res) => {
    detail.find({
        userName: new RegExp(req.body.temp, 'i')
    }, (err, user) => {
        res.send(user);
    });
});

app.get('/users/:userInfo', (req, res) => {
    console.log(req.url);
    detail.findOne({
        userName: req.params.userInfo
    }, (err, user) => {
        if (err)
            res.sendStatus(500);
        else if (user == null)
            res.sendStatus(404);
        else {
            var flag=0;
            for(i in user.followers){
                console.log(i);
                if(user.followers[i].user==req.session.uid)
                flag=1;
            }
            if(flag==0)
            flag=-1;
            else
            flag=1;
            var val;
            if (req.params.userInfo == req.session.uun)
                val = 1;
            else
                val = 0;
            res.render('view-profile', {
                details: user,
                exists: val,
                follows: flag
            });
        }
    });
});

// -------------------------------------------------- password reset routes -------------------------------------------------- //


app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', {
        message: '',
        verified: 0,
        bg: ''
    });
});

app.post('/forgot-password-email', (req, res) => {
    detail.findOne({
        email: req.body.email
    }, async (err, user) => {
        if (user) {
            const payload = {
                id: user._id,
                email: user.email
            };
            const secret = user.password + '-' + user._id.getTimestamp() + '-' + process.env.SECRET;
            const token = jwt.encode(payload, secret);
            ejs.renderFile(__dirname + '/views/reset-password-mail.ejs', {
                userName: user.userName,
                pid: payload.id,
                token: token
            }, (err, mail) => {                
                const mailOptions = {
                    from: 'weebstopia@gmail.com',
                    to: user.email,
                    subject: 'Weebstopia Password Reset',
                    html: mail
                }
                transporter.sendMail(mailOptions, function (error, info) {
                    if (!error) {
                        res.render('forgot-password', {
                            message: 'An email has been sent. Please click on the link when you get it.',
                            verified: 1,
                            bg: 'secondary'
                        });
                    }
                });
            });
        } else {
            res.render('forgot-password', {
                message: 'Sorry, there is no user with that email.',
                verified: 0,
                bg: 'danger'
            });
        }
    });
});

app.get('/reset-password/:id/:token', (req, res) => {
    var valid = 1,
        payload;
    detail.findById(req.params.id, (err, user) => {
        const secret = user.password + '-' + user._id.getTimestamp() + '-' + process.env.SECRET;
        try {
            payload = jwt.decode(req.params.token, secret);
        } catch (err) {
            valid = 0;
        } finally {
            if (valid) {
                res.render('reset-password-page', {
                    pid: payload.id,
                    token: req.params.token
                });
            } else {
                res.render('reset-password-page', {
                    pid: 'null',
                    token: 'invalid'
                });
            }
        }
    });
});

app.post('/reset-password', function (req, res) {
    var valid = 1;
    detail.findById(req.body.id, (err, user) => {
        const secret = user.password + '-' + user._id.getTimestamp() + '-' + process.env.SECRET;
        try {
            const payload = jwt.decode(req.body.token, secret);
        } catch (err) {
            valid = 0;
        } finally {
            if (valid) {
                password = crypto.createHash('sha256').update(req.body.password).digest('hex').toString();
                user.password = password;
                detail.updateOne({
                    _id: req.body.id
                }, user, () => {
                    res.render('log-in', {
                        message: 'Password reset was successful! Please login to continue!',
                        bg: 'warning'
                    });
                });
            } else {
                res.render('reset-password-page', {
                    pid: 'null',
                    token: 'invalid'
                });
            }
        }
    });
});


// -------------------------------------------------- listen -------------------------------------------------- //


app.listen(3000, () => {
    console.log('Server started!');
});


// -------------------------------------------------- end -------------------------------------------------- //