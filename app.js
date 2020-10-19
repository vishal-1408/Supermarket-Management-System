const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");
const upload = require("./utils/multer.js");  //even multer won't save the file as it is , it forms the binary file in the given dest same as formidable!!
const excelfile = require('read-excel-file/node');  //takes the input of binary files only!!!!
const fs=require("fs");
const methodOverride = require("method-override");

app.use(session({
  secret:"notthefinalsecretjustatrial",
  resave:false,
  uninitialized:false
}));


app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));


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



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////auth get routes
app.get("/",(req,res)=>{
   res.render("landing");
});
//
// app.get("/register",(req,res)=>{
//   res.render("register");

// });

app.get("/login",(req,res)=>{
    res.render("login");
  });


//
// app.get("/secret",isAuthenticated,(req,res)=>{
//   res.send("secret!!wihieee");
// })


app.get("/logout",(req,res)=>{
  req.session.destroy((err)=>{
    if(err) console.log(err);

  });
  res.clearCookie("connect.sid");
  res.redirect("/login");
});


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////auth post routes
app.post("/login",(req,res)=>{
  con.query(`Select password from login where username='${req.body.username}'`,(err,results)=>{
    if(err) console.log(err);
    else{
    //``  console.log(results);
      if(results[0]){
        bcrypt.compare(req.body.password,results[0].password,(err,resp)=>{
          if(err) {
            console.log(err);
          }else {
            if(resp==true){
            con.query(`Select username,emp_id,d_name from (employee left join login on employee.emp_id=login.employee_id) natural join department  where username='${req.body.username}'`,(err,results)=>{
              req.session.user={
                username:  results[0].username,
                empid:results[0].emp_id,
                role:results[0].d_name
              };
              if(results[0].d_name=="admin") res.redirect("/admin");
              else if(results[0].d_name=="managing") res.redirect("/manager")
            //  console.log(req.session.user);

            })

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

//////////////////////////////////////////////////////admin get routes
var departments={"admin":1,"managing":2,"billing":3,"inventory":4,"cleaning":5,"helper":6,"security":7};
app.get("/admin",adminAuth,(req,res)=>{
  res.render("adminIndex")
})


app.get("/admin/empdetails",adminAuth,(req,res)=>{
  con.query("select * from employee left join login on employee.emp_id=login.employee_id",(e,result)=>{  //join use on!!!!!!
    if(e) console.log(e);
    else{
      res.render("empdetails",{result:result});
    }
  })
});
app.get("/admin/empdetails/:id/view",adminAuth,(req,res)=>{
  con.query(`select * from employee natural join department where emp_id=${req.params.id}`,(e,result)=>{
    if(e) console.log(e);
    else{
      // res.status(200).json({
      //   result:result,
      //   message:"hello"
      // })
      //console.log(result)
      res.render("empview",{result:result});
    }
  })
});
app.get("/admin/empdetails/:id/modify",adminAuth,(req,res)=>{
  con.query(`select * from employee left join login on employee.emp_id=login.employee_id where emp_id=${req.params.id}`,(e,result)=>{
    if(e) console.log(e);
    else{
      console.log(result)
      res.render("empmodify",{result:result});
    }
  })
});
app.get("/admin/empdetails/:id/addcreds",adminAuth,(req,res)=>{
  con.query(`select * from employee where emp_id=${req.params.id}`,(e,result)=>{
    if(e) console.log(e);
    else{
      console.log(result)
      res.render("empaddcreds",{result:result});
    }
  })
});




/////////////////////////////////////////////////////////////admin post routes
app.post("/admin/addemp/single",adminAuth,async (req,res)=>{
     con.query(`insert into employee(emp_name,emp_age,emp_gender,salary,emp_address,emp_mobileno,d_id) values('${req.body.name}',
     '${req.body.age}','${req.body.gender}','${req.body.salary}','${req.body.address}','${req.body.mobileno}',
     '${departments[req.body.dept]}')`,(e,result)=>{
       if(e) console.log(e);
       else{
         console.log(result);
         res.redirect("/admin/empdetails");
       }
     })
});

app.post("/admin/addemp/multiple",adminAuth,upload.single('excelfile'),async (req,res)=>{
   await new Promise((resolve,reject)=>{
     con.query("select * from department",(e,result)=>{
          if(e) console.log(e);
          else{
            let dept={};
            for (x of result){
              dept[x.d_name]=x.d_id;
            }
            resolve(dept);
          }
        })
   })
   .then((dept)=>{
    excelfile("./uploads/"+req.file.filename)
    .then(rows=>{
      console.log(rows)
      let array =[]
      for (x in rows){
        if(x!=0){
          array[x-1]=[rows[x][0],rows[x][1],rows[x][2],rows[x][3],rows[x][4],rows[x][5],dept[rows[x][6]]];
        }
      }
      con.query("insert into employee(emp_name,emp_age,emp_gender,salary,emp_address,emp_mobileno,d_id) values ?",[array],(e,result)=>{
        if(e) console.log(e);
        else{
          console.log(result);
          res.redirect("/admin/empdetails");
          fs.unlink("./uploads/"+req.file.filename,(e)=>{
            if(e) console.log(e);
          });
        }
      })
    })
   })
   .catch(e=>{
     console.log(e);
     res.redirect("/admin")
   })
});

app.patch("/admin/empdetails/:id/modify",adminAuth,async (req,res)=>{
     con.query(`Update employee set emp_name=?,emp_age=?,emp_gender=?,salary=?,emp_address=?,emp_mobileno=?,d_id=? where emp_id=${req.params.id}`,
      [req.body.name,req.body.age,req.body.gender,req.body.salary,req.body.address,req.body.mobileno,departments[req.body.dept]],
        (err,update)=>{
        if(err) console.log(err);
        else{
          if(req.body.username){
            con.query(`select * from login where employee_id=${req.params.id}`,(e,r)=>{
              bcrypt.compare(req.body.password,r[0].password)
              .then(response=>{
                  if(response!=true){
                    bcrypt.hash(req.body.password,10)
                     .then(hash=>{
                      con.query(`Update login set username='${req.body.username}',password='${hash}' where employee_id='${req.params.id}'`,(error,update2)=>{
                      if(error) console.log(error);
                     else{
                       res.redirect("/admin/empdetails");
                      }
                    })
                 }).catch(er=>{
                   console.log(er);
                   res.redirect("/admin");
                 })
                  }else{
                    con.query(`Update login set username=${req.body.username} where employee_id=${req.params.id}`,(error2,update2)=>{
                      if(error2) console.log(error2);
                     else{
                       res.redirect("/admin/empdetails");
                      }
                  });
                }
              
            })
            .catch(errors=>{
              console.log(errors);
              res.redirect("/admin")
            })
          });
        }
        else{
            res.redirect("/admin/empdetails")
          }
        }
      })
});

app.post("/admin/empdetails/:id/addcreds",adminAuth,async (req,res)=>{
 await bcrypt.hash(req.body.password,10)
             .then(hash=>{
              con.query(`insert into login(username,password,employee_id) values('${req.body.username}','${hash}',${req.params.id})`,
              (e,result)=>{
                if(e) console.log(e);
                else{
                  res.redirect("/admin/empdetails");
                }
              })
             })
             .catch(err=>{
               console.log(err)
             })
});



/////////////////////////////////////admin delete routes

app.delete("/admin/empdetails/:id/delete",(req,res)=>{
  con.query(`delete from employee where emp_id=${req.params.id}`,(err,result)=>{
    if(err) console.log(err);
    else {
      res.redirect("/admin/empdetails");
    } 
  })
})


/////////////////////////////////////////////////////////manaager routes
app.get("/manager",(req,res)=>{
  res.send("hey");
});



/////////////////////////////////////////////////////inventory routes




///////////////////////////////////////////////////////billing routes


// app.post("/register",(req,res)=>{
//   bcrypt.hash(req.body.user.password,10,(e,hash)=>{
//     con.query(`INSERT INTO LOGIN(username,password) VALUES('${req.body.user.username}','${hash}')`,req.body.user,(err,results)=>{
//       if(err) console.log(err);
//       else {
//         console.log(results,results.affectedRows);
//         req.session.user=req.body.user.username;
//         req.user=req.body.user.username;
//         res.redirect("/secret");
//       }
//     });
//   });
// });


//////////////////////////////////////////////////////admin routes


/////////////////////////////////////////////////////////manaager routes




/////////////////////////////////////////////////////inventory routes




///////////////////////////////////////////////////////billing routes

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////middlewares
  function adminAuth(req,res,next){
    if(req.session.user!=undefined && req.session.user.role=="admin") next();
    else  res.redirect("/login");
  }

  function managerAuth(req,res,next){
    if(req.session.user!=undefined && (req.session.user.role=="managing" || req.session.user.role=="admin"))  next();
    else res.redirect("/login")
  }
////add already authenticated route to not give access to login or register for the user already registered or loggedin





app.listen(3000,()=>{
  console.log("server started on port 3000");
});
