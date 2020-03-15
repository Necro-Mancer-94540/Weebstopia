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


// -------------------------------------------------- server settings -------------------------------------------------- //


const app = express();
dotenv.config();
mongoose.connect(process.env.CONN, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
app.use(session({
    secret: "I'll Take A Potato Chip... And Eat It!",
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
    list:Array
});
const detail = mongoose.model('user', userDetail);
app.use(upload());


// -------------------------------------------------- root route -------------------------------------------------- //


app.get('/',(req, res) => {
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

app.get("/searchanime",function(req,res){
    res.render("searchanim");
});

app.post("/add",function(req,res){
    if(!req.session.uid)
    return res.redirect("/loginP");
    detail.findOne({_id:req.session.uid},async function(err,data){
        if(!err){
            var flag=0,index_i,index_j;
            for(i in data.list){
                if(req.body.listvalue==data.list[i].listname)
                {
                    index_i=i;
                    console.log(index_i);
                    console.log("aa gaya");
                    for(j in data.list[i].lists){
                        if(req.body.id==data.list[i].lists[j].id)
                        {
                            index_j=j;
                            flag=1;
                            //console.log("index_i,index_j");
                            break;
                        }
                    }
                    break;
                }
                
            }
            console.log(flag);
            if (flag){
                //http://api.jikan.moe/v3/anime/1535
            }
            else{
                data.list[index_i].lists.push({id:req.body.id,image_url:req.body.img,title:req.body.title});
                //console.log(data.list[index_i].lists);
                
                await detail.updateOne({_id:req.session.uid}, data);
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

app.get("/showlist",function(req,res){
    detail.findOne({_id:req.session.uid},function(err,data){
        res.render("list",{listx:data.list});
    });
});

app.get("/getlist",function(req,res){
    detail.findOne({_id:req.session.uid},function(err,data){
        res.send({listx:data.list});
    });
});

/*-------------------------delete list-----------------------------*/

app.get("/deletelist",function(req,res){
    res.render("deleteList");
});

app.post("/del",async function(req,res){
    console.log(req.body);
    for(i in req.body){
        await detail.update(
            {_id:req.session.uid},
            { $pull: { list:{listname:i}} }
        );
    }
    res.send("Get");
});


/*-------------------------Edit list-------------------------------*/

app.get("/editlist",function(req,res){
    detail.findOne({_id:req.session.uid},function(err,data){
        res.render("editlist",{listx:data.list});
    });
});

app.post("/deleteListItems",function(req,res){
    console.log(req.body);
    detail.findOne({_id:req.session.uid}, 'list', async function(err,data){
        // delete in which? ind = 3
        for(i in data.list){
            for(j in data.list[i].lists){
                if((data.list[i].listname+data.list[i].lists[j].title) in req.body)
                {
                    console.log("deleted");
                    data.list[i].lists.splice(j,1);
                    // delete [j];
                    console.log(j,data.list[i].lists);
                }
            }
        }
        await detail.updateOne({_id:req.session.uid}, data);
    });
    res.send("Done");
});


/*------------------------create list------------------------------*/

app.post("/create-list",function(req,res){
    console.log(req.body);
    detail.findOne({_id:req.session.uid},async function(err,data){
        var flag=0;
        for(i in data.list){
            if(data.list[i].listname==req.body.listID)
            {
                flag=1;
                break;
            }
        }
        if(!flag){
            await detail.updateOne({_id:req.session.uid},{$push:{list:{listname:req.body.listID,lists:[]}}});
            await detail.findOne({_id:req.session.uid},function(err,d){
                console.log(d.list);
                res.send("Test");
            });
        }
    });
});



/*-------------------------search list----------------------------*/
app.post("/searchlist",function(req,res){
    detail.findOne({_id:req.session.uid},function(err,data){
        console.log(data.list,data.list.length,data.list[0].listname);
        // res.send("found");
        res.send({a:data.list});
        // res.send({a})
    });
});


// -------------------------------------------------- sign-up routes -------------------------------------------------- //


app.get('/sign-up', (req, res) => {
    if (!req.session.uid) {
        res.render('sign-up', {
            message: '',
            bg: 'bg-white',
            text: 'text-secondary'
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
                bg: 'bg-danger',
                text: 'text-white'
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
                        req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;
                    }
                    req.session.save(() => {
                        res.redirect('/');
                    });
                } else {
                    res.render('log-in', {
                        message: 'You already have an account!',
                        bg: 'bg-warning',
                        text: 'text-white'
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
            bg: 'bg-white',
            text: 'text-secondary'
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
                req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;
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

app.post('/showprofile',(req,res)=>{
    console.log(req.body);
    detail.findOne({_id: req.body["hello"]},function(err,user){
        res.redirect("/users/"+user.userName)
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

app.get('/users/:userName', (req, res) => {
    detail.findOne({
        userName: req.params.userName
    }, (err, user) => {
        res.render('view-profile', {
            details: user
        });
    });
});


// -------------------------------------------------- listen -------------------------------------------------- //


app.listen(3000, () => {
    console.log('Server started!');
});


// -------------------------------------------------- end -------------------------------------------------- //