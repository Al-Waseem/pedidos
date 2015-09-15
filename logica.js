var fs=require("fs");
var sqlite3 = require("sqlite3").verbose();
var dateFormat=require("date-format");
var Imap=require("imap");
var base64  = require('base64-stream');

var drive=require("./drive");

var global_authDrive=false;
var self=this;

var FILE_DB="pedidos.db";
var LOCAL_FOLDER="./AppPedidos";


/******************************VISTAS******************************************/

exports.inicio=function inicio(req,res){
    IniBBDD();
    if(drive.isConnected()){
        global_authDrive=true;
        drive.comprobarDirectorioDrive(res);
    }
    //self.getUsers(res,mostrarUsuarios);
    self.leerMails();
    res.render("pedidos.ejs",{title:"Pedidos",conectado:global_authDrive});
}

exports.usuarios=function usuarios(req,res){
    if(drive.isConnected()){
        global_authDrive=true;
    }
    self.getUsers(res,mostrarUsuarios);
}

function mostrarUsuarios(res,rows){
    if(rows==null) rows=[];
    res.render("usuarios.ejs",{title:"Usuarios",conectado:global_authDrive, users:rows});
}

function mostrarArchivos(res,items){
    if(items==null) items=[];
    res.render("archivos.ejs",{title:"Archivos",conectado:global_authDrive, items:items});
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
        	var SQL="CREATE TABLE USUARIOS(id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT UNIQUE, email TEXT UNIQUE, permiso TEXT)";
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

/**************************************SINCRONIZAR*******************************/

exports.archivos=function archivos(req,res){
    drive.listarDrive(res,comprobarArchivos,"mostrar");
}

exports.sincronizarArchivos=function sincronizarArchivos(req,res){
    drive.listarDrive(res,comprobarArchivos,"sincro");
}

function comprobarArchivos(res,archivos_drive,opcion){
    var aux=fs.readdirSync(LOCAL_FOLDER);
    var archivos_locales=[];
    for(var i=0;i<aux.length;i++){
        var f=aux[i];
        var item=new Object();
        item.nombre=f;
        var prop=fs.statSync(LOCAL_FOLDER+"/"+f);
        item.fecha=new Date(prop.mtime.getTime());
        item.fechaFormato=dateFormat.asString("dd-MM-yyyy hh:mm",item.fecha);
        item.tamanyo=prop.size;
        archivos_locales.push(item);
    }

    var archivos_encontrados=[];
    var archivos=[];

    for(var i=0;i<archivos_locales.length;i++){

        var local=archivos_locales[i];
        var encontrado=false;

        var item=new Object();
        item.nombre=local.nombre;

        for(var j=0;j<archivos_drive.length && !encontrado;j++){

            var drive=archivos_drive[j];
            if(local.nombre==drive.title){
                encontrado=true;
                archivos_encontrados.push(local.nombre);

                item.id=drive.id;
                item.img=drive.iconLink;
                item.link=drive.alternateLink;

                var fecha_drive=new Date(drive.modifiedDate);
                var d1=Math.ceil(local.fecha.getTime()/10000);
                var d2=Math.ceil(fecha_drive.getTime()/10000);
                if(d1>d2){
                    item.tamanyo=local.tamanyo;
                    item.fecha=local.fecha;
                    item.fechaFormato=local.fechaFormato;
                    item.estado=1;
                }
                else{
                    item.tamanyo=drive.fileSize;
                    item.fecha=fecha_drive;
                    item.fechaFormato=dateFormat.asString("dd-MM-yyyy hh:mm",fecha_drive);
                    item.estado=0;
                }
                archivos.push(item);
            }
        }
        if(!encontrado){
            item.estado=2;
            item.id=0;
            item.tamanyo=local.tamanyo;
            item.fecha=local.fecha;
            item.fechaFormato=local.fechaFormato;
            archivos.push(item);
        }
    }

    for(var i=0;i<archivos_drive.length;i++){
        var drive=archivos_drive[i];
        if(archivos_encontrados.indexOf(drive.title)<0){
            var item=new Object();
            item.nombre=drive.title;
            item.id=drive.id;
            item.img=drive.iconLink;
            item.link=drive.alternateLink;
            item.tamanyo=drive.fileSize;
            var fecha_drive=new Date(drive.modifiedDate);
            item.fecha=fecha_drive;
            item.fechaFormato=dateFormat.asString("dd-MM-yyyy hh:mm",fecha_drive);
            item.estado=-1;
            archivos.push(item);
        }
    }

    if(opcion=="mostrar"){
        mostrarArchivos(res,archivos);
    }
    else if(opcion=="sincro"){
        sincronizar(archivos,res,0,sincronizar);
    }

}

function sincronizar(archivos,res,cont,callback){
    if(cont<archivos.length){
        var file=archivos[cont];
        switch (file.estado) {
            case -1:
                drive.eliminarDrive(archivos,res,cont,callback);
                break;
            case 0:
                cont++;
                callback(archivos,res,cont,callback);
                break;
            case 1:
                drive.actualizarDrive(archivos,res,cont,callback);
                break;
            case 2:
                drive.insertarDrive(archivos,res,cont,callback);
                break;
            default:{}
        }
    }
    else{
        res.redirect("/archivos");
    }
}

/******************************MAIL***********************************************/

exports.leerMails=function leerMails(){

    var content=fs.readFileSync('mail.json');
    var json=JSON.parse(content);
    console.log(json.data.user+" "+json.data.pass);

    var imap = new Imap({
        user: json.data.user,
        password: json.data.pass,
        host: 'imap.gmail.com',
        port: 993,
        tls: true
    });

    imap.once('ready', function() {
        imap.openBox('INBOX', true, function(err, box) {
            if (err) throw err;
            imap.search([ ['HEADER', 'SUBJECT', 'AppPedidos'] ], function(err, results) {
                if (err) throw err;
                var f = imap.fetch(results, { struct: true, bodies: '' });
                f.on('message', function (msg, seqno) {
                    console.log('Message #%d', seqno);
                    var prefix = '(#' + seqno + ') ';
                    msg.on('body', function(stream, info) {
                        var buffer = '';
                        stream.on('data', function(chunk) {
                            buffer += chunk.toString('utf8');
                        });
                        stream.once('end', function() {
                            console.log(prefix + 'Parsed header: %s', Imap.parseHeader(buffer));
                        });
                    });
                    msg.once('attributes', function(attrs) {
                        var attachments = findAttachmentParts(attrs.struct);
                        console.log(prefix + 'Has attachments: %d', attachments.length);
                        for (var i = 0, len=attachments.length ; i < len; ++i) {
                            var attachment = attachments[i];
                             console.log(prefix + 'Fetching attachment %s', attachment.params.name);
                              var f = imap.fetch(attrs.uid , { //do not use imap.seq.fetch here
                                  bodies: [attachment.partID],
                                  struct: true
                              });
                              //build function to process attachment message
                              f.on('message', buildAttMessageFunction(attachment));
                          }
                     });
                     msg.once('end', function() {
                         console.log(prefix + 'Finished email');
                     });
                });
                f.once('error', function(err) {
                  console.log('Fetch error: ' + err);
                });
                f.once('end', function() {
                  console.log('Done fetching all messages!');
                  imap.end();
                });
            });
        });
  });

  imap.once('error', function(err) {
      console.log(err);
  });

  imap.once('end', function() {
      console.log('Connection ended');
  });

  imap.connect();
}

function findAttachmentParts(struct, attachments) {
    attachments = attachments ||  [];
    for (var i = 0, len = struct.length, r; i < len; ++i) {
        if (Array.isArray(struct[i])) {
            findAttachmentParts(struct[i], attachments);
        }
        else {
            if (struct[i].disposition && ['INLINE', 'ATTACHMENT'].indexOf(struct[i].disposition.type) > -1) {
                attachments.push(struct[i]);
            }
        }
    }
    return attachments;
}

function buildAttMessageFunction(attachment) {
    var filename = attachment.params.name;
    var encoding = attachment.encoding;

    return function (msg, seqno) {
        var prefix = '(#' + seqno + ') ';
        msg.on('body', function(stream, info) {
            //Create a write stream so that we can stream the attachment to file;
            console.log(prefix + 'Streaming this attachment to file', filename, info);
            var writeStream = fs.createWriteStream(filename);
            writeStream.on('finish', function() {
                console.log(prefix + 'Done writing to file %s', filename);
            });

            //stream.pipe(writeStream); this would write base64 data to the file.
            //so we decode during streaming using
            if (encoding === 'BASE64') {
                //the stream is base64 encoded, so here the stream is decode on the fly and piped to the write stream (file)
                stream.pipe(base64.decode()).pipe(writeStream);
            }
            else  {
                //here we have none or some other decoding streamed directly to the file which renders it useless probably
                stream.pipe(writeStream);
            }
        });
        msg.once('end', function() {
            console.log(prefix + 'Finished attachment %s', filename);
        });
    };
}
