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

connection.connect(function(err: any) {
    if (err) throw err;
    console.log("Connected!");
});


function startApp() {
    app.use((res: { status: (arg0: number) => { (): any; new(): any; type: { (arg0: string): void; new(): any; }; }; send: (arg0: string) => void; }) => {
        res.status(404).type('text/plain')
        res.send('404 ERROR')
    })

    app.listen(port, host, function () {
        console.log(`http://${host}:${port}`)
    })
}

// Регистрация нового пользователя
app.post('/user', (req: { query: { name: string; password: string; }; }, res: { status: (arg0: number) => void; send: (arg0: string) => void; }): void => {
    try {
    const username: string = req.query.name;
    const password: string = req.query.password;
    if (!(username && password)) {
        res.status(400);
        res.send('Отсутствуют аргументы');
        return;
    }
    const sql: string = "INSERT INTO `users` (`id`, `name`, `password`) VALUES " + `(Null, '${username}', '${password}')`;
    connection.query(sql, function (err: any) {
        res.status(201); 
        res.send(`Пользователь ${username} был зарегистрирован!`); 

    })
    } catch (error) {
        res.status(500);
        res.send(error);    
    }
})

// Авторизация (создание сессии)
app.post('/auth', (req: { query: { name: any; password: any; }; }, res: { status: (arg0: number) => void; send: (arg0: string) => void; }) => {
    const username: string = req.query.name;
    const password: string = req.query.password;
    if (!(username && password)) {
        res.status(400);
        res.send('Отсутствуют аргументы');
        return;
    }
    try {
    var sql: string = "SELECT * FROM `users` " + `WHERE name = '${username}' AND password = '${password}'`;
    connection.query(sql, function (err: { errno: any; }, result: string | any[]) {
    if (result.length == 0) {
        res.status(400);
        res.send('Аккаунт/Пароль неверный');
        return;
    }
    const sessionkey = uuidv4();
    var sql = `UPDATE \`users\` SET \`sessionkey\` = '${sessionkey}' WHERE \`users\`.\`name\` = '${username}'`
    connection.query(sql, function (err: any, result: any) {
        res.status(200);
        res.send(`Авторизовано! Ключ сессии: ${sessionkey}`); 
    })
    })
    } catch (error) {
        res.status(500);
        res.send(error);    
    }
})

// Написание поста
app.post('/post', (req: { query: { sessionkey: any; content: any; }; }, res: { status: (arg0: number) => void; send: (arg0: string) => void; }) => {
    const sessionkey: string = req.query.sessionkey;
    const content: any = req.query.content;
    if (!(sessionkey && content)) {
        res.status(400);
        res.send('Отсутствуют аргументы');
        return;
    }
    try {
    var sql = "SELECT * FROM `users` " + `WHERE sessionkey = '${sessionkey}'`;
    connection.query(sql, function (err: any, result: string | any[]) {
    if (!(result.length == 0)) {
        var user: string = result[0].name;
        var sql: string = "INSERT INTO `posts` (`id`, `author`, `content`) VALUES " + `(Null, '${user}', '${content}')`;
        connection.query(sql, function (err: { errno: any; }) {
            res.status(201); 
            res.send(`Сообщение ${content} от пользователя ${user} отправлено!`); 
            return;
        
        });
    } else res.status(400); res.send('Неверный ключ сессии!');

    })
} catch (error) {
        res.status(500);
        res.send(error);    
}
})

// Получение всех постов
app.get('/posts', (req: { query: { sessionkey: any; ID: any; }; }, res: { status: (arg0: number) => void; send: (arg0: string) => void; }) => {
    const sessionkey = req.query.sessionkey;
    if (!(sessionkey)) {
        res.status(400);
        res.send('Отсутствуют аргументы');
        return;
    }
    try {
    var sql = "SELECT * FROM `users` " + `WHERE sessionkey = '${sessionkey}'`;
    connection.query(sql, function (err: any, result: string | any[]) {
        if (!(result.length == 0)) {
        var sql = "SELECT * FROM `posts`"
        connection.query(sql, function (err: { errno: any; }, result: any) {
            res.status(200);
            res.send(result);
        })
        }
    })
} catch (error) {
    res.status(500);
    res.send(error);    
}
})

// Получение поста по ID
app.get('/post', (req: { query: { sessionkey: any; ID: any; }; }, res: { status: (arg0: number) => void; send: (arg0: string) => void; }) => {
    const sessionkey = req.query.sessionkey;
    const ID = req.query.ID;
    if (!(sessionkey && ID)) {
        res.status(400);
        res.send('Отсутствуют аргументы');
        return;
    }
    try {
    var sql = "SELECT * FROM `users` " + `WHERE sessionkey = '${sessionkey}'`;
    connection.query(sql, function (err: any, result: string | any[]) {
        if (!(result.length == 0)) {
        var sql = "SELECT * FROM `posts` WHERE `id` = " + `'${ID}'`
        connection.query(sql, function (err: { errno: any; }, result: any) {
            res.status(200);
            res.send(result);
        })
        }
    })
} catch (error) {
    res.status(500);
    res.send(error);    
}
})

// Удаление поста
app.delete('/post', (req: { query: { sessionkey: any; ID: any; }; }, res: { status: (arg0: number) => void; send: (arg0: string | number) => void; }) => {
    const sessionkey: string = req.query.sessionkey;
    const ID: number = req.query.ID;
    if (!(sessionkey && ID)) {
        res.status(400);
        res.send('Отсутствуют аргументы');
        return;
    }
    try {
    var sql: string = "SELECT * FROM `users` " + `WHERE id = '${ID}'`;
    connection.query(sql, function (err: any, result: string | any[]) {
        if (!(result.length == 0)) {
    var sql: string = "SELECT * FROM `users` " + `WHERE sessionkey = '${sessionkey}'`;
    connection.query(sql, function (err: any, result: string | any[]) {
        if (!(result.length == 0)) {
        var sql: string = "DELETE FROM `posts` WHERE `posts`.`id` = " + `${ID}`
        connection.query(sql, function (err: { errno: any; }) {
            res.status(200);
            res.send(`Пост удален!`);
        })
        }   
    })
        } else {
            res.send(200);
            res.send(`Поста под ID: ${ID} не существует!`);
        }
    })  
} catch (error) {
    res.status(500);
    res.send(error);    
}
})

startApp();
