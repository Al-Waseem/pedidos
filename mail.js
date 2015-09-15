var fs=require("fs");
var Imap=require("imap");
var base64  = require('base64-stream');

/******************************MAIL***********************************************/

exports.leerMail=function leerMail(res,callback){

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

  });

  imap.once('end', function() {

  });

  imap.connect();
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
