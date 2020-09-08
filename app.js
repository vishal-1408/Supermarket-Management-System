const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");

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
})

app.get("/login",(req,res)=>{
  con.query("Select * from student",(err,rows)=>{
    if(err) console.log(err);
    else res.send(rows);
  })
})

app.listen(3000,()=>{
  console.log("server started on port 3000");
});
