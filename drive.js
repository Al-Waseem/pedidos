var fs=require("fs");
var google=require("googleapis");
var googleAuth=require("google-auth-library");

var URI_DRIVE = ['https://www.googleapis.com/auth/drive'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH_DRIVE = TOKEN_DIR + 'drive-api.json';
var folder="Pedidos";

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
        res.render("index.ejs",{title:"Pedidos",conectado:global_authDrive});
    });
}

function getOauth2Client(){
    var content=fs.readFileSync('client_secret.json');
    var json=JSON.parse(content);
    var clientId=json.web.client_id;
    var clientSecret=json.web.client_secret;
    var redirectUrl=json.web.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    return oauth2Client;
}
