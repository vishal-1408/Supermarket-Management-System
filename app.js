const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));



app.listen(3000,()=>{
  console.log("server started on port 3000");
})
