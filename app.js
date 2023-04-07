var express = require("express");
var bodyParser = require("body-parser");
var expressValidator = require("express-validator");
var expressSession = require("express-session");
var db = require("./db");
//var hbs = require('express-handlebars');
var path = require("path");
var mysql = require("mysql2");
var async = require("async");
const sendMail = require("./emailService");
var admin = require("./routes/admin");
var retailer = require("./routes/retailer");
var register = require("./routes/register");
var manufacturer = require("./routes/manufacturer");
var app = express();
var jwt = require("jsonwebtoken");
const { log } = require("console");
require("dotenv").config();
//configuration
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
//app.engine('hbs', hbs({defaultLayout: 'main'}));

//app.set('view engine', 'hbs');
//use middleware
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());
app.use(expressValidator());
app.use(
  expressSession({
    secret: "ATP3",
    saveUninitialized: false,
    resave: false,
  })
);

app.use(express.static("./public"));

// typeahead

var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "supply_chain_mgmt",
});

connection.connect();

app.get("/search", function (req, res) {
  connection.query(
    'SELECT Medicine_Name from medicine_information where Medicine_Name like "%' +
      req.query.key +
      '%"',
    function (err, rows, fields) {
      if (err) throw err;
      var data = [];
      for (i = 0; i < rows.length; i++) {
        data.push(rows[i].Medicine_Name);
      }
      res.end(JSON.stringify(data));
    }
  );
});

// Routes
app.get("/", function (req, res) {
  res.render("index", {
    title: "Login Panel",
    message: "",
    message_type: "",
    errors: "",
  });
});
app.use("/register", register);
app.get("/admin/forgot-password", (req, res) => {
  res.render("view_password_reset.ejs", {
    title: "Forgot Password Panel",
    message: "",
    message_type: "",
    errors: "",
  });
});

app.post("/admin/forgot-password/link", (req, res) => {
  console.log(process.env.SECRET_KEY);
  // generate unique token
  var token = jwt.sign({ foo: req.body.email1 }, process.env.SECRET_KEY);
  console.log(req.body.email1);
  var query = "INSERT INTO token SET ?";
  var data = {
    email: req.body.email1,
    session_token: token,
  };
  db.getData(query, [data], function (rows) {
    console.log(rows);
    var link = `http://localhost:5000/admin/forget-password-url/${token}`;
    sendMail(req.body.email1, "Link For Password Reset", link);
    res.render("view_login", {
      title: "Login Panel",
      message: "",
      message_type: "",
      errors: "",
    });
  });
});
app.get("/admin/forget-password-url/:token", (req, res) => {
  var query = "SELECT * FROM token WHERE session_token=?";
  var id=req.params.token;
  // console.log(id);
  db.getData(query,[id], (rows) => {
    // console.log(rows);
    if (rows.length > 0) {
      res.render("forgot_password.ejs", {
        title: "Forgot Password Panel",
        item: rows[0],
        message: "",
        message_type: "",
        errors: "",
      });
    } else {
      res.send("Error");
    }
  });
});

app.post("/admin/forget-password-url", (req, res) => {
  var query = "SELECT * FROM token WHERE session_token=?";
  var id= req.body.token;
  var password = req.body.password;
  var email = req.body.email;
  db.getData(query, [id], (rows) => {
    if (rows.length > 0) {
      var query1 = "UPDATE user_access SET password=? WHERE email=?";
      db.getData(query1, [password, email], function (rows) {
        console.log(rows);
        res.render("view_login.ejs", {
          title: "Login Panel",
          message: "",
          message_type: "",
          errors: "",
        });
      });
    } else {
      res.send("Error");
    }
  });
});


app.post("/login", function (req, res) {
  // console.log(req.body.login_type);
  // console.log("HEY You");
  //login validations
  req.checkBody("username", "txtUsername is required").notEmpty();
  req.checkBody("password", "Password is required").notEmpty();

  req.getValidationResult().then(function (result) {
    if (!result.isEmpty()) {
      console.log(req.body.username);
      res.render("index", {
        title: "Login Panel",
        message: "",
        message_type: "",
        errors: result.array(),
        user: req.session.loggedUser,
      });
    } else {
      var user = {
        username: req.body.username,
        password: req.body.password,
        UserType: "",
      };
      const UserType=req.body.login_type;
      console.log(UserType == "Admin");
      console.log(UserType);
      var query_admin =
        "SELECT * FROM admin WHERE username = ? AND password = ?";
      var query_distributor =
        "SELECT * FROM retailer WHERE username = ? AND password = ?";
      var query_supplier =
        "SELECT * FROM manufacturer WHERE username = ? AND password = ?";
      
      if (UserType == "admin"){
        db.getData(query_admin, [user.username, user.password], function (rows) {
            // console.log(rows[0]);
          
            if (!rows[0]) {
              res.render("index", {
                title: "User Login",
                message: "Login Failed! Enter Correct Infromatins.",
                message_type: "alert-danger",
                errors: "",
              });
            } else {
                user.UserType = "admin";
                req.session.loggedUser = user;
                console.log("Hello Admin");
                res.redirect("/admin");
            }
          });
      } else if (UserType == "retailer"){
        db.getData(query_distributor, [user.username, user.password], function (rows) {
            // console.log(rows[0]);
            if (!rows[0]) {
              res.render("index", {
                title: "User Login",
                message: "Login Failed! Enter Correct Infromatins.",
                message_type: "alert-danger",
                errors: "",
              });
            } else {
                user.UserType = "retailer";
                req.session.loggedUser = user;
              res.redirect("/retailer");
            }
          });
        }else{
        db.getData(query_supplier, [user.username, user.password], function (rows) {
        // console.log(rows[0]);
        if (!rows[0]) {
          res.render("index", {
            title: "User Login",
            message: "Login Failed! Enter Correct Infromatins.",
            message_type: "alert-danger",
            errors: "",
          });
        } else {
            user.UserType = "manufacturer";
            req.session.loggedUser = user;
            res.redirect("/manufacturer");
        }
      });
        }
      
    } // validation end
  });
});
app.get('/user/create', function (req, res) {

  //staff checking
  // check_staff(req, res);

  var data = {
      'user': req.session.loggedUser
  }
  res.render('view_register', data);
});

app.post('/user/create', function (req, res) {

  //staff checking
  // check_staff(req, res);
  var connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'pharmacy'
  });
  var user_infromation = {
      Name: req.body.name,
      Email: req.body.email,
      Gender: req.body.gender,
      Date_of_Birth: req.body.user_dob,
      Age: req.body.age,
      Address: req.body.address,
      Contact: req.body.contact,
      Blood_Group: req.body.blood_group,
      Marital_Status: req.body.marital_status,
      Join_Date: req.body.join_date,
      Salary: req.body.salary,
      Username: req.body.username
  };
  var user_access = {
      Email: req.body.email,
      Password: req.body.password,
      Usertype: req.body.usertype,
  };
  console.log(user_infromation);
  console.log(user_access);
  var userAccessQuery = "INSERT INTO User_Access SET ?";
  var userInfoQuery = "INSERT INTO User_Information SET ?";
  db.getData(userAccessQuery, [user_access], function (err,rows) {
      db.getData(userInfoQuery, [user_infromation], function (err, rows) {
          res.redirect('/admin/usermanagement');
      });
  });
});


// routes
app.use("/admin", admin);
app.use("/retailer", retailer);

app.use("/manufacturer", manufacturer);
//start the server
app.listen(5000, function () {
  console.log("server started at port 5000");
});

module.exports = app;
