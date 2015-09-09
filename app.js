var express=require("express");
var path=require("path");
var bodyParser=require("body-parser");
var partials=require("express-partials");
var logica=require("./logica");

var app=express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

var port=8080;

app.set("views", path.join(__dirname,"public"));
app.set("views engine","ejs");
app.use(partials());
app.use(express.static(path.join(__dirname,"public")));

app.get("/",logica.inicio);


app.listen(port);
