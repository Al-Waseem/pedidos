function Anyadir(){
    var html="<tr>";
    html+="<td><input type='text' size='10' /></td>";
    html+="<td><input type='email' size='25' /></td>";
    html+="<td><img src='/img/ok.png' onclick='Guardar(this)' /></td>";
    html+="<td><img src='/img/cancel.png' onclick='Cancelar(this)' /></td></tr>";
    $("#usuarios").append(html);
}

function Guardar(e){
    var inputs=$(e).parent().parent().find("input");
    var nombre=inputs[0].value;
    var email=inputs[1].value;
    var regex=/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/
    if(!email.match(regex)){
        alert("El email no es correcto");
        return;
    }
    $.post( "/addUser",
        { nombre: nombre, email: email },
        function(resp){
            if(resp=="error"){
                alert("No se ha podido guardar");
            }
            else{
                alert("Guardado correctamente");
                var id=resp;
                vistaNormal(e,id,0);
            }
        }
    );
}

function vistaNormal(e,id,modo){
    if(modo==0){
        var inputs=$(e).parent().parent().find("input");
        var nombre=inputs[0].value;
        var email=inputs[1].value;
    }
    else{
        var inputs=$(e).parent().parent().find("input");
        var nombre=inputs[0].value;
        var tds=$(e).parent().parent().find("td");
        var email=tds[1].innerHTML;
    }
    var html="<td>"+nombre+"</td>";
    html+="<td>"+email+"</td>";
    html+="<td><img src='/img/editar.png' title='Editar' onclick='Editar(this,\""+id+"\")' /></td>";
    html+="<td><img src='/img/basura.png' title='Borrar' onclick='Borrar(this,\""+id+"\")' /></td>";
    $(e).parent().parent().html(html);
}

function Editar(e,id){
    var tds=$(e).parent().parent().find("td");
    var nombre=tds[0].innerHTML;
    var email=tds[1].innerHTML;
    var html="<td><input type='text' size='10' value='"+nombre+"' /></td>";
    html+="<td>"+email+"</td>";
    html+="<td><img src='/img/ok.png' onclick='Actualizar(this,"+id+")' /></td>";
    html+="<td><img src='/img/cancel.png' onclick='vistaNormal(this,"+id+")' /></td>";
    $(e).parent().parent().html(html);
}

function Actualizar(e,id){
    var inputs=$(e).parent().parent().find("input");
    var nombre=inputs[0].value;
    $.post( "/updateUser",
        { nombre: nombre, id: id },
        function(resp){
            if(resp=="error"){
                alert("No se ha podido guardar");
            }
            else{
                alert("Modificado correctamente");
                vistaNormal(e,id,1);
            }
        }
    );
}

function Borrar(e,id,permiso){
    if(confirm("¿Seguro que lo deseas borrar?")){
        $.post( "/deleteUser",
            { id: id, permiso: permiso },
            function(resp){
                if(resp=="error"){
                    alert("No se ha podido borrar");
                }
                else{
                    alert("Borrado correctamente");
                    $(e).parent().parent().remove();
                }
            }
        );
    }
}

function Cancelar(e){
    $(e).parent().parent().remove();
}


function AbrirConfig(){
	$("#modal").show();
	$("#ventana").show();
}

function CerrarConf(){
	$("#modal").hide();
	$("#ventana").hide();
}

function AbrirCSV(id){
    $("#modal").show();
	$("#ventana2").show();
    $.post("/obtenerCSV",
        {
			id:id
		},
        function(resp){
            var aux=resp.split("\n");
            var cab="";
            var lineas="<table><tr><td>Producto</td><td>Precio Und</td><td>Cantidad</td><td>Desc</td><td>Iva</td><td>Total</td></tr>";
            for(var i=1;i<aux.length-1;i++){
                var l=aux[i].split(";");
                if(cab==""){
                    cab+="Cliente: "+l[12]+"<br />";
                    cab+="Contacto: "+l[5]+"<br />";
                    cab+="Mail: "+l[7]+"<br />";
                    cab+="Tel: "+l[6]+"<br />";
                    cab+="Direccion: "+l[8]+" "+l[9]+"<br />";
                }
                var cantidad=parseFloat(l[13]);
                var desc=parseFloat(l[14]);
                var iva=parseFloat(l[15]);
                var precio=parseFloat(l[20]);
                var total=(cantidad*precio);
                var pvp=total*(1-desc)*(1+iva);
                lineas+="<tr><td>"+l[17]+"</td><td>"+precio+"</td><td>"+cantidad+" "+l[19]+"</td><td>"+(desc*100)+"%</td><td>"+(iva*100)+"% </td><td>"+Math.round(pvp)+" Euros</td></tr>";

            }
            lineas+="</table>";
            cab+="<br />"+lineas;
            $("#csv").html(cab);
        }
    );
}

function CerrarCSV(){
	$("#modal").hide();
	$("#ventana2").hide();
}

function ComprobarCorreo(){
    var mail=$("#c_email").val();
    var regex=/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/
    if(!mail.match(regex)){
        alert("El formato del email no es correcto");
        return;
    }
    var pass=$("#c_pass").val();
    var host=$("#c_host").val();
    var port=$("#c_port").val();
    var tls=($("#c_tls").prop("checked"))?"1":"0";
    if(mail==""){
		alert("Debes indicar un email");
		return;
	}
	if(pass==""){
		alert("Debes indicar una contraseña");
		return;
	}
	if(host==""){
		alert("Debes indicar un servidor de correo");
		return;
	}
	if(port==""){
		alert("Debes indicar un puerto");
		return;
	}

    $.post("/comprobarMail",
        {
			mail: mail,
			pass: pass,
			host: host,
			port: port,
			tls:tls
		},
        function(resp){
            if(resp=="error"){
                alert("Mail no valido");
            }
            else{
                alert("Mail valido");
            }
        }
    );
}
