
/*------------------------Require modules------------------------*/

const express = require('express');
const ejs = require("ejs");
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
var crypto = require('crypto');
const fs=require('fs');
const upload=require('express-fileupload');
const path = require('path');

/*------------------------Initialize Modules-------------------------*/

const app = express();
mongoose.connect("mongodb+srv://terminator:testdb@accounts-0uu7d.mongodb.net/Users", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
app.use(session({
    secret: "Shh, its a secret!"
}));
app.set('view engine', 'ejs');
app.use(express.static('public/index'));
app.use(express.static('public/upload'));
app.use(express.static('downloads'));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(upload());

/*--------------------settings-----------------*/

app.get('/settings',function(req,res){
    if(req.session.uid)
    {
        console.log(req.session);
        res.render("settings",{img:req.session.img});
    }
    else{
        res.redirect("/loginP");
    }
});
var file;
var flag=0;
app.post('/download',function(req,res){
    if(req.files)
    {
        console.log(req.files);
        file=req.files.myfile;
        file.name="d04b98f48e8f8bcc15c6ae5ac050801cd6dcfd428fb5f9e65c4e16e7807340fa"+file.name;
        file.mv("./downloads/"+file.name,function(err){
            if(err)
            res.send("Error");
            else
            res.render('settings',{img:file.name});
        });
    }
    else{
        file=req.files;
    }
});


/*app.post('/test',function(req,res){
    console.log(req.files);
    if(req.files)
    {
        var file=req.files.myfile;
        var index;
        var filename=file.name;
        for(i=filename.length-1;i>=0;i--)
        if(filename[i]=='.')
        {
            index=i;
            break;
        }
        var indextemp;
        var filenametemp=req.session.img;
        for(i=filenametemp.length-1;i>=0;i--)
        if(filenametemp[i]=='.')
        {
            indextemp=i;
            break;
        }
        file.name=req.session.img.slice(0,indextemp)+filename.slice(index);
        filename=file.name;
        fs.unlink('./public/upload/'+req.session.img, (err) => {
            if (err) throw err;
            console.log('successfully deleted image');
          });
          req.session.img=filename;
        file.mv("./public/download/"+file.name,function(err){
            if(err)
            res.send("Error");
            else
            res.render('settings',{img:filename});
        });
    }
});*/

/*-------------------save profile----------------------*/

app.post('/saveprofile',function(req,res){
    if(!file)
    return setTimeout(function(){ res.redirect("/"); }, 3000);
    var index;
    for(i=file.name.length-1;i>=0;i--)
    if(file.name[i]=='.')
    {
        index=i;
        break;
    }
    var indextemp;
    var filenametemp=req.session.img;
    for(i=filenametemp.length-1;i>=0;i--)
    if(filenametemp[i]=='.')
    {
        indextemp=i;
        break;
    }
    file.name=req.session.img.slice(0,indextemp)+file.name.slice(index);
    fs.unlink('./public/upload/'+req.session.img, (err) => {
        if (err) throw err;
        console.log('successfully deleted image');
      });
      req.session.img=file.name;
    file.mv("./public/upload/"+file.name,function(err){
        if(err)
        res.send("Error");
        else
        res.render('settings',{img:file.name});
    });
    const directory = './downloads/';
    fs.readdir(directory, (err, files) => {
    if (err) throw err;

    for (const f of files) {
        fs.unlink(path.join(directory, f), err => {
        if (err) throw err;
        });
    }
    });
    users.updateOne({_id:req.session.uid}, { $set: { image: req.session.img } },function(err,user){
        console.log(user);
    });
    res.redirect("/");
});

/*--------------Create schema for mongodb---------------------*/

const loginUsers = new mongoose.Schema({
    email: String,
    password: String,
    fullName:String,
    image:String,
    list:Array,
});
const users = mongoose.model("user", loginUsers);


/*------------register user--------------------*/


function saveUser(data, res) {
    users.findOne({
        email: data.email
    }, function (err, user) {
        if (!user) {
            const newUser = new users({
                fullName: data.fullName,
                email: data.email,
                password: crypto.createHash('sha256').update(data.password).digest('hex').toString()
            });
            newUser.save();
        } else {
            return res.redirect("/sign-up");
        }
    });

}

/*--------------search user-------------------*/


app.post('/search', (req, res) => {
    res.render('search');
});

app.post('/searchuser',(req,res)=>{
    console.log(req.body.temp);
    users.find({fullName: new RegExp(req.body.temp, "i")},function(err,user){
            console.log(user);
            res.send(user);
    });
});


/*------------------Search Anime--------------------*/

app.get("/searchanime",function(req,res){
    res.sendFile(__dirname+"/search.html");
});

app.post("/add",async function(req,res){
    if(!req.session.uid)
    return res.redirect("/loginP");
    await users.findOne({_id:req.session.uid},async function(err,data){
        if(!err){
            var flag=0;
            for(i in data.list){
                console.log(data.list[i].id);
                if(req.body.id==data.list[i].id)
                {
                    flag=1;
                    break;
                }
            }
            if (flag){
                //http://api.jikan.moe/v3/anime/1535
            }
            else{
                await users.updateOne({_id:req.session.uid}, { $push: {list: {id:req.body.id,image_url:req.body.img,title:req.body.title}}});
            }
        } else {
            res.send(err);
        }
    })
    res.send("Correct");
});

app.get("/showlist",function(req,res){
    if(!req.session.uid)
    return res.redirect("/loginP");
    users.findOne({_id:req.session.uid},function(err,data){
        res.render("list",{lists:data.list});
    });
});


/*---------------------sign up---------------------*/

app.post('/sign-up', (req, res) => {
    res.render('sign-up');
});

app.post('/save-user', (req, res) => {
    saveUser(req.body, res);
    res.redirect("/loginP");
});

/*------------------Login---------------------*/


app.post("/loginP", (req, res) => {
    if(req.session.uid)
    res.redirect("/");
    else
    res.sendFile(__dirname + "/signin.html");
});

app.get("/loginP", (req, res) => {
    if(req.session.uid)
    res.redirect("/");
    else
    res.sendFile(__dirname + "/signin.html");
});

app.get('/', (req, res) => {
    if(req.session.uid)
    res.render('logout');
    else
    res.render('index');
});

app.get('/log', (req, res) => {
    console.log("gLog reqest", req.session);
    if (!req.session.uid)
        return res.redirect("/loginP")
    res.redirect('/');
});
app.post('/login', (req, res) => {
    const e = req.body.email;
    const p = req.body.pname;
    var hvalue = crypto.createHash('sha256').update(p).digest('hex').toString();
    console.log(req.body, e, hvalue);
    if (e && p) {
        users.findOne({
            email: e
        }, function (err, user) {
            var k = 0,
                j = 0;
            console.log(user);
            if (!user) {
                res.send({
                    "email": -1,
                    "successfull": false
                });
            } else if (user.email === e && user.password === hvalue) {

                req.session.uid = user.id;
                req.session.img=user.image;
                req.session.fullName=user.fullName;
                console.log("setting cookie", req.session, user);
                res.send({
                    "successfull": true
                });

            } else {
                if ((user.email !== e))
                    k = 1;
                if ((user.password !== p))
                    j = 1;
                res.send({
                    "email": k,
                    "password": j,
                    "successfull": false
                });
            }
        });
    }
});

app.post("/logOut", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

/*-------------------show profile-----------------------*/

app.post('/showprofile',(req,res)=>{
    console.log(req.body);
    users.findOne({_id: req.body["hello"]},function(err,user){
        res.redirect("/"+user.fullName)
        console.log(user);
});
});

app.get("/:customListName",function(req,res){
    users.findOne({fullName:req.params.customListName},function(err,results){
        if(!err){
            if(!results){
                res.redirect("/");
            } else {
                res.render("profile", {
                    name: results.fullName,
                    image: results.image
                });
            }
        }
    });
    console.log(req.params.customListName);
});

/*----------starting server-----------------*/

app.listen(3000, () => {
    console.log("Server started!");
});