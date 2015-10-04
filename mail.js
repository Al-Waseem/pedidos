var fs=require("fs");
var Imap=require("imap");
var base64  = require('base64-stream');

/******************************MAIL***********************************************/

exports.leerMail=function leerMail(res,callback){

    if(!fs.existsSync("mail.json")){        
        res.redirect("/pedidos");
    }
    else{
        var content=fs.readFileSync('mail.json');
        var json=JSON.parse(content);        

        var imap = new Imap({
            user: json.mail,
            password: json.pass,
            host: json.host,
            port: json.port,
            tls: (json.tls=="1")
        });

        imap.once('ready', function() {
            imap.openBox('INBOX', false, function(err, box) {
                if (err) throw err;
                imap.search([ ['HEADER', 'SUBJECT', 'AppPedidos'],['UNSEEN'] ], function(err, results) {
                    if (err) throw err;
                    if(results.length==0){
                        console.log("No hay ningun mensaje");
                        res.redirect("/pedidos");
                        return;
                    }
                    var f = imap.fetch(results, {
                        struct: true,
                        bodies: '',
                        markSeen: true
                    });
                    f.on('message', function (msg, seqno) {
                        var dir_mail="";
                        var fecha="";
                        msg.on('body', function(stream, info) {
                            var buffer = '';
                            stream.on('data', function(chunk) {
                                buffer += chunk.toString('utf8');
                            });
                            stream.once('end', function() {
                                var header=Imap.parseHeader(buffer);
                                dir_mail=header["return-path"][0];
                                dir_mail=dir_mail.replace("<","").replace(">","");
                                fecha=header["date"][0];
                            });
                        });
                        msg.once('attributes', function(attrs) {
                            var adjuntos = buscarPartesAdjunto(attrs.struct);
                            for (var i = 0, len=adjuntos.length ; i < len; ++i) {
                                var adjunto = adjuntos[i];

                                  var f = imap.fetch(attrs.uid , { //do not use imap.seq.fetch here
                                      bodies: [adjunto.partID],
                                      struct: true
                                  });

                                  f.on('message', procesarAdjunto(adjunto,dir_mail,fecha,callback));
                              }
                         });
                         msg.once('end', function() {

                         });
                    });
                    f.once('error', function(err) {

                    });
                    f.once('end', function() {
                        imap.end();
                        res.redirect("/pedidos");
                    });
                });
            });
      });

      imap.once('error', function(err) {
        res.redirect("/pedidos");
      });

      imap.once('end', function() {
        res.redirect("/pedidos");
      });

      imap.connect();
  }
}

function buscarPartesAdjunto(struct, adjuntos) {
    adjuntos = adjuntos ||  [];
    for (var i = 0, len = struct.length, r; i < len; ++i) {
        if (Array.isArray(struct[i])) {
            buscarPartesAdjunto(struct[i], adjuntos);
        }
        else {
            if (struct[i].disposition && ['INLINE', 'ATTACHMENT'].indexOf(struct[i].disposition.type) > -1) {
                adjuntos.push(struct[i]);
            }
        }
    }
    return adjuntos;
}

function procesarAdjunto(adjunto,dir_mail,fecha,callback) {
    var encoding = adjunto.encoding;

    return function (msg, seqno) {
        var texto="";
        var csv="";
        msg.on('body', function(stream, info) {

            stream.on('data', function(chunk) {
                texto+=chunk;
            });

            stream.on('end', function() {
                var buff = new Buffer(texto, 'base64')
                csv = buff.toString();
            });

        });
        msg.once('end', function() {
            callback(dir_mail,fecha,csv);
        });
    };
}

exports.comprobarMail=function comprobarMail(req,res){
	var mail=req.body.mail;
	var pass=req.body.pass;
	var host=req.body.host;
	var port=req.body.port;
	var tls=(req.body.tls=="1");
	
	
	
	//console.log(host+" --- "+port+" --- "+mail+" -- "+pass+" -- "+tls+" --- "+req.body.port);
	
	var obj={host:host, port:port, mail:mail, pass:pass, tls:tls }	
	
	var imap = new Imap({
        user: mail,
        password: pass,
        host: host,
        port: port,
        tls: req.body.tls
    });
    
	imap.once('ready', function() {
        imap.openBox('INBOX', false, function(err, box) {
			if(!err){
				responderComprobacionMail(res,"ok",obj);
			}
			else{
				responderComprobacionMail(res,"error",obj);
				console.log(err+""+box);
			}
		});
	});

	imap.once('error', function(err) {
		responderComprobacionMail(res,"error");
	});

	imap.once('end', function() {
		//responderComprobacionMail(res,"error");
	});

	imap.connect();
}

function responderComprobacionMail(res,resp,obj){
	console.log(resp);
	
	if(resp=="ok"){
	
		fs.writeFile("mail.json", JSON.stringify(obj), function(err) {
			if(err) {
			  console.log(err);
			} else {
			  console.log("JSON saved to ");
			}
		});
		
		var obj2={mail:obj.mail};
		
		fs.writeFile("AppPedidos/conf.json", JSON.stringify(obj2), function(err) {
			if(err) {
			  console.log(err);
			} else {
			  console.log("JSON saved to ");
			}
		});
	 
	}
	
	res.send(resp);
}
