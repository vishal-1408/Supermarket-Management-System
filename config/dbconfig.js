const mysql = require("mysql");


var con = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"35791408",
    database:"supermarket"
  });
  
//   con.connect((err)=>{
//     if(err) console.log(err);
//     else console.log("successfully connected");
//   });
  
module.exports=con;