const { v4: uuidv4 } = require('uuid');
const app = require('express')();
const mysql = require('mysql');
const bodyParser = require("body-parser");
const config = require('./config.json')
const connection = mysql.createConnection({
  host     : config.DB.host,
  user     : config.DB.user,
  password : config.DB.password,
  database : config.DB.database
});

const host = '127.0.0.1';
const port = 5000;

connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Регистрация пользователя
app.post('/reg', (req, res) => {
    const username = req.query.name
    const password = req.query.password
    const sql = "INSERT INTO `users` (`id`, `name`, `password`) VALUES " + `(Null, '${username}', '${password}')`;
    connection.query(sql, function (err) {
    if (err) {
        switch(err.errno){
            case 1062: {
                res.status(409); 
                res.send('Имя пользователя уже занято'); 
            }
            default: {
                res.status(400);
                res.send(err);
            }
        }
        console.log(err);
    } else res.status(201); res.send(`Пользователь ${username} был зарегистрирован!`); 
    });
})

// Вход в аккаунт (создание сессии)
app.post('/auth', (req, res) => {
    const username = req.query.name
    const password = req.query.password
    var sql = "SELECT * FROM `users` " + `WHERE name = '${username}' AND password = '${password}'`;
    connection.query(sql, function (err, result) {
    if (err) {
        switch(err.errno) {
            default: {
                res.status(400);
                res.send(err);
            }
        }
    } else if (result.length == 0) {
        res.status(409);
        res.send('Аккаунт/Пароль неверный');
        return;
    }
    const sessionkey = uuidv4();
    var sql = `UPDATE \`users\` SET \`sessionkey\` = '${sessionkey}' WHERE \`users\`.\`name\` = '${username}'`
    connection.query(sql, function (err, result) {
        if (err) {
            res.status(400);
            res.send(err);
        } else {
            res.status(200);
            res.send(`Авторизовано! Ключ сессии: ${sessionkey}`); 
        }
    })
})
})

// Написание поста
app.post('/post', (req, res) => {
    const sessionkey = req.query.sessionkey
    const content = req.query.content
    var sql = "SELECT * FROM `users` " + `WHERE sessionkey = '${sessionkey}'`;
    connection.query(sql, function (err, result) {
        if (err) {
            switch (err) {
                default: {
                    res.status(400);
                    res.send(err);
                }
            }
        } else {
            if (!result.length == 0) {
            var user = result[0].name;
            var sql = "INSERT INTO `posts` (`id`, `author`, `content`) VALUES " + `(Null, '${user}', '${content}')`;
            connection.query(sql, function (err) {
            if (err) {
                switch(err.errno) {
                    default: {
                        res.status(400);
                        res.send(err);
                    }
                }
            } else {
                res.status(201); res.send(`Сообщение ${content} от пользователя ${user} отправлено!`); return;
            }
            });
        } else {
            res.status(400); res.send('Неверный ключ сессии!'); 
        }}
    })
})

// Получение постов
app.get('/post', (req, res) => {
    const sessionkey = req.query.sessionkey;
    const ID = req.query.ID;
    var sql = "SELECT * FROM `users` " + `WHERE sessionkey = '${sessionkey}'`;
    connection.query(sql, function (err, result) {
        if (err) {
            switch (err) {
                default: {
                    res.status(400);
                    res.send(err);
                }
            }
        } else {
            if (!result.length == 0) {

        if (!ID) {
            var sql = "SELECT * FROM `posts`"
        } else {
            var sql = "SELECT * FROM `posts` WHERE `id` = " + `'${ID}'`
        }
        connection.query(sql, function (err, result) {
            if (err) {
                switch(err.errno) {
                    default: {
                        res.status(400);
                        res.send(err);
                    }
                }
            } else {
                res.status(200);
                if (result.length == 0) {
                    res.send(`Поста под ID: ${ID} не существует!`)
                } else res.send(result);
            }
        })
    }}
    })
})

// Удаление поста
app.delete('/post', (req, res) => {
    const sessionkey = req.query.sessionkey;
    const ID = req.query.ID;
    var sql = "SELECT * FROM `users` " + `WHERE id = '${ID}'`;
    connection.query(sql, function (err, result) {
        if (err) {
            switch (err) {
                default: {
                    res.status(400);
                    res.send(err);
                }
            }
        } else {
            if (!result.length == 0) {
    var sql = "SELECT * FROM `users` " + `WHERE sessionkey = '${sessionkey}'`;
    connection.query(sql, function (err, result) {
        if (err) {
            switch (err) {
                default: {
                    res.status(400);
                    res.send(err);
                }
            }
        } else {
            if (!result.length == 0) {
            var sql = "DELETE FROM `posts` WHERE `posts`.`id` = " + `${ID}`

        connection.query(sql, function (err) {
            if (err) {
                switch(err.errno) {
                    default: {
                        res.status(400);
                        res.send(err);
                    }
                }
            } else {
                res.status(200);
                res.send(`Пост удален!`);
            }
        })
    }}
})
} else {
    res.send(200);
    res.send(`Поста под ID: ${ID} не существует!`);
    }}
})
})


app.use((res) => {
    res.status(404).type('text/plain')
    res.send('404 ERROR')
})

app.listen(port, host, function () {
  console.log(`http://${host}:${port}`)
})


