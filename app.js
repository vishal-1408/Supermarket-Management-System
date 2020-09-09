const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");

app.use(session({
  secret:"notthefinalsecretjustatrial",
  resave:true,
  uninitialized:true
}))


app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));



var con = mysql.createConnection({
  host:"localhost",
  user:"root",
  password:"35791408",
  database:"supermarket"
});

con.connect((err)=>{
  if(err) console.log(err);
  else console.log("successfully connected");
});

app.get("/logout",(req,res)=>{
  req.session.destroy();
  res.redirect("/register");
});
app.get("/register",(req,res)=>{
  res.render("register");
});
app.get("/",getting,(re,res)=>{
   res.send('unlocked');
});


function getting(req,res,next){
  if(req.user){
    next();
  }else{
    res.redirect("/register");
  }
}

app.post("/register",(req,res)=>{
  bcrypt.hash(req.body.user.password,10,(e,hash)=>{
    con.query(`INSERT INTO LOGIN(username,password) VALUES('${req.body.user.username}','${hash}')`,req.body.user,(err,results)=>{
      if(err) console.log(err);
      else {
        console.log(results,results.affectedRows);
        req.session.user=req.body.user.username;
        req.user=req.body.user.username;
        res.redirect("/");
      }
    })
  });
});

  app.get("/login",(req,res)=>{
    con.query("Select * from student",(err,rows)=>{
      if(err) console.log(err);
      else res.send(rows);
    })
  });








app.listen(3000,()=>{
  console.log("server started on port 3000");
});
