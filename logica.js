var fs=require("fs");
var dateFormat=require("date-format");

var drive=require("./drive");
var mail=require("./mail");
var bbdd=require("./bbdd");

var global_authDrive=false;
var self=this;

var LOCAL_FOLDER="./AppPedidos";


/******************************VISTAS******************************************/

exports.inicio=function inicio(req,res){
    bbdd.iniBBDD();
    
    if (!fs.existsSync(LOCAL_FOLDER)){
		fs.mkdirSync(LOCAL_FOLDER);
	}
    
    if(drive.isConnected()){
        global_authDrive=true;
        drive.comprobarDirectorioDrive(res);
        mail.leerMail(res,sincronizarPedidos);
    }
    else{
		res.render("pedidos.ejs",{title:"Pedidos",conectado:global_authDrive, datos:[]});
	}    
        
}

function sincronizarPedidos(email,fecha,csv){
    console.log(mail+" "+fecha+"\n"+csv);
    bbdd.anyadirPedido(email,fecha,csv);
}

exports.pedidos=function pedidos(req,res){
    if(drive.isConnected()){
        global_authDrive=true;
    }
    bbdd.obtenerPedidos(res,mostrarPedidos);
}

function mostrarPedidos(res,rows){
	if(rows==null) rows=[];
    res.render("pedidos.ejs",{title:"Pedidos",conectado:global_authDrive, datos:rows});
}

exports.usuarios=function usuarios(req,res){
    bbdd.getUsers(res,mostrarUsuarios);
}

function mostrarUsuarios(res,rows){
    if(rows==null) rows=[];
    res.render("usuarios.ejs",{title:"Usuarios",conectado:global_authDrive, users:rows});
}

function mostrarArchivos(res,items){
    if(items==null) items=[];
    res.render("archivos.ejs",{title:"Archivos",conectado:global_authDrive, items:items});
}

/*************BBDD**************************************************************/


exports.getUsers=function getUsers(res,callback){
	bbdd.getUsers(res,callback);
}

exports.addUser=function addUser(req,res,callback){
    bbdd.addUser(req,res,callback)
}

exports.updateUser=function updateUser(req,res,callback){
    bbdd.updateUser(req,res,callback)
}

exports.deleteUser=function deleteUser(req,res,callback){
    bbdd.deleteUser(req,res,callback)
}

/************DRIVE***************************************************************/

exports.driveAutentificacion=function driveAutentificacion(req,res){
    drive.driveAutentificacion(req,res);
}

exports.driveGuardarAutentificacion=function driveGuardarAutentificacion(req,res){
    drive.driveGuardarAutentificacion(req,res);
}

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
