var fs=require("fs");
var sqlite3 = require("sqlite3").verbose();
var drive=require("./drive");

var global_authDrive=false;
var FILE_DB="pedidos.db";

var self=this;

exports.inicio=function inicio(req,res){
    IniBBDD();
    if(drive.isConnected()){
        global_authDrive=true;
        drive.comprobarDirectorioDrive(res);
    }
    self.getUsers(res,mostrarUsuarios);
}

exports.usuarios=function usuarios(req,res){
    if(drive.isConnected()){
        global_authDrive=true;        
    }
    self.getUsers(res,mostrarUsuarios);
}

function mostrarUsuarios(res,rows){
    if(rows==null) rows=[];
    res.render("usuarios.ejs",{title:"Pedidos",conectado:global_authDrive, users:rows});
}

/************DRIVE***************************************************************/

exports.driveAutentificacion=function driveAutentificacion(req,res){
    drive.driveAutentificacion(req,res);
}

exports.driveGuardarAutentificacion=function driveGuardarAutentificacion(req,res){
    drive.driveGuardarAutentificacion(req,res);
}

/*************BBDD**************************************************************/
function IniBBDD(){
    if(!fs.existsSync(FILE_DB)){
    	var db=new sqlite3.Database(FILE_DB);
        db.serialize(function() {
        	var SQL="CREATE TABLE ARCHIVOS(id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT UNIQUE, fecha TEXT)";
        	db.run(SQL);
            console.log("Database ARCHIVOS Created");
            SQL="CREATE TABLE USUARIOS(id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT UNIQUE, email TEXT UNIQUE, permiso TEXT)";
            db.run(SQL);
        	console.log("Database USUARIOS Created");
            SQL="INSERT INTO USUARIOS (nombre,email,permiso) VALUES('Ana','analladosa87@gmail.com','')";
            db.run(SQL);
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
