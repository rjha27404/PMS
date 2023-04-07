const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
var db = require('../db');
var async = require('async');
var mysql = require('mysql2');
const sendMail = require("../emailService");
router.use(bodyParser.urlencoded({
    extended: false
}));
router.use(bodyParser.json());


function check_staff(req, res) {
    user = req.session.loggedUser;
    if (user.UserType === 'staff' || user.UserType === 'Staff') {
        res.redirect('/retailer');
        return;
    }
}

// session validation
router.use('*', function (req, res, next) {
    if (!req.session.loggedUser) {
        res.redirect('/');
        return;
    }
    next();
});
router.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/');
});

router.get("/order", function (req, res) {
    var query = "SELECT * FROM orders where retailer_id=?";
    var retailer = "SELECT retailer_id FROM retailer where username=?";
    console.log(req.session.loggedUser.username);
    db.getData(retailer, [req.session.loggedUser.username], function (rows) {
        console.log(rows[0].retailer_id);
        db.getData(query, [rows[0].retailer_id], function (rows1) {
            var data = {
                'totalOrder': rows1,
                'user': req.session.loggedUser
            };
            // console.log(data);
            res.render('retailer/view_my_orders', data);
        });
    });
})

router.post("/order/count_product", function (req, res) {
    // console.log("Hello Rahul");
    var query = "SELECT pro_id FROM products ORDER BY pro_id DESC LIMIT 1";
        db.getData(query, null, function (rows) {
            var data = rows[0];
            // console.log(data);
            res.send(data);
        });
})

router.post("/order/count_products", function (req, res) {
    var query = "SELECT pro_price FROM products WHERE pro_id=?";
    // console.log(req.query.data);
    db.getData(query, [req.query.current_id], function (rows) {
        // console.log(rows[0]);
        var data = {
            'total_price': rows[0].pro_price * parseFloat(req.query.quantity),
        };
        // console.log(data);
        res.send(data);
    });
})

router.post("/order/insert", function (req, res) {
    var currentDate =  new Date();
    var retailer_id;
    db.getData("SELECT retailer_id FROM retailer where username=?", [req.session.loggedUser.username], function (rows) {
        retailer_id = rows[0].retailer_id;
        // console.log("retailer"+retailer_id);
    });
    // console.log("Hello Rahul");
    var total_products=0;
    var quantityArray = [0];
    

    var query = "SELECT pro_id FROM products ORDER BY pro_id DESC LIMIT 1";
    db.getData(query, null, function (rows) {
        total_products = parseInt(rows[0].pro_id);
        for (var i = 1; i <= total_products; i++) {
            // console.log("Count");
            quantityArray[i]=0;
        }
        
        var total_price;

        // console.log("Price" + quantityArray.length);
        if (req.body.total_price != null) {
            total_price = req.body.total_price;

            for (let i = 1; i <= total_products; i++) {
                // console.log("Hey You");
                // console.log("Price" + req.body.total_price);
                // var quantity = "txtQuantity" + i;
                
                // console.log(req.body.txtQuantity);
                quantityArray[i] = 100;
            }
            var insert_query = "INSERT INTO orders(date,retailer_id,total_amount) VALUES(?,?,?)";
            var get_oid = "SELECT order_id FROM orders ORDER BY order_id DESC LIMIT 1";
            var insert_items ="INSERT INTO order_items(order_id,pro_id,quantity) VALUES(?,?,?)"
    // console.log("Insert Query" + quantityArray.length);
    db.getData(insert_query, [currentDate, retailer_id, total_price], function (rows) {

        db.getData(get_oid, null, function (rows1) {
            var order_id = parseInt(rows1[0].order_id);
            // console.log("Oreder" + order_id);
            // console.log("Insert Query" + currentDate);
            for (let i = 1; i < quantityArray.length; i++) {
                // console.log("Inside Array" + quantityArray[i] + order_id);
                if (quantityArray[i] != null) {
                    // console.log(quantityArray[i]);
                    db.getData(insert_items, [order_id, i, quantityArray[i]], function (rows2) {
                        // console.log(i);
                    })
                } else {
                    res.send("There was some error.")
                }
            }
            
    });
        
    });
            
        }
        else {
            res.send("Total price not recieved.");
        }
        res.redirect("/retailer/order");
    });
    // var count = total_products;
    // console.log(count);
    // for (var i = 1; i <= total_products; i++) {
    //     console.log("Count");
    //     quantityArray.push(0);
    // }
    // var total_price;
    
    // console.log("Price" + quantityArray.length);
    // if (req.body.total_price != null) {
    //     total_price = req.body.total_price;
        
    //     for (let i = 1; i <= total_products; i++) {
    //         console.log("Hey You");
    //         console.log("Price" + req.body.total_price);
    //         console.log(req.body.txtQuantity + i);
    //         quantityArray[i]=req.body.txtQuantity+i;
    //     }
    // }
    // else {
    //     res.send("Total price not recieved.");
    // }
    // var insert_query = "INSERT INTO orders(date,retailer_id,total_amount) VALUES(?,?,?)";
    // var get_oid = "SELECT order_id FROM orders ORDER BY order_id DESC LIMIT 1";
    // var insert_items ="INSERT INTO order_items(order_id,pro_id,quantity) VALUES(?,?,?)"
    // console.log("Insert Query" + quantityArray.length);
    // db.getData(insert_query, [currentDate, retailer_id, total_price], function (rows) {

    //     db.getData(get_oid, null, function (rows1) {
    //         var order_id = rows1[0].order_id;
    //         console.log("Oreder" + order_id);
    //         // console.log("Insert Query" + currentDate);
    //         for (let i = 1; i < quantityArray.length; i++) {
    //             console.log("Inside Array" + quantityArray[i] + order_id);
    //             if (quantityArray[i] != null) {
    //                 if (db.getData(insert_items, [order_id, i, quantityArray[i]],  function (rows2) {
    //                     console.log("Inside If");
    //                 })) {

    //                 }
    //                 else {

    //                 }
    //             } else {
    //                 res.send("There was some error.")
    //             }
    //         }
            // res.send("Hello");
    // });
    // });
})


router.get("/order/create", function (req, res) {
    var query = "SELECT * FROM products";

    db.getData(query, null, function (rows) {
            var data = {
                'product': rows,
                'user': req.session.loggedUser
            };
            res.render('retailer/order_items', data);
    });
})

router.get("/order/view/:id", function (req, res) {
    var query = "SELECT * FROM orders where order_id=?";
    var pquery = "SELECT *,order_items.quantity as quantity FROM orders,order_items,products WHERE order_items.order_id=? AND order_items.pro_id=products.pro_id AND order_items.order_id=orders.order_id";

    var id = req.params.id;
    db.getData(query, [id], function (rows) {
        db.getData(pquery, [id], function (rows1) {
            var data = {
                'product': rows1,
                'items': rows[0],
                'total_amount': rows.total_amount,
                'user': req.session.loggedUser
            };
            res.render('retailer/view_order_items', data);
        });
    });
})

router.get("/invoice", function (req, res) {
    var query = "SELECT * FROM invoice,retailer,area WHERE invoice.retailer_id=retailer.retailer_id AND retailer.area_id=area.area_id AND invoice.retailer_id=?";
    var retailer = "SELECT retailer_id FROM retailer where username=?";
    console.log(req.session.loggedUser.username);
    db.getData(retailer, [req.session.loggedUser.username], function (rows) {
        console.log(rows[0].retailer_id);
        db.getData(query, [rows[0].retailer_id], function (rows1) {
            var data = {
                'totalOrder': rows1,
                'user': req.session.loggedUser
            };
            console.log(data);
            res.render('retailer/view_my_invoices', data);
        });
    });
})

router.get("/invoice/view/:id", function (req, res) {
    var query = "SELECT * FROM invoice,retailer,distributor,area WHERE invoice_id=? AND invoice.retailer_id=retailer.retailer_id AND retailer.area_id=area.area_id AND invoice.dist_id=distributor.dist_id";
    var pquery = "SELECT *,invoice_items.quantity as quantity FROM invoice,invoice_items,products WHERE invoice.invoice_id=? AND invoice_items.product_id=products.pro_id AND invoice_items.invoice_id=invoice.invoice_id";

    var id = req.params.id;
    db.getData(query, [id], function (rows) {
        db.getData(pquery, [id], function (rows1) {
            var data = {
                'product': rows1,
                'invoice': rows[0],
                'total_amount': rows.total_amount,
                'user': req.session.loggedUser
            };
            res.render('retailer/view_invoice_items', data);
        });
    });
});


router.get('/', function (req, res) {

    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'supply_chain_mgmt'
    });
    // console.log(req.session.loggedUser.username+"Hello");
    var profile = `select * from retailer where username=?`;
    var totalOrder = "select * from orders limit 5";


    async.parallel([
        function (callback) {
            connection.query(profile, req.session.loggedUser.username, callback)
        },
        function (callback) {
            connection.query(totalOrder, callback)
        },

    ], function (err, rows) {


        // console.log(rows[0][0]);
        // console.log(rows[1][0]);
        // console.log(rows[2][0]);


        // those data needs to be shown on view_retailer.ejs
        // Dashboard page requires those data
        // NOT WORKING PROPERLY
        console.log(rows[0][0]);
        console.log(rows[1][0]);
        res.render('retailer/index.ejs', {
            'title': "retailer: Home",
            'profile': rows[0][0],
            'totalOrder': rows[1][0],
            'user': req.session.loggedUser
        });
    });


    // res.render('view_retailer', {
    //     user: req.session.loggedUser
    // });
});




router.get('/profile/edit/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var id = req.params.id;
    var query = "SELECT * FROM retailer WHERE retailer_id = ? ";

    db.getData(query, [id], function (rows) {
        var data = {
            'retailer': rows[0],
            'user': req.session.loggedUser,
            message: '',
            message_type: '',
            errors: ''
        };
        res.render('retailer/edit_profile', data);
    });
});

router.post('/profile/edit', function (req, res) {

    //staff checking
    // check_staff(req, res);


    //validations
    // req.checkBody('address', 'Address is required').notEmpty();
    req.checkBody('email', 'email is required').notEmpty();
    req.checkBody('phone', 'phone is required').notEmpty();

    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {

            var id = req.body.id;
            var query = "SELECT * FROM retailer WHERE retailer_id = ? ";

            db.getData(query, [id], function (rows) {
                var data = {
                    'retailer': rows[0],
                    'user': req.session.loggedUser,
                    message: '',
                    message_type: '',
                    errors: ''
                };
                res.render('retailer/edit_profile', data);
            });

        } else {

            var retailer = {
                phone: req.body.phone,
                email: req.body.email,
                address: req.body.address
            };
            var id = req.body.id;
            var query = "UPDATE retailer SET ? WHERE retailer_id = ?";
            db.getData(query, [retailer, id], function (rows) {
                // console.log(rows);
                res.redirect('/retailer');
            });

        }

    });

});

router.get('/profile/edit', function (req, res) {

    //staff checking
    // check_staff(req, res);


    //validations
    // req.checkBody('address', 'Address is required').notEmpty();
    req.checkBody('email', 'email is required').notEmpty();
    req.checkBody('phone', 'phone is required').notEmpty();

    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {

            var username = req.session.loggedUser.username;
            var query = "SELECT * FROM retailer WHERE username = ? ";

            db.getData(query, [username], function (rows) {
                var data = {
                    'retailer': rows[0],
                    'user': req.session.loggedUser,
                    message: '',
                    message_type: '',
                    errors: ''
                };
                res.render('retailer/edit_profile', data);
            });

        } else {

            var retailer = {
                phone: req.body.phone,
                email: req.body.email,
                address: req.body.address
            };
            var username = req.body.id;
            console.log("Hey" + username);
            var query = "UPDATE retailer SET ? WHERE retailer_id = ? ";
            db.getData(query, [retailer, username], function (rows) {
                // console.log(rows);
                res.redirect('/retailer');
            });

        }

    });

});






router.get('/product', function (req, res) {

    //staff checking
    check_staff(req, res);

    var query = "SELECT * FROM products";
    db.getData(query, null, function (rows) {
        var data = {
            'product': rows,
            'user': req.session.loggedUser
        };
        res.render('retailer/view_products', data);
    });
});
router.get('/product/create', function (req, res) {
    var data = {
        message: '',
        message_type: '',
        errors: '',
        'user': req.session.loggedUser
    }
    var query1 = "SELECT * FROM categories";
    var query2 = "SELECT * FROM unit";
    db.getData(query1, null, function (rows1) {
        db.getData(query2, null, function (rows2) {
            res.render('retailer/add_product.ejs', { category: rows1, unit: rows2 });
        });
    });
})
router.post('/product/create', function (req, res) {
    console.log("Product Create");
    //staff checking
    // check_staff(req, res);

    //validation 
    req.checkBody('name', 'product name is required').notEmpty();
    req.checkBody('price', 'Price is required').notEmpty();
    req.checkBody('unit_type', 'unit_type is required').notEmpty();
    req.checkBody('category', 'category is required').notEmpty();
    req.checkBody('stock', 'stock is required').notEmpty();
    req.getValidationResult().then(function (result) {

        if (!result.isEmpty()) {
            res.render('retailer/index.ejs', {
                message: '',
                message_type: '',
                errors: result.array(),
                user: req.session.loggedUser,
            });
        } else {

            var product = {
                pro_name: req.body.name,
                pro_price: req.body.price,
                unit: req.body.unit_type,
                pro_cat: req.body.category,
                quantity: req.body.stock,
                pro_desc: req.body.description
            };
            var query = "INSERT INTO products SET ?";
            db.getData(query, [product], function (rows) {
                // console.log(rows);
                res.redirect('/retailer');
            });

        }
    });


});

router.get('/product/edit/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var id = req.params.id;
    console.log(id);
    var query = "SELECT * FROM products WHERE pro_id = ? ";
    var query1 = "SELECT * FROM categories";
    var query2 = "SELECT * FROM unit";
    db.getData(query1, null, function (rows1) {
        db.getData(query2, null, function (rows2) {
            db.getData(query, [id], function (rows) {
                console.log(rows);
                var data = {
                    'product': rows[0],
                    'category': rows1,
                    'unit': rows2,
                    'user': req.session.loggedUser,
                    message: '',
                    message_type: '',
                    errors: ''
                };
                res.render('retailer/edit_product', data);
            });
        });
    });

});

router.post('/product/edit/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);


    //validations
    req.checkBody('name', 'product name is required').notEmpty();
    req.checkBody('price', 'Price is required').notEmpty();
    req.checkBody('unit_type', 'unit_type is required').notEmpty();
    req.checkBody('category', 'category is required').notEmpty();
    req.checkBody('stock', 'stock is required').notEmpty();

    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {

            var id = req.params.id;
            var query = "SELECT * FROM products WHERE pro_id = ? ";

            db.getData(query, [id], function (rows) {
                var data = {
                    'product': rows,
                    'user': req.session.loggedUser,
                    message: '',
                    message_type: '',
                    errors: ''
                };
                res.render('retailer/edit_product', data);
            });

        } else {

            var id = req.params.id;
            var product = {
                pro_name: req.body.name,
                pro_price: req.body.price,
                unit: req.body.unit_type,
                pro_cat: req.body.category,
                quantity: req.body.stock,
                pro_desc: req.body.description
            };
            var query = "UPDATE products SET ? WHERE pro_id = ?";
            db.getData(query, [product, id], function (rows) {
                res.redirect('/retailer/product');
            });

        }

    });

});

router.get('/product/del/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var id = req.params.id;
    // console.log(id);
    var query = "DELETE FROM products WHERE pro_id = ?";
    db.getData(query, [id], function (rows) {
        res.redirect('/retailer/product');
    });
});


module.exports = router;