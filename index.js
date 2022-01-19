var uuidv4 = require('uuid').v4;
var app = require('express')();
var mysql = require('mysql');
var bodyParser = require("body-parser");
var config = require('./config.json');
var connection = mysql.createConnection({
    host: config.DB.host,
    user: config.DB.user,
    password: config.DB.password,
    database: config.DB.database
});
var host = '127.0.0.1';
var port = 5000;
connection.connect(function (err) {
    if (err)
        throw err;
    console.log("Connected!");
});
// Регистрация нового пользователя
app.post('/user', function (req, res) {
    try {
        var username_1 = req.query.name;
        var password = req.query.password;
        if (!(username_1 && password)) {
            res.status(400);
            res.send('Отсутствуют аргументы');
            return;
        }
        var sql = "INSERT INTO `users` (`id`, `name`, `password`) VALUES " + "(Null, '".concat(username_1, "', '").concat(password, "')");
        connection.query(sql, function (err) {
            res.status(201);
            res.send("\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C ".concat(username_1, " \u0431\u044B\u043B \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D!"));
        });
    }
    catch (error) {
        res.status(500);
        res.send(error);
    }
});
// Авторизация (создание сессии)
app.post('/auth', function (req, res) {
    var username = req.query.name;
    var password = req.query.password;
    if (!(username && password)) {
        res.status(400);
        res.send('Отсутствуют аргументы');
        return;
    }
    try {
        var sql = "SELECT * FROM `users` " + "WHERE name = '".concat(username, "' AND password = '").concat(password, "'");
        connection.query(sql, function (err, result) {
            if (result.length == 0) {
                res.status(400);
                res.send('Аккаунт/Пароль неверный');
                return;
            }
            var sessionkey = uuidv4();
            var sql = "UPDATE `users` SET `sessionkey` = '".concat(sessionkey, "' WHERE `users`.`name` = '").concat(username, "'");
            connection.query(sql, function (err, result) {
                res.status(200);
                res.send("\u0410\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D\u043E! \u041A\u043B\u044E\u0447 \u0441\u0435\u0441\u0441\u0438\u0438: ".concat(sessionkey));
            });
        });
    }
    catch (error) {
        res.status(500);
        res.send(error);
    }
});
// Написание поста
app.post('/post', function (req, res) {
    var sessionkey = req.query.sessionkey;
    var content = req.query.content;
    if (!(sessionkey && content)) {
        res.status(400);
        res.send('Отсутствуют аргументы');
        return;
    }
    try {
        var sql = "SELECT * FROM `users` " + "WHERE sessionkey = '".concat(sessionkey, "'");
        connection.query(sql, function (err, result) {
            if (!(result.length == 0)) {
                var user = result[0].name;
                var sql = "INSERT INTO `posts` (`id`, `author`, `content`) VALUES " + "(Null, '".concat(user, "', '").concat(content, "')");
                connection.query(sql, function (err) {
                    res.status(201);
                    res.send("\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 ".concat(content, " \u043E\u0442 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F ").concat(user, " \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E!"));
                    return;
                });
            }
            else
                res.status(400);
            res.send('Неверный ключ сессии!');
        });
    }
    catch (error) {
        res.status(500);
        res.send(error);
    }
});
// Получение всех постов
app.get('/posts', function (req, res) {
    var sessionkey = req.query.sessionkey;
    if (!(sessionkey)) {
        res.status(400);
        res.send('Отсутствуют аргументы');
        return;
    }
    try {
        var sql = "SELECT * FROM `users` " + "WHERE sessionkey = '".concat(sessionkey, "'");
        connection.query(sql, function (err, result) {
            if (!(result.length == 0)) {
                var sql = "SELECT * FROM `posts`";
                connection.query(sql, function (err, result) {
                    res.status(200);
                    res.send(result);
                });
            }
        });
    }
    catch (error) {
        res.status(500);
        res.send(error);
    }
});
// Получение поста по ID
app.get('/post', function (req, res) {
    var sessionkey = req.query.sessionkey;
    var ID = req.query.ID;
    if (!(sessionkey && ID)) {
        res.status(400);
        res.send('Отсутствуют аргументы');
        return;
    }
    try {
        var sql = "SELECT * FROM `users` " + "WHERE sessionkey = '".concat(sessionkey, "'");
        connection.query(sql, function (err, result) {
            if (!(result.length == 0)) {
                var sql = "SELECT * FROM `posts` WHERE `id` = " + "'".concat(ID, "'");
                connection.query(sql, function (err, result) {
                    res.status(200);
                    res.send(result);
                });
            }
        });
    }
    catch (error) {
        res.status(500);
        res.send(error);
    }
});
// Удаление поста
app["delete"]('/post', function (req, res) {
    var sessionkey = req.query.sessionkey;
    var ID = req.query.ID;
    if (!(sessionkey && ID)) {
        res.status(400);
        res.send('Отсутствуют аргументы');
        return;
    }
    try {
        var sql = "SELECT * FROM `users` " + "WHERE id = '".concat(ID, "'");
        connection.query(sql, function (err, result) {
            if (!(result.length == 0)) {
                var sql = "SELECT * FROM `users` " + "WHERE sessionkey = '".concat(sessionkey, "'");
                connection.query(sql, function (err, result) {
                    if (!(result.length == 0)) {
                        var sql = "DELETE FROM `posts` WHERE `posts`.`id` = " + "".concat(ID);
                        connection.query(sql, function (err) {
                            res.status(200);
                            res.send("\u041F\u043E\u0441\u0442 \u0443\u0434\u0430\u043B\u0435\u043D!");
                        });
                    }
                });
            }
            else {
                res.send(200);
                res.send("\u041F\u043E\u0441\u0442\u0430 \u043F\u043E\u0434 ID: ".concat(ID, " \u043D\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442!"));
            }
        });
    }
    catch (error) {
        res.status(500);
        res.send(error);
    }
});
app.use(function (res) {
    res.status(404).type('text/plain');
    res.send('404 ERROR');
});
app.listen(port, host, function () {
    console.log("http://".concat(host, ":").concat(port));
});
