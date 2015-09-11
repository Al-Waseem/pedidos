var fs=require("fs");
var google=require("googleapis");
var googleAuth=require("google-auth-library");

var URI_DRIVE = ['https://www.googleapis.com/auth/drive'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH_DRIVE = TOKEN_DIR + 'drive-api.json';
console.log(TOKEN_PATH_DRIVE);

var FOLDER="AppPedidos";

global_parent_folder_drive=null;

exports.isConnected=function isConnected(){
    return fs.existsSync(TOKEN_PATH_DRIVE);
}

/***AUTENTIFICACION DRIVE*************************************************************/

exports.driveAutentificacion=function driveAutentificacion(req,res){
	oauth2Client=getOauth2Client();
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: URI_DRIVE
    });
    res.statusCode = 302;
    res.setHeader("Location", authUrl);
    res.end();
}

exports.driveGuardarAutentificacion=function driveGuardarAutentificacion(req,res){
    var code=req.query.code;
    oauth2Client=getOauth2Client();
    oauth2Client.getToken(code, function(err, token) {
        oauth2Client.credentials = token;
        try {
          fs.mkdirSync(TOKEN_DIR);
        } catch (err) {
          if (err.code != 'EEXIST') {
            throw err;
          }
        }
        fs.writeFile(TOKEN_PATH_DRIVE, JSON.stringify(token));
        console.log('Token stored to ' + TOKEN_PATH_DRIVE);
        global_authDrive=true;
        res.redirect("/");
    });
}

function getOauth2Client(){
    var content=fs.readFileSync('client_secret.json');    
    var json=JSON.parse(content);
    var clientId=json.web.client_id;
    var clientSecret=json.web.client_secret;
    var redirectUrl=json.web.redirect_uris[0];
    /*console.log(clientId);
    console.log(clientSecret);
    console.log(redirectUrl);*/
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    return oauth2Client;
}

/*******************DIRECTORIO******************************************/

exports.comprobarDirectorioDrive=function comprobarDirectorioDrive(){
    console.log("COMPROBAR DIRECTORIO");
    var oauth2Client=getOauth2Client();
    var token=fs.readFileSync(TOKEN_PATH_DRIVE);
    oauth2Client.credentials = JSON.parse(token);
    
    var items=[];
    var gDrive = google.drive('v2');
    gDrive.files.list(
        {
			q: " title='"+FOLDER+"' and mimeType='application/vnd.google-apps.folder' ",
            auth: oauth2Client
        },
        function(err, response) {			
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            var items=response.items;
            if(items.length==0){
                crearDirectorioDrive();
            }
            else{
                var id=items[0].id;
                global_parent_folder_drive=id;
            }
        }
    );
}

function crearDirectorioDrive(){
    console.log("CREAR DIRECTORIO");
    var oauth2Client=getOauth2Client();
    var token=fs.readFileSync(TOKEN_PATH_DRIVE);
    oauth2Client.credentials = JSON.parse(token);

    var gDrive=google.drive('v2');
    gDrive.files.insert(
		{
			resource: {
				title: FOLDER,
				mimeType: 'application/vnd.google-apps.folder',
				parents: []
			},
			auth: oauth2Client
        },
        function(err, response) {
            if(!err){
                global_parent_folder_drive=response.id;                
            }
        }
    );
}


/**************************COMPARTIR************************************/

exports.agregarUsuarioCompartido=function agregarUsuarioCompartido(email,id,callback){
	if(global_parent_folder_drive!=null){
		var oauth2Client=getOauth2Client();
		var token=fs.readFileSync(TOKEN_PATH_DRIVE);
		oauth2Client.credentials = JSON.parse(token);
		
		var gDrive=google.drive('v2');
		gDrive.permissions.insert(
			{
				fileId:	global_parent_folder_drive,		
				resource: {
					"value": email,
					"type": "user",
					"role": "writer"
				},
				auth: oauth2Client
			},
			function(err, response) {
				if(!err){
					var permiso=response.id;					
					callback(permiso,id);        
				}
			}
		);
	}
}

exports.eliminarUsuarioCompartido=function eliminarUsuarioCompartido(permiso){
	if(global_parent_folder_drive!=null){
		var oauth2Client=getOauth2Client();
		var token=fs.readFileSync(TOKEN_PATH_DRIVE);
		oauth2Client.credentials = JSON.parse(token);
		
		var gDrive=google.drive('v2');
		gDrive.permissions.insert(
			{
				fileId:	global_parent_folder_drive,		
				permissionId:permiso,
				auth: oauth2Client
			},
			function(err, response) {
				console.log(response);				
			}
		);
	}
}

