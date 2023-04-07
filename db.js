var mysql = require('mysql2');

module.exports = {
    getData: function(sql, param, callback){
        var connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'supply_chain_mgmt'
        });

        connection.connect(function(err){
            if(err)
            {
                console.log('error connecting database ...');
            }
        });
        if(param == null)
        {
            connection.query(sql, function(err, result){
                callback(result);
            });
        }
        else
        {
            connection.query(sql, param, function(err,result){
                console.log(result);
                callback(result);
            });
        }
    }
};
