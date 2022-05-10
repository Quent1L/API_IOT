const express = require('express');
const app = express();
const mysql = require('mysql');
const bodyParser = require('body-parser');


const con = mysql.createConnection({
    host: "localhost",
    user: "iot",
    password: "iot_smart_led",
    database: "iot_smart_led"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connecté à la base de données MySQL!");
});
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.listen(3000, () => {
    console.log("serveur à l'écoute");
})

// Add headers before the routes are defined
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:8080'
}));

app.get('/esp32/:id', (req, res) => {
    con.query("SELECT o.rgb, o.seuil_luminosite, o.delai_mouvement, m.libelle as 'mode_libelle' FROM objet o JOIN mode m on m.id_mode = o.id_mode WHERE o.id_objet=" + req.params.id, function (err, result) {
        if (err) throw err;
        const rgb = hexToRgb(result[0].rgb);
        result[0].red = rgb.r;
        result[0].green = rgb.g;
        result[0].blue = rgb.b;
        delete result[0].rgb;
        res.send(result);
        if (req.query.etatLed) {
            con.query("UPDATE objet SET etat_led =" + req.query.etatLed + " WHERE id_objet=" + req.params.id, function (err, result) {
                if (err) throw err;
            });
        }
    });
})


app.get('/mode', (req, res) => {
    con.query("SELECT * FROM mode", function (err, result) {
        if (err) throw err;
        res.send(result);
    });
})


app.get('/objet', (req, res) => {
    con.query("SELECT o.id_objet, o.libelle, o.etat_led, o.rgb, o.seuil_luminosite, o.delai_mouvement, m.id_mode, m.libelle as 'mode_libelle' FROM objet o JOIN mode m on m.id_mode = o.id_mode ", function (err, result) {
        if (err) throw err;
        for (let i = 0; i < result.length; i++) {
            result[i].mode = {id_mode: result[i].id_mode, libelle: result[i].mode_libelle}
            delete result[i].id_mode;
            delete result[i].mode_libelle;
        }
        res.send(result);
    });
})

app.get('/objet/:id', (req, res) => {
    if(req.params.id) {
        con.query("SELECT o.id_objet, o.libelle,  o.etat_led, o.rgb, o.seuil_luminosite, o.delai_mouvement, m.id_mode, m.libelle as 'mode_libelle' FROM objet o JOIN mode m on m.id_mode = o.id_mode WHERE o.id_objet=" + req.params.id, function (err, result) {
            if (err) throw err;
            result[0].mode = {id_mode: result[0].id_mode, libelle: result[0].mode_libelle}
            delete result[0].id_mode;
            delete result[0].mode_libelle;
            res.send(result);
        });
    }
    else{
        res.status(400).json({
            message: `Pas d'id  !`
        });
    }
})

app.post('/objet/:id', (req, res, next) => {

    if(req.params.id !== undefined){
        con.query("UPDATE objet SET libelle ='" + req.body.libelle + "', rgb = '" + req.body.rgb + "', seuil_luminosite = "
            + req.body.seuil_luminosite + ", delai_mouvement = " + req.body.delai_mouvement + ", id_mode = "
            + req.body.mode.id_mode + " WHERE id_objet=" + req.params.id, function (err, result) {
            if (err) throw err;
            res.status(201).json({
                message: 'Objet modifié  !'
            });
        });
    }else{
        res.status(400).json({
            message: `Pas d'id  !`
        });
    }

})

app.post('/login', (req, res, next) => {
    if(req.body.login)
    {
        con.query("SELECT * FROM utilisateur WHERE login =  '" +req.body.login+"'", function (err, result) {
            if(result.length > 0) {
                res.status(200).json({
                    message: 'Utilisateur trouvé'
                });
            }else{
                res.status(404).json({
                    message: `L'utilisateur n'existe pas`
                });
            }
        });
    }
    else{
        res.status(400).json({
            message: `Body incorect`
        });
    }

})

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


