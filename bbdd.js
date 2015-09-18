var fs=require("fs");
var sqlite3 = require("sqlite3").verbose();
var dateFormat=require("date-format");

var FILE_DB="pedidos.db";


exports.iniBBDD=function iniBBDD(){
    if(!fs.existsSync(FILE_DB)){
    	var db=new sqlite3.Database(FILE_DB);
        db.serialize(function() {
        	var SQL="CREATE TABLE USUARIOS(id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT UNIQUE, email TEXT UNIQUE, permiso TEXT)";
            db.run(SQL);
        	console.log("Database USUARIOS Created");
            SQL="INSERT INTO USUARIOS (nombre,email,permiso) VALUES('Ana','analladosa87@gmail.com','')";
            db.run(SQL);
            SQL="CREATE TABLE PEDIDOS(id INTEGER PRIMARY KEY AUTOINCREMENT, id_correo TEXT UNIQUE, email TEXT, csv TEXT)";
            db.run(SQL);
            console.log("Database PEDIDOS Created");
	        db.close();
        });
    }
}

exports.getUsers=function getUsers(res,callback){
    var db=new sqlite3.Database(FILE_DB);
    var SQL="SELECT * FROM USUARIOS";
    db.all(SQL,function(err,rows){
        callback(res,rows);
        db.close();
    });
}

exports.addUser=function addUser(req,res,callback){
    var nombre=req.body.nombre;
    var email=req.body.email;
    var db=new sqlite3.Database(FILE_DB);
    var SQL="INSERT INTO USUARIOS(nombre,email) values('"+nombre+"','"+email+"')";
    db.run(SQL,function(err){
		if(!err){
			//Comparto la carpeta con el usuario
			drive.agregarUsuarioCompartido(email,this.lastID,anyadirPermiso);
		}
        res.send(((err)?"error":""+this.lastID));
    });
}

exports.updateUser=function updateUser(req,res,callback){
    var id=req.body.id;
    var nombre=req.body.nombre;
    var db=new sqlite3.Database(FILE_DB);
    var SQL="UPDATE USUARIOS SET nombre='"+nombre+"' WHERE id='"+id+"'";
    db.run(SQL,function(err){
        res.send((err)?"error":"ok");
    });
}

exports.deleteUser=function deleteUser(req,res,callback){
    var id=req.body.id;
    var permiso=req.body.permiso;
    drive.eliminarUsuarioCompartido(permiso);
    var db=new sqlite3.Database(FILE_DB);
    var SQL="DELETE FROM USUARIOS WHERE id='"+id+"'";
    db.run(SQL,function(err){
        res.send((err)?"error":"ok");
    });
}

function anyadirPermiso(permiso,id){
	var db=new sqlite3.Database(FILE_DB);
    var SQL="UPDATE USUARIOS SET permiso='"+permiso+"' WHERE id='"+id+"'";
    db.run(SQL);
}

exports.obtenerPedidos=function obtenerPedidos(res,callback){
    var db=new sqlite3.Database(FILE_DB);
    var SQL="SELECT * FROM PEDIDOS";
    db.all(SQL,function(err,rows){
        callback(res,rows);
        db.close();
    });
}

exports.anyadirPedido=function anyadirPedido(email,fecha,csv){
    var d=new Date(fecha);
    var id_correo=email+"-"+dateFormat.asString("dd-MM-yyyy-hh-mm-SS",d);
    var db=new sqlite3.Database(FILE_DB);
    var SQL="INSERT INTO PEDIDOS(id_correo,email,csv) values('"+id_correo+"','"+email+"','"+csv+"')";
    db.run(SQL,function(err){
		if(err){
            console.log(err);
        }
    });
}
