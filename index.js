const express = require('express');
const app = express();
const mysql = require('mysql');

const con = mysql.createConnection({
    host: "localhost",
    user: "iot",
    password: "iot_smart_led",
    database : "iot_smart_led"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connecté à la base de données MySQL!");
});

app.listen(3000, () => {
    console.log("serveur à l'écoute");
})


app.get('/esp32/:id', (req,res) => {

    console.log(req.query.etatLed, req.params.id)

        con.query("SELECT o.rgb, o.seuil_luminosite, o.delai_mouvement, m.libelle as 'mode_libelle' FROM objet o JOIN mode m on m.id_mode = o.id_mode WHERE o.id_objet=" +req.params.id, function (err, result) {
            if (err) throw err;
            const rgb = hexToRgb(result[0].rgb);
            result[0].red =  rgb.r;
            result[0].green =  rgb.g;
            result[0].blue =  rgb.b;
            res.send(result);
            if(req.query.etatLed){
//TODO: MAJ l'état de la led en BDD
            }
        });


})


app.get('/mode', (req,res) => {
    con.query("SELECT * FROM mode", function (err, result) {
        if (err) throw err;
        res.send(result);
    });
})


app.get('/objet', (req,res) => {
    con.query("SELECT o.id_objet, o.libelle, o.rgb, o.seuil_luminosite, o.delai_mouvement, m.id_mode, m.libelle as 'mode_libelle' FROM objet o JOIN mode m on m.id_mode = o.id_mode ", function (err, result) {
        if (err) throw err;
        for (let i = 0; i < result.length; i++) {
            result[i].rgb = '#'+ result[0].rgb;
            result[i].mode= { id_mode: result[i].id_mode, libelle: result[i].mode_libelle}
            delete result[i].id_mode;
            delete result[i].mode_libelle;
        }

        res.send(result);
    });
})

app.get('/objet/:id', (req,res) => {
    con.query("SELECT o.id_objet, o.libelle, o.rgb, o.seuil_luminosite, o.delai_mouvement, m.id_mode, m.libelle as 'mode_libelle' FROM objet o JOIN mode m on m.id_mode = o.id_mode ", function (err, result) {
        if (err) throw err;
        
        result[0].rgb = '#'+ result[0].rgb;
        result[0].mode= { id_mode: result[0].id_mode, libelle: result[0].mode_libelle}
        delete result[0].id_mode;
        delete result[0].mode_libelle;
        res.send(result);
    });
})

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
