const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");

app.use(session({
  secret:"notthefinalsecretjustatrial",
  resave:false,
  uninitialized:false
}));


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



///////////////////////////////////////////////get routes
app.get("/",(req,res)=>{
   res.send('unlocked');
});

app.get("/register",(req,res)=>{
  res.render("register");

});

app.get("/login",(req,res)=>{
    res.render("login");
  });



app.get("/secret",isAuthenticated,(req,res)=>{
  res.send("secret!!wihieee");
})


app.get("/logout",(req,res)=>{
  req.session.destroy((err)=>{
    if(err) console.log(err);

  });
  res.clearCookie("connect.sid");
  res.redirect("/login");
});


///////////////////////////////////////////////////post routes
app.post("/register",(req,res)=>{
  bcrypt.hash(req.body.user.password,10,(e,hash)=>{
    con.query(`INSERT INTO LOGIN(username,password) VALUES('${req.body.user.username}','${hash}')`,req.body.user,(err,results)=>{
      if(err) console.log(err);
      else {
        console.log(results,results.affectedRows);
        req.session.user=req.body.user.username;
        req.user=req.body.user.username;
        res.redirect("/secret");
      }
    });
  });
});

app.post("/login",(req,res)=>{
  con.query(`Select password from login where username='${req.body.username}'`,(err,results)=>{
    if(err) console.log(err);
    else{
      console.log(results);
      if(results[0]){
        bcrypt.compare(req.body.password,results[0].password,(err,resp)=>{
          if(err) {
            console.log(err);
          }else {
            if(resp==true){
            req.session.user=req.body.username;
            req.user=req.body.username;
            res.redirect("/secret");
          }else{
            res.redirect("back");
          }
        }
      })
      }else{
        res.redirect("/register");
      }
    }
  })
});


/////////////////////////////////////////////////middlewares
  function isAuthenticated(req,res,next){
    console.log(req.session.user);
    if(req.session.user){
      next();
    }else{
      res.redirect("/login");
    }
  }
////add already authenticated route to not give access to login or register for the user already registered or loggedin





app.listen(3000,()=>{
  console.log("server started on port 3000");
});
