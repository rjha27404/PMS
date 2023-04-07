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
        res.redirect('/manufacturer');
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

router.get('/', function (req, res) {

    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'supply_chain_mgmt'
    });
    // console.log(req.session.loggedUser.username+"Hello");
    var profile = `select * from manufacturer where username=?`;
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


        // those data needs to be shown on view_manufacturer.ejs
        // Dashboard page requires those data
        // NOT WORKING PROPERLY
        console.log(rows[0][0]);
        console.log(rows[1][0]);
        res.render('manufacturer/index.ejs', {
            'title': "Manufacturer: Home",
            'profile': rows[0][0],
            'totalOrder': rows[1][0],
            'user': req.session.loggedUser
        });
    });


    // res.render('view_manufacturer', {
    //     user: req.session.loggedUser
    // });
});




router.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/');
});

router.get("/order", function (req, res) {
    var query = "SELECT * FROM orders";
    db.getData(query, null, function (rows) {
        var data = {
            'totalOrder': rows,
            'user': req.session.loggedUser
        };
        console.log(data);
        res.render('manufacturer/view_orders', data);
    });
})

router.get("/invoice", function (req, res) {
    var query = "SELECT * FROM invoice,retailer,area WHERE invoice.retailer_id=retailer.retailer_id AND retailer.area_id=area.area_id";
    console.log(req.session.loggedUser.username);
        db.getData(query, null, function (rows1) {
            var data = {
                'totalOrder': rows1,
                'user': req.session.loggedUser
            };
            console.log(data);
            res.render('manufacturer/view_invoice', data);
    });
})

router.get("/invoice/view/:id", function (req, res) {
    var pquery = "SELECT *,invoice_items.quantity as quantity FROM invoice,invoice_items,products WHERE invoice.invoice_id=? AND invoice_items.product_id=products.pro_id AND invoice_items.invoice_id=invoice.invoice_id";
    var query = "SELECT * FROM invoice,retailer,distributor,area WHERE invoice_id=? AND invoice.retailer_id=retailer.retailer_id AND retailer.area_id=area.area_id AND invoice.dist_id=distributor.dist_id";

    var id = req.params.id;
    db.getData(query, [id], function (rows) {
        db.getData(pquery, [id], function (rows1) {
            var data = {
                'product': rows1,
                'invoice': rows[0],
                'total_amount': rows.total_amount,
                'user': req.session.loggedUser
            };
            res.render('manufacturer/view_invoice_items', data);
        });
    });
});



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
            res.render('manufacturer/view_order_items', data);
        });
    });
})

router.get("/confirm_order/:id", function (req, res) {
    var query = "UPDATE orders SET approved=1 where order_id=?";

    var query1 = "SELECT * FROM orders";

    var id = req.params.id;
    db.getData(query, [id], function (rows2) {
        db.getData(query1, null, function (rows) {
            var data = {
                'totalOrder': rows,
                'user': req.session.loggedUser
            };
            console.log(data);
            res.render('manufacturer/view_orders', data);
        });
    });
});

router.get("/generate_invoice/:id", function (req, res) {
    var pquery = "SELECT *,invoice_items.quantity as quantity FROM invoice,invoice_items,products WHERE invoice.invoice_id=? AND invoice_items.product_id=products.pro_id AND invoice_items.invoice_id=invoice.invoice_id";
    var query = "SELECT * FROM invoice,retailer,distributor,area WHERE invoice_id=? AND invoice.retailer_id=retailer.retailer_id AND retailer.area_id=area.area_id AND invoice.dist_id=distributor.dist_id";
    var dist= "SELECT * FROM distributor";
    var id = req.params.id;
    db.getData(query, [id], function (rows) {
        db.getData(pquery, [id], function (rows1) {
            db.getData(dist, [id], function (rows2) {
                var data = {
                    'product': rows1,
                    'invoice': rows[0],
                    'distributor':rows2,
                    'total_amount': rows.total_amount,
                    'user': req.session.loggedUser
                };
                res.render('manufacturer/generate_invoice', data);
            });
        });
    });
})

router.get("/insert_invoice/:id", function (req, res) {
    var order = "SELECT *,order_items.quantity AS q FROM orders,order_items,products WHERE order_items.order_id='$order_id' AND order_items.pro_id=products.pro_id AND order_items.order_id=orders.order_id";
    var dist = "SELECT dist_id,dist_name FROM distributor";
    var selectorder = "SELECT date,status FROM orders WHERE order_id='$order_id'";
    var lastid = "SELECT LAST_INSERT_ID() AS ID FROM invoice";
    var id = req.params.id;
    db.getData(query, [id], function (rows2) {
        db.getData(query1, null, function (rows) {
            var data = {
                'totalOrder': rows,
                'user': req.session.loggedUser
            };
            console.log(data);
            res.render('manufacturer/view_orders', data);
        });
    });
})

router.get('/manage_stock', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var id = req.params.id;
    var query = "SELECT * FROM products,unit WHERE products.unit=unit.id AND quantity IS NOT NULL ";

    db.getData(query, null, function (rows) {
        var data = {
            'stock': rows,
            'user': req.session.loggedUser,
            message: '',
            message_type: '',
            errors: ''
        };
        res.render('manufacturer/manage_stock', data);
    });
});
router.get('/manage_stock/edit/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var id = req.params.id;
    var query = "SELECT * FROM products WHERE pro_id = ? ";

    db.getData(query, [id], function (rows) {
        var data = {
            'product': rows[0],
            'user': req.session.loggedUser,
            message: '',
            message_type: '',
            errors: ''
        };
        res.render('manufacturer/update_stock', data);
    });
});

router.post('/manage_stock/edit/:id', function (req, res) {
    //staff checking
    // check_staff(req, res);


    //validations
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('pro_id', 'email is required').notEmpty();
    req.checkBody('quantity', 'phone is required').notEmpty();

    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {

            var id = req.params.id;
            var query = "SELECT * FROM products WHERE pro_id = ? ";

            db.getData(query, [id], function (rows) {
                var data = {
                    'stock': rows[0],
                    'user': req.session.loggedUser,
                    message: '',
                    message_type: '',
                    errors: ''
                };
                res.render('manufacturer/update_stock', data);
            });

        } else {

            var product = {
                pro_name: req.body.name,
                quantity: req.body.quantity,
            };
            var id = req.params.id;
            var query = "UPDATE products SET ? WHERE pro_id = ?";
            db.getData(query, [product, id], function (rows) {
                // console.log(rows);
                res.redirect('/manufacturer/manage_stock');
            });

        }

    });

});


router.get('/profile/edit/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var id = req.params.id;
    var query = "SELECT * FROM manufacturer WHERE man_id = ? ";

    db.getData(query, [id], function (rows) {
        var data = {
            'manufacturer': rows[0],
            'user': req.session.loggedUser,
            message: '',
            message_type: '',
            errors: ''
        };
        res.render('manufacturer/edit_profile', data);
    });
});

router.post('/profile/edit', function (req, res) {

    //staff checking
    // check_staff(req, res);


    //validations
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'email is required').notEmpty();
    req.checkBody('phone', 'phone is required').notEmpty();

    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {

            var id = req.body.man_id;
            var query = "SELECT * FROM manufacturer WHERE man_id = ? ";

            db.getData(query, [id], function (rows) {
                var data = {
                    'manufacturer': rows[0],
                    'user': req.session.loggedUser,
                    message: '',
                    message_type: '',
                    errors: ''
                };
                res.render('manufacturer/edit_profile', data);
            });

        } else {

            var manufacturer = {
                man_name:req.body.name,
                man_email:req.body.email,
                man_phone:req.body.phone
            };
            var id = req.body.man_id;
            var query = "UPDATE manufacturer SET ? WHERE man_id = ?";
            db.getData(query, [manufacturer, id], function (rows) {
                // console.log(rows);
                res.redirect('/manufacturer');
            });

        }

    });

});

router.get('/profile/edit', function (req, res) {

    //staff checking
    // check_staff(req, res);


    //validations
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'email is required').notEmpty();
    req.checkBody('phone', 'phone is required').notEmpty();

    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {

            var username = req.session.loggedUser.username;
            var query = "SELECT * FROM manufacturer WHERE username = ? ";

            db.getData(query, [username], function (rows) {
                var data = {
                    'manufacturer': rows[0],
                    'user': req.session.loggedUser,
                    message: '',
                    message_type: '',
                    errors: ''
                };
                res.render('manufacturer/edit_profile', data);
            });

        } else {

            var manufacturer = {
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone
            };
            var username = req.session.loggedUser.username;
            console.log("Hey"+username);
            var query = "UPDATE manufacturer SET ? WHERE username = ? ";
            db.getData(query, [manufacturer, username], function (rows) {
                // console.log(rows);
                res.redirect('/manufacturer');
            });

        }

    });

});

router.get('/area', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var query = "SELECT * FROM area";
    db.getData(query, null, function (rows) {
        var data = {
            'area': rows,
            'user': req.session.loggedUser
        };
        res.render('manufacturer/view_area', data);
    });
});

router.get('/area/create', function (req, res) {

    // //staff checking
    // check_staff(req, res);

    var data = {
        message: '',
        message_type: '',
        errors: '',
        user: req.session.loggedUser
    }
    res.render('manufacturer/add_area', data);
});

router.post('/area/create', function (req, res) {

    //staff checking
    // check_staff(req, res);

    //validations
    req.checkBody('name', 'Area Name is required').notEmpty();
    req.checkBody('area_code', 'Area Code is required').notEmpty();

    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {
            res.render('manufacturer/add_area', {
                message: '',
                message_type: '',
                errors: result.array(),
                user: req.session.loggedUser,
            });

        } else {

            var area = {
                area_name: req.body.name,
                area_code: req.body.area_code
            };
            var query = "INSERT INTO area SET ?";
            db.getData(query, [area], function (rows) {
                // console.log(rows);
                res.redirect('/manufacturer/area');
            });

        }

    });

});


router.get('/area/edit/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var id = req.params.id;
    var query = "SELECT * FROM area WHERE area_id = ? ";

    db.getData(query, [id], function (rows) {
        var data = {
            'area': rows[0],
            'user': req.session.loggedUser,
            message: '',
            message_type: '',
            errors: ''
        };
        res.render('manufacturer/edit_area', data);
    });
});

router.post('/area/edit/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);


    //validations
    req.checkBody('name', 'Area Name is required').notEmpty();
    req.checkBody('area_code', 'Area Code is required').notEmpty();


    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {

            var id = req.params.id;
            var query = "SELECT * FROM area WHERE area_id = ? ";

            db.getData(query, [id], function (rows) {
                var data = {
                    'area': rows,
                    'user': req.session.loggedUser,
                    message: '',
                    message_type: '',
                    errors: result.array()
                };

                res.render('manufacturer/edit_area', data);
            });

        } else {

            var area = {
                area_name: req.body.name,
                area_code: req.body.area_code
            };
            var id = req.params.id;
            var query = "UPDATE area SET ? WHERE area_id=?";
            db.getData(query, [area, id], function (rows) {
                // console.log(rows);
                res.redirect('/manufacturer/area');
            });

        }

    });

});

router.get('/area/del/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var id = req.params.id;
    // console.log(id);
    var query = "DELETE FROM area WHERE area_id = ?";
    db.getData(query, [id], function (rows) {
        res.redirect('/manufacturer/area');
    });
});



router.get('/unit', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var query = "SELECT * FROM unit";
    db.getData(query, null, function (rows) {
        var data = {
            'unit': rows,
            'user': req.session.loggedUser
        };
        res.render('manufacturer/view_unit', data);
    });
});

router.get('/unit/create', function (req, res) {

    // //staff checking
    // check_staff(req, res);

    var data = {
        message: '',
        message_type: '',
        errors: '',
        user: req.session.loggedUser
    }
    res.render('manufacturer/add_unit', data);
});

router.post('/unit/create', function (req, res) {

    //staff checking
    // check_staff(req, res);

    //validations
    req.checkBody('name', 'Unit Name is required').notEmpty();

    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {
            res.render('manufacturer/add_unit', {
                message: '',
                message_type: '',
                errors: result.array(),
                user: req.session.loggedUser,
            });

        } else {

            var unit = {
                unit_name: req.body.name,
                unit_details: req.body.details
            };
            var query = "INSERT INTO unit SET ?";
            db.getData(query, [unit], function (rows) {
                // console.log(rows);
                res.redirect('/manufacturer/unit');
            });

        }

    });

});


router.get('/unit/edit/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var id = req.params.id;
    var query = "SELECT * FROM unit WHERE id = ? ";

    db.getData(query, [id], function (rows) {
        var data = {
            'unit': rows[0],
            'user': req.session.loggedUser,
            message: '',
            message_type: '',
            errors: ''
        };
        res.render('manufacturer/edit_unit', data);
    });
});

router.post('/unit/edit/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);


    //validations
    req.checkBody('name', 'Unit Name is required').notEmpty();

    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {

            var id = req.params.id;
            var query = "SELECT * FROM unit WHERE id = ? ";

            db.getData(query, [id], function (rows) {
                var data = {
                    'unit': rows,
                    'user': req.session.loggedUser,
                    message: '',
                    message_type: '',
                    errors: result.array()
                };

                res.render('manufacturer/edit_unit', data);
            });

        } else {
            var id = req.params.id;
            var unit = {
                unit_name: req.body.name,
                unit_details: req.body.details
            };
            var query = "UPDATE unit SET ? WHERE id=?";
            db.getData(query, [unit, id], function (rows) {
                // console.log(rows);
                res.redirect('/manufacturer/unit');
            });

        }

    });

});

router.get('/unit/del/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var id = req.params.id;
    // console.log(id);
    var query = "DELETE FROM unit WHERE id = ?";
    db.getData(query, [id], function (rows) {
        res.redirect('/manufacturer/unit');
    });
});


router.get('/category', function (req, res) {

    //staff checking
    check_staff(req, res);

    var query = "SELECT * FROM categories";
    db.getData(query, null, function (rows) {
        var data = {
            'category': rows,
            'user': req.session.loggedUser
        };
        res.render('manufacturer/view_category', data);
    });
});

router.get('/category/create', function (req, res) {

    // //staff checking
    // check_staff(req, res);

    var data = {
        message: '',
        message_type: '',
        errors: '',
        user: req.session.loggedUser
    }
    res.render('manufacturer/add_category', data);
});

router.post('/category/create', function (req, res) {

    //staff checking
    // check_staff(req, res);

    //validations
    req.checkBody('name', 'Category Name is required').notEmpty();

    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {
            res.render('manufacturer/add_category', {
                message: '',
                message_type: '',
                errors: result.array(),
                user: req.session.loggedUser,
            });

        } else {

            var category = {
                cat_name: req.body.name,
                cat_details: req.body.details
            };
            var query = "INSERT INTO categories SET ?";
            db.getData(query, [category], function (rows) {
                // console.log(rows);
                res.redirect('/manufacturer/category');
            });

        }

    });

});


router.get('/category/edit/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var id = req.params.id;
    var query = "SELECT * FROM categories WHERE cat_id = ? ";

    db.getData(query, [id], function (rows) {
        var data = {
            'category': rows[0],
            'user': req.session.loggedUser,
            message: '',
            message_type: '',
            errors: ''
        };
        res.render('manufacturer/edit_category', data);
    });
});

router.post('/category/edit/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);


    //validations
    req.checkBody('name', 'Category Name is required').notEmpty();

    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {

            var id = req.params.id;
            var query = "SELECT * FROM categories WHERE cat_id = ? ";

            db.getData(query, [id], function (rows) {
                var data = {
                    'category': rows[0],
                    'user': req.session.loggedUser,
                    message: '',
                    message_type: '',
                    errors: result.array()
                };

                res.render('manufacturer/edit_category', data);
            });

        } else {
            var id = req.params.id;
            var category = {
                cat_name: req.body.name,
                cat_details: req.body.details
            };
            var query = "UPDATE categories SET ? WHERE cat_id=?";
            db.getData(query, [category, id], function (rows) {
                // console.log(rows);
                res.redirect('/manufacturer/category');
            });

        }

    });

});

router.get('/category/del/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var id = req.params.id;
    // console.log(id);
    var query = "DELETE FROM categories WHERE cat_id = ?";
    db.getData(query, [id], function (rows) {
        res.redirect('/manufacturer/category');
    });
});



router.get('/manufacturer', function (req, res) {

    //staff checking
    check_staff(req, res);

    var query = "SELECT * FROM manufacturer";
    db.getData(query, null, function (rows) {
        var data = {
            'manufacturer': rows,
            'user': req.session.loggedUser
        };
        res.render('manufacturer/view_manufacturer', data);
    });
});
router.get('/manufacturer/create', function (req, res) {
    var data = {
        message: '',
        message_type: '',
        errors: '',
        'user': req.session.loggedUser
    }
    res.render('manufacturer/add_manufacturer');
})
router.post('/manufacturer/create', function (req, res) {

    //staff checking
    // check_staff(req, res);

    //validation 
    req.checkBody('name', 'Manufacturer Name is required').notEmpty();
    req.checkBody('email', 'Manufacturer Name is required').notEmpty();
    req.checkBody('phone', 'Manufacturer Name is required').notEmpty();
    req.checkBody('username', 'Manufacturer Name is required').notEmpty();
    req.checkBody('password', 'Manufacturer Name is required').notEmpty();
    req.getValidationResult().then(function (result) {

        if (!result.isEmpty()) {
            res.render('manufacturer/index.ejs', {
                message: '',
                message_type: '',
                errors: result.array(),
                user: req.session.loggedUser,
            });
        } else {

            var manufacturer = {
                man_name: req.body.name,
                man_email: req.body.email,
                man_phone: req.body.phone,
                username: req.body.username,
                password: req.body.password,
            };
            var query = "INSERT INTO manufacturer SET ?";
            db.getData(query, [manufacturer], function (rows) {
                // console.log(rows);
                res.redirect('/manufacturer/manufacturer');
            });

        }
    });


});
router.get('/manufacturer/edit/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var id = req.params.id;
    var query = "SELECT * FROM manufacturer WHERE man_id = ? ";

    db.getData(query, [id], function (rows) {
        var data = {
            'manufacturer': rows[0],
            'user': req.session.loggedUser,
            message: '',
            message_type: '',
            errors: ''
        };
        res.render('manufacturer/edit_manufacturer', data);
    });
});

router.post('/manufacturer/edit/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);


    //validations
    req.checkBody('name', 'Manufacturer Name is required').notEmpty();
    req.checkBody('email', 'Manufacturer email is required').notEmpty();
    req.checkBody('phone', 'Manufacturer phone is required').notEmpty();
    req.checkBody('username', 'Manufacturer username is required').notEmpty();

    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {

            var id = req.params.id;
            var query = "SELECT * FROM manufacturer WHERE man_id = ? ";

            db.getData(query, [id], function (rows) {
                var data = {
                    'manufacturer': rows,
                    'user': req.session.loggedUser,
                    message: '',
                    message_type: '',
                    errors: ''
                };
                res.render('manufacturer/view_manufacturer', data);
            });

        } else {

            var id = req.params.id;
            var manufacturer = {
                man_name: req.body.name,
                man_email: req.body.email,
                man_phone: req.body.phone,
                username: req.body.username,
            };
            var query = "UPDATE manufacturer SET ? WHERE man_id = ?";
            db.getData(query, [manufacturer, id], function (rows) {
                res.redirect('/manufacturer/manufacturer');
            });

        }

    });

});

router.get('/manufacturer/del/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var id = req.params.id;
    // console.log(id);
    var query = "DELETE FROM manufacturer WHERE man_id = ?";
    db.getData(query, [id], function (rows) {
        res.redirect('/manufacturer/manufacturer');
    });
});

router.get('/retailer', function (req, res) {

    //staff checking
    check_staff(req, res);

    var query = "SELECT * FROM retailer";
    db.getData(query, null, function (rows) {
        var data = {
            'retailer': rows,
            'user': req.session.loggedUser
        };
        res.render('manufacturer/view_retailer', data);
    });
});
router.get('/retailer/create', function (req, res) {
    var data = {
        message: '',
        message_type: '',
        errors: '',
        'user': req.session.loggedUser
    }
    var query = "SELECT * FROM area";
    db.getData(query, null, function (rows) {
        res.render('manufacturer/add_retailer', { area: rows });
    });
})
router.post('/retailer/create', function (req, res) {

    //staff checking
    // check_staff(req, res);
    console.log("Retailer Create");
    //validation 
    req.checkBody('username', 'username is required').notEmpty();
    req.checkBody('password', 'password is required').notEmpty();
    req.checkBody('area_code', 'AreaCode is required').notEmpty();
    req.checkBody('phone', 'phone is required').notEmpty();
    req.checkBody('email', 'email is required').notEmpty();
    req.checkBody('address', 'address is required').notEmpty();
    req.getValidationResult().then(function (result) {

        if (!result.isEmpty()) {
            var query = "SELECT * FROM area";
            db.getData(query, null, function (rows) {
                res.render('manufacturer/add_retailer', {
                    'area': rows,
                    message: '',
                    message_type: '',
                    errors: result.array(),
                    user: req.session.loggedUser,
                }
                )
            });
        } else {

            var retailer = {
                username: req.body.username,
                password: req.body.password,
                address: req.body.address,
                area_id: req.body.area_code,
                phone: req.body.phone,
                email: req.body.email
            };
            var query = "INSERT INTO retailer SET ?";
            db.getData(query, [retailer], function (rows) {
                // console.log(rows);
                res.redirect('/manufacturer/retailer');
            });

        }
    });


});
router.get('/retailer/edit/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var id = req.params.id;

    var query = "SELECT * FROM retailer WHERE retailer_id = ? ";
    var query1 = "SELECT * FROM area";
    db.getData(query1, null, function (rows1) {
        db.getData(query, [id], function (rows) {
            var data = {
                'retailer': rows[0],
                'area': rows1,
                'user': req.session.loggedUser,
                message: '',
                message_type: '',
                errors: ''
            };
            res.render('manufacturer/edit_retailer', data);
        });
    });
});

router.post('/retailer/edit/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);


    //validations
    req.checkBody('username', 'username is required').notEmpty();
    req.checkBody('area_code', 'AreaCode is required').notEmpty();
    req.checkBody('phone', 'phone is required').notEmpty();
    req.checkBody('email', 'email is required').notEmpty();
    // req.checkBody('address', 'address is required').notEmpty();
    console.log("Hello Retailer");
    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {

            var id = req.params.id;

            var query = "SELECT * FROM retailer WHERE retailer_id = ? ";
            var query1 = "SELECT * FROM area";
            db.getData(query1, null, function (rows1) {
                db.getData(query, [id], function (rows) {
                    var data = {
                        'retailer': rows[0],
                        'area': rows1,
                        'user': req.session.loggedUser,
                        message: '',
                        message_type: '',
                        errors: ''
                    };
                    res.render('manufacturer/edit_retailer', data);
                });
            });

        } else {

            var id = req.params.id;
            console.log(id);
            var retailer = {
                username: req.body.username,
                address: req.body.address,
                area_id: req.body.area_code,
                phone: req.body.phone,
                email: req.body.email
            };
            var query = "UPDATE retailer SET ? WHERE retailer_id = ?";
            db.getData(query, [retailer, id], function (rows) {
                res.redirect('/manufacturer/retailer');
            });

        }

    });

});

router.get('/retailer/del/:id', function (req, res) {

    //staff checking
    // check_staff(req, res);

    var id = req.params.id;
    // console.log(id);
    var query = "DELETE FROM retailer WHERE ID = ?";
    db.getData(query, [id], function (rows) {
        res.redirect('/manufacturer/retailer');
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
        res.render('manufacturer/view_products', data);
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
            res.render('manufacturer/add_product.ejs', { category: rows1, unit: rows2 });
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
            res.render('manufacturer/index.ejs', {
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
                res.redirect('/manufacturer');
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
                res.render('manufacturer/edit_product', data);
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
                res.render('manufacturer/edit_product', data);
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
                res.redirect('/manufacturer/product');
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
        res.redirect('/manufacturer/product');
    });
});


module.exports = router;