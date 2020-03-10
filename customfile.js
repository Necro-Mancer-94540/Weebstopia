const express=require('express');
const upload=require('express-fileupload');
const bodyParser = require('body-parser');
const app=express();
const fs=require('fs');

app.use(upload());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');
app.use(express.static('public/upload'));
app.use(express.static('download'));

app.get('/',function(req,res){
    res.render("settings",{img:'yagami.jpeg'});
});

app.post('/upload',function(req,res){
    console.log(req.body);
    res.send("Pagal");
    /*if(req.files)
    {
        console.log(req.files);
        var file=req.files.filename;
        var index;
        var filename=file.name;
        for(i=filename.length-1;i>=0;i--)
        if(filename[i]=='.')
        {
            index=i;
            console.log(i);
            break;
        }
        file.name="yagami"+filename.slice(index);
        file.mv("./upload/"+file.name,function(err){
            if(err)
            res.send("Error");
            else
            res.send("File Uploaded");
        });
    }*/
});

app.post('/download',function(req,res){
    console.log(req.files);
    if(req.files)
    {
        console.log(req.files);
        var file=req.files.myfile;
        console.log(file);
        var index;
        var filename=file.name;
        for(i=filename.length-1;i>=0;i--)
        if(filename[i]=='.')
        {
            index=i;
            console.log(i);
            break;
        }
        file.name="yagami"+filename.slice(index);
        filename=file.name;
        file.mv("./public/upload/"+file.name,function(err){
            if(err)
            res.send("Error");
            else
            res.render('settings',{img:filename});
        });
        fs.unlink('./public/upload/yagami.jpeg', (err) => {
            if (err) throw err;
            console.log('successfully deleted /tmp/hello');
          });
    }
});

app.listen(3000, () => {
    console.log("Server started!");
});