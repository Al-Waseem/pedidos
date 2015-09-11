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
