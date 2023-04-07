const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
var db = require('../db');
var async = require('async');
var mysql = require('mysql2');
const sendMail = require("../emailService");
var jwt = require("jsonwebtoken");
router.use(bodyParser.urlencoded({
    extended: false
}));
router.use(bodyParser.json());


function check_staff(req, res) {
    user = req.session.loggedUser;
    if (user.UserType === 'staff' || user.UserType === 'Staff') {
        res.redirect('/admin');
        return;
    }
}

// // session validation
// router.use('*', function (req, res, next) {
//     if (!req.session.loggedUser) {
//         res.redirect('/');
//         return;
//     }
//     next();
// });

router.get("/forgot_password", (req, res) => {
    res.render("forgot_password");
});

router.post("/forgot_password/link", (req, res) => {
    console.log(process.env.SECRET_KEY);
    // generate unique token
    var token = jwt.sign({ foo: req.body.email1 }, process.env.SECRET_KEY);
    console.log(req.body.email1);
    var query = "INSERT INTO token SET ?";
    var data = {
        email: req.body.email,
        session_token: token,
        login_type:req.body.login_type
    };
    db.getData(query, [data], function (rows) {
        console.log(rows);
        var link = `http://localhost:5000/register/forget-password-url/${token}`;
        sendMail(req.body.email, "Link For Password Reset", link);
        res.redirect("/");
    });
});
router.get("/forget-password-url/:token", (req, res) => {
    var query = "SELECT * FROM token WHERE session_token=?";
    var id = req.params.token;
    // console.log(id);
    db.getData(query, [id], (rows) => {
        // console.log(rows);
        if (rows.length > 0) {
            res.render("update_password.ejs", {
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

router.post("/forget-password-url", (req, res) => {
    var query = "SELECT * FROM token WHERE session_token=?";
    var id = req.body.token;
    console.log(id);
    var password = req.body.password;
    var email = req.body.email;
    var login_type = req.body.login_type;
    db.getData(query, [id], (rows) => {
        if (rows.length > 0) {

            var query1 = `UPDATE admin SET password=? WHERE email=?`;
            // var query1 = `UPDATE manufacturer SET password=? WHERE man_email=?`;
            // var query1 = `UPDATE retailer SET password=? WHERE email=?`;
            if(login_type=="admin"){
                query1 = `UPDATE admin SET password=? WHERE email=?`;
            } else if (login_type == "manufacturer"){
                query1 = `UPDATE manufacturer SET password=? WHERE man_email=?`;
            }else{
                query1 = `UPDATE retailer SET password=? WHERE email=?`;
            }
            db.getData(query1, [password, email], function (rows) {
                console.log(rows);
                res.redirect("/");
            });
        } else {
            res.send("Error!!!!!!");
        }
    });
});



router.get('/manufacturer', function (req, res) {

    //staff checking
    // check_staff(req, res);

    
    res.render('register_supplier');
});
router.get('/retailer', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var query = "SELECT * FROM area";

    db.getData(query, null, function (rows) {
        var data = {
            'area': rows,
        };
        res.render('register_distributor', data);
    });



});






router.get('/product', function (req, res) {

    //staff checking
    check_staff(req, res);

    var query = "SELECT * FROM area";
    db.getData(query, null, function (rows) {
        var data = {
            'area': rows,
            
        };
        res.render('retailer/view_products', data);
    
    });
});
router.post('/manufacturer', function (req, res) {

    //staff checking
    // check_staff(req, res);
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'pharmacy'
    });
    var user_infromation = {
        man_name: req.body.name,
        man_email: req.body.email,
        man_phone: req.body.phone,
        username: req.body.username,
        password: req.body.password
    };
    
    var userInfoQuery = "INSERT INTO manufacturer SET ?";
        db.getData(userInfoQuery, [user_infromation], function (err, rows) {
            res.redirect('/');
    });
});

router.post('/retailer', function (req, res) {

    //staff checking
    // check_staff(req, res);
    
    var user_infromation = {
        address: req.body.address,
        area_id: req.body.area_code,
        email: req.body.email,
        phone: req.body.phone,
        username: req.body.username,
        password: req.body.password
    };

    var userInfoQuery = "INSERT INTO retailer SET ?";
    db.getData(userInfoQuery, [user_infromation], function (err, rows) {
        res.redirect('/');
    });
});



module.exports = router;
