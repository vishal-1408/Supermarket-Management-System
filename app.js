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
const postmark = require("postmark");
const dotenv = require("dotenv");
dotenv.config();
checking();

// Send an email:
var client = new postmark.ServerClient(process.env.SERVER_KEY);


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
  app.get("/supplier/login",(req,res)=>{
    res.render("suplogin");
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

            })

          }else{
            res.redirect("back");
          }
        }
      })
      }else{
        res.redirect("back");
      }
    }
  })
});

app.post("/supplier/login",(req,res)=>{
  con.query(`Select password from suplogin where username='${req.body.username}'`,(err,results)=>{
    if(err) console.log(err);
    else{
    //``  console.log(results);
      if(results[0]){
        bcrypt.compare(req.body.password,results[0].password,(er,resp)=>{
          if(er) {
            console.log(er);
          }else {
            if(resp==true){
            con.query(`Select username,su_id,su_name,su_email,su_mobileno from supplier natural join suplogin  where username='${req.body.username}'`,(err,results)=>{
              req.session.user={
                username:  results[0].username,
                sid:results[0].su_id,
                name:results[0].su_name,
                email:results[0].su_email,
                mobileno:results[0].su_mobileno,
                role:"supplier"
              };
              res.redirect("/supplier/tenders");
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
      res.render("empview",{result:result});
    }
  })
});
app.get("/admin/empdetails/:id/modify",adminAuth,(req,res)=>{
  con.query(`select * from employee left join login on employee.emp_id=login.employee_id where emp_id=${req.params.id}`,(e,result)=>{
    if(e) console.log(e);
    else{

      res.render("empmodify",{result:result});
    }
  })
});
app.get("/admin/empdetails/:id/addcreds",adminAuth,(req,res)=>{
  con.query(`select * from employee where emp_id=${req.params.id}`,(e,result)=>{
    if(e) console.log(e);
    else{
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
      let array =[]
      for (x in rows){
        if(x!=0){
          array[x-1]=[rows[x][0],rows[x][1],rows[x][2],rows[x][3],rows[x][4],rows[x][5],dept[rows[x][6]]];
        }
      }
      con.query("insert into employee(emp_name,emp_age,emp_gender,salary,emp_address,emp_mobileno,d_id) values ?",[array],(e,result)=>{
        if(e) console.log(e);
        else{
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


/////////////////////////////////////////////////////////manager routes


//////////////////////////////////////////get routes

app.get("/manager",managerAuth,(req,res)=>{

  res.render("managerindex");
});


app.get("/manager/addproducts",managerAuth,(req,res)=>{
  con.query("Select * from supplier",(err,results)=>{
    if(err){
      console.log(err);
      res.redirect("/manager");
    }else{
      res.render("addprod",{suppliers:results});
    }
  })

});

app.get("/manager/proddetails",managerAuth,(req,res)=>{
  con.query("Select * from product",(err,results)=>{
    if(err){
      console.log(err);
      res.redirect("/manager");
    }else{
      res.render("proddetails",{products:results});
    }
  })
});

app.get("/manager/proddetails/:id/view",managerAuth,(req,res)=>{
  con.query(`select * from product left join supplier on product.su_id=supplier.su_id where p_id=${req.params.id}`,(e,result)=>{
    if(e) console.log(e);
    else{
      res.render("prodview",{result:result});
    }
  })
});
app.get("/manager/proddetails/:id/modify",managerAuth,(req,res)=>{
  con.query(`select * from supplier`,(e,suppliers)=>{
    if(e) console.log(e);
    else{
      con.query(`select * from product natural join supplier where p_id=${req.params.id}`,(er,result)=>{
        if(er) console.log(er);
        else{
          res.render("prodmodify",{results:result,suppliers:suppliers});
        }
      })
    }
  })
  
});

app.get("/manager/supdetails",managerAuth,(req,res)=>{
  con.query("Select * from supplier",(err,results)=>{
    if(err){
      console.log(err);
      res.redirect("/manager");
    }else{
      res.render("supdetails",{suppliers:results});
    }
  })
});

app.get("/manager/supdetails/:id/view",managerAuth,(req,res)=>{
  con.query(`select * from product right join (select * from supplier where supplier.su_id=${req.params.id}) as supplier on product.su_id=supplier.su_id ;`,
  (e,result)=>{
    if(e) console.log(e);
    else{
      res.render("supview",{result:result});
    }
  })
});
app.get("/manager/supdetails/:id/modify",managerAuth,(req,res)=>{
  con.query(`select * from supplier where su_id=${req.params.id}`,(e,supplier)=>{
    if(e) console.log(e);
    else{
          res.render("supmodify",{supplier:supplier});
        }
      })
    })


app.get("/manager/opentender",(req,res)=>{
  con.query("select p_id,p_name from product where su_id IS NULL",(err,result)=>{
    if(err) console.log(err);
    else{
      con.query("select count(su_id) as count from supplier",(e,count)=>{
        if(e) console.log(e);
        else{
          res.render("opentender",{products:result,count:count.count})
        }
      })
    }
  })

});


app.get("/manager/tender/details",(req,res)=>{
  con.query("Select * from tenders",(err,tenders)=>{
    if(err) console.log(err);
    else{
      res.render("tenderdet",{tenders});
    }
  })
})

app.get("/manager/tender/:id/details",(req,res)=>{
  console.log(req.params.id)
  con.query("Select * from tenders natural join t_products natural join product where t_id= ? ",[Number(req.params.id)],(err,tender)=>{
    if(err) console.log(err);
    else{
      con.query("Select * from supplier left join t_supplier on supplier.su_id=t_supplier.su_id where t_id=?",[Number(req.params.id)],(error,suppliers)=>{
        if(error) console.log(error);
        else{
          res.render("managertender",{tender,suppliers});
        }
      })

    }
  })
})

/////////////////////////////////////////post routes

app.post("/manager/addsup/single",managerAuth,(req,res)=>{
  const password=req.body.password;
  const email=req.body.email;
  const username = req.body.username;
  bcrypt.hash(password,10)
  .then(h=>{
    new Promise((resolve,reject)=>{
      con.query(`insert into supplier(su_name,su_address,su_email,su_mobileno) values(?) `,[[req.body.name,req.body.address,email,
        Number(req.body.mobileno)]]
      ,(err,result)=>{
        if(err) {
          reject(err)
        }else{
          console.log(result)
          resolve(result.insertId);
        // con.query("Select last_insert_id()",(e,id)=>{
        //    if(e) {
        //      reject(e)
        //    }
        //    else{
        //      resolve(id[0]["last_insert_id()"]);
        //    }
        // })
         
        }
      })
    })
    .then(id=>{
        new Promise((resolve,reject)=>{
          con.query(`insert into suplogin values('${username}','${h}',${id})`,(error,result)=>{
            if(error) reject(error);
            else{
              resolve(result);
            }
          })
        })
        .then(result=>{
          client.sendEmail({
            "From": "vishal@kaloory.com",
            "To": email,
            "subject":"Credentials for Dope Market Tender account",
            "HtmlBody": `<h4>Hola! Dope market is a new kind of market  with unique shopping experience.</h4>
            <br>
            <h5>These are your credentails for logging into Dope market tender account and participate in the tender and be a part of our organization.</h5>
            <div>
             <h4> Username: ${username}</h4>
            </div>
            <div>
              <h4>Password: ${password}</h4>
            </div>
            
            <h5>Meet you at : <a href="https://www.google.com">Tender account Login</a></h5>
            <div>© 2020 DOPE MARKET. All rights reserved.</div>
            `
            ,
            // "TemplateId":20708024,
            // "TemplateModel":{ 
            //   "product_url": "DOPE MARKET",
	          //   "product_name": "DOPE MARKET",
	          //   "username": username,
            //   "password": password,
              
	          //  "company_name": "DOPE MARKET",
	          // "company_address":"DOPE MARKET"
            // },
            
            "MessageStream": "outbound"        //transactional stream!!
          }).then(r=>{
            res.redirect("/manager");
          })
          .catch(e=>{
            console.log(e);
          })
            
        })
        .catch(e=>{
          console.log(e);
          res.redirect("/manager");
        })
        
    })
    .catch(e=>{
      console.log(e);
      res.redirect("/manager");
    })
    

  })
  .catch(e=>{
    console.log(e);
    res.redirect("/manager")
  })
  
})

app.post("/manager/addproducts",managerAuth,(req,res)=>{
    con.query("insert into product(p_name,p_mrp,min_qty) values(?)",
    [[req.body.name,Number(req.body.mrp),Number(req.body.qty)]],(err,results)=>{
      if(err) {
        console.log(err);
        res.redirect("/manager/addproducts");
      }else{
        res.redirect("/manager");
      }

    })
});


app.patch("/manager/proddetails/:id/modify",managerAuth,(req,res)=>{
  con.query("Update product set p_name=?,p_mrp=?,min_qty=?,su_id=?,pc_perunit=? where p_id=?",
  [req.body.name,Number(req.body.mrp),Number(req.body.qty),Number(req.body.sid),Number(req.body.pcp),Number(req.params.id)],(e,results)=>{
    if(e) console.log(e);
    else{
      res.redirect("/manager/proddetails/"+req.params.id+"/view");
    }
  })
})


app.delete("/manager/proddetails/:id/delete",managerAuth,(req,res)=>{
  con.query("Delete from product where p_id=?",
  [req.params.id],(e,results)=>{
    if(e) console.log(e);
    else{
      res.redirect("/manager/proddetails");
    }
  })
})

app.patch("/manager/supdetails/:id/modify",managerAuth,(req,res)=>{
  con.query("Update supplier set su_name=?,su_mobileno=?,su_email=?,su_address=? where su_id=?",
  [req.body.name,Number(req.body.mobileno),req.body.email,req.body.address,req.params.id],async (err,result)=>{
    if(err) console.log(err);
    else{
      if(req.body.username){
          const hash = await bcrypt.hash(req.body.password,10);
          con.query("Update suplogin set username=?,password=? where su_id=?",[req.body.username,hash,req.params.id],(e,r)=>{
            if(e) console.log(e);
            else{
             console.log("updated!")
            }
          })
      }
      res.redirect("/manager/supdetails/"+req.params.id+"/view");
    }
  })
})


app.delete("/manager/supdetails/:id/delete",managerAuth,(req,res)=>{
 con.query(`Delete from supplier where su_id=${req.params.id}`,(e,result)=>{
   res.redirect("/manager/supdetails");
 })
})

app.post("/manager/opentender",(req,res)=>{
  con.query("insert into tenders(t_name,t_opentime,t_closetime,t_status) values(?)",
  [[req.body.name,req.body.sd+" "+req.body.st+":00",req.body.ed+" "+req.body.et+":00","upcoming"]],(e,results)=>{
      if(e) console.log(e);
      else{
        let tid=results.insertId;
        let array=[];
        for(let x in req.body.products){
          array[x]=[tid,Number(req.body.products[x])];
        }
        con.query("insert into t_products(t_id,p_id) values ?",[array],(error,result)=>{
          if(error) console.log(error);
          else{
            con.query("select su_email,su_name from supplier",async (er,suppliers)=>{
              if(er) console.log(er);
              else{
                for(x in suppliers){
                  await client.sendEmail({
                    From:process.env.FROM_EMAIL,
                    To:suppliers[x].su_email,
                    Body:"A tender has been opened",
                    HtmlBody:`Hi! ${suppliers[x].su_name}, we have opened a tender.
                    It will start at ${req.body.sd+" "+req.body.st} and will end at ${req.body.ed+" "+req.body.et}`
                  });
                }
                res.redirect("/manager/tender/details")
              }
            })
            
          }
        })
        

                //con.query("insert into(t_name,t_opentime,t_closetime,t_status) values(?)",
      }
  })
})

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


//////////////////////////////////////////////////////supplier routes
//////get routes
app.get("/supplier/tenders",supplierAuth,(req,res)=>{
  con.query("select * from tenders where t_id not in (select t_id from t_supplier where su_id = ?)",[req.session.user.sid],(error,tenders)=>{
    if(error) console.log(error);
    else{
      res.render("suptenderdet",{tenders});
    }
  })
})

app.get("/supplier/tenders/:id/participate",supplierAuth,(req,res)=>{
      con.query("select p_id,t_id,t_name,t_closetime,t_status,p_name,p_mrp from (select * from tenders where t_id=?) as tender natural join t_products natural join product",
      [Number(req.params.id)],(e,tender)=>{
        if(e) console.log(e);
        else{
          console.log(tender)
         if(tender[0].t_status=="open"){
          res.render("supparticipate",{tender});
         }
        }
})
});

app.get("/supplier/tenders/participated",supplierAuth,(req,res)=>{
  con.query("select * from tenders where t_id in (select t_id from t_supplier where su_id =?)",[req.session.user.sid],
  (error,tenders)=>{
    if(error) console.log(error);
    else{
      res.render("suptenderpart",{tenders});
    }
  })
})

app.get("/supplier/tenders/:id/details",supplierAuth,(req,res)=>{
        con.query("select * from (Select t_id,ternary.su_id,cost,p_mrp,p_name from ternary inner join product on ternary.p_id=product.p_id) as tender natural join tenders where t_id=? and su_id = ?",[Number(req.params.id),Number(req.session.user.sid)],
        (error,responses)=>{
            if(error) console.log(error);
            else{
                console.log(responses)
                res.render("suptender",{responses});
            }
        })
})

////////////////post routes
app.post("/supplier/tenders/:id/participate",supplierAuth,(req,res)=>{

  const keys = Object.keys(req.body.p);        //if we give p[integers] then surely they become an arrya if they are continuous itnegersl
  const values = Object.values(req.body.p); 
  const su_id = Number(req.session.user.sid);
  let array=[];
  for(x in keys){
    array[x]=[Number(req.params.id),su_id,Number(keys[x].substring(1)),Number(values[x])];
  }
  console.log(array);
  con.query("insert into t_supplier(t_id,su_id) values(?)",[[Number(req.params.id),su_id]],(error,result)=>{
    if(error) console.log(error)
    else{
      con.query("Insert into ternary(t_id,su_id,p_id,cost) values ?",[array],(e,placed)=>{
        if(e) console.log(e);
        else{
          res.redirect("/supplier/tenders");
        }
      })
    }
   
  })
 

});
/////////////////////////////////////////////////////////manager routes




/////////////////////////////////////////////////////inventory routes




///////////////////////////////////////////////////////billing routes




//////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////middlewares
  function adminAuth(req,res,next){
    if(req.session.user!=undefined && req.session.user.role=="admin") next();
    else res.redirect("/login");
  }

  function managerAuth(req,res,next){
    if(req.session.user!=undefined && (req.session.user.role=="managing" || req.session.user.role=="admin"))  next();
    else res.redirect("/login")
  }

  function supplierAuth(req,res,next){
    if(req.session.user!=undefined && req.session.user.role=="supplier") next();
    else res.redirect("/supplier/login")
    
  }
////add already authenticated route to not give access to login or register for the user already registered or loggedin

function checking(){
  let now;
  setInterval(()=>{
   con.query("Select t_id,t_opentime,t_closetime,t_status from tenders",(e,tenders)=>{
     if(e) console.log(e);
     else{
       now = Date.now();
       for(let x in tenders){
         if(new Date(tenders[x].t_opentime).getTime()<=now && now<new Date(tenders[x].t_closetime) && tenders[x].t_status!="open"){
           con.query(`Update tenders set t_status='open' where t_id=${tenders[x].t_id}`,(error,tender)=>{
             if(error) console.log(error);
             else{
               console.log("opened!!!");
             }
           })
         }
         if(now>new Date(tenders[x].t_closetime) && tenders[x].t_status!="closed"){
          con.query(`Update tenders set t_status='closed' where t_id=${tenders[x].t_id} `,(error,tender)=>{
            if(error) console.log(error);
            else{
              console.log("closed!!!");
            }
          })
         }
       }
     }
   })
  },2000)
}



app.listen(3000,()=>{
  console.log("server started on port 3000");
});
