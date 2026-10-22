const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// ==========================================
// USUARIOS CONECTADOS
// ==========================================

let usuariosConectados = [];

// ==========================================
// ENVIAR LISTA ACTUALIZADA DE USUARIOS
// ==========================================

function enviarUsuarios() {

    io.emit("usuarios-conectados", usuariosConectados);

}

// ==========================================
// CONEXIÓN DE USUARIO
// ==========================================

io.on("connection", (socket) => {

    console.log("=================================");
    console.log("Usuario conectado:", socket.id);
    console.log("=================================");


    // Agregar usuario
    usuariosConectados.push({

        id: socket.id,

        estado: "disponible"

    });


    enviarUsuarios();


    // Enviar lista directamente al nuevo usuario
    socket.emit(
        "lista-usuarios",
        usuariosConectados
    );


    // ==========================================
    // SOLICITAR USUARIOS
    // ==========================================

    socket.on("solicitar-usuarios", () => {

        socket.emit(
            "usuarios-actuales",
            usuariosConectados
        );

    });


    // ==========================================
    // MENSAJE DE PRUEBA
    // ==========================================

    socket.on("mensaje-prueba", (data) => {

        console.log(
            "Mensaje recibido:",
            data
        );


        io.emit(
            "mensaje-prueba",
            {

                mensaje: data.mensaje,

                usuario: socket.id

            }
        );

    });


    // ==========================================
    // INICIAR LLAMADA
    // ==========================================

    socket.on("offer", (data) => {

        console.log(
            "OFFER de",
            socket.id,
            "para",
            data.to
        );


        const usuarioOrigen =
            usuariosConectados.find(
                usuario =>
                    usuario.id === socket.id
            );


        const usuarioDestino =
            usuariosConectados.find(
                usuario =>
                    usuario.id === data.to
            );


        // ======================================
        // VALIDAR USUARIOS
        // ======================================

        if (!usuarioOrigen) {

            console.log(
                "Usuario origen no encontrado."
            );

            return;

        }


        if (!usuarioDestino) {

            console.log(
                "Usuario destino no encontrado."
            );

            return;

        }


        // ======================================
        // VALIDAR DISPONIBILIDAD
        // ======================================

        if (
            usuarioDestino.estado !==
            "disponible"
        ) {

            console.log(
                "El usuario está ocupado:",
                data.to
            );


            socket.emit(
                "usuario-ocupado"
            );

            return;

        }


        // ======================================
        // MARCAR AMBOS COMO CONECTANDO
        // ======================================

        usuarioOrigen.estado =
            "conectando";


        usuarioDestino.estado =
            "conectando";


        enviarUsuarios();


        // ======================================
        // ENVIAR OFFER
        // ======================================

        io.to(data.to).emit(
            "offer",
            {

                offer: data.offer,

                from: socket.id

            }
        );

    });


    // ==========================================
    // RESPUESTA DE LLAMADA
    // ==========================================

    socket.on("answer", (data) => {

        console.log(
            "ANSWER de",
            socket.id,
            "para",
            data.to
        );


        const usuarioOrigen =
            usuariosConectados.find(
                usuario =>
                    usuario.id === socket.id
            );


        const usuarioDestino =
            usuariosConectados.find(
                usuario =>
                    usuario.id === data.to
            );


        if (usuarioOrigen) {

            usuarioOrigen.estado =
                "ocupado";

        }


        if (usuarioDestino) {

            usuarioDestino.estado =
                "ocupado";

        }


        enviarUsuarios();


        io.to(data.to).emit(
            "answer",
            {

                answer: data.answer,

                from: socket.id

            }
        );

    });


    // ==========================================
    // ICE CANDIDATE
    // ==========================================

    socket.on(
        "ice-candidate",
        (data) => {

            io.to(data.to).emit(
                "ice-candidate",
                {

                    candidate:
                        data.candidate,

                    from:
                        socket.id

                }
            );

        }
    );


    // ==========================================
    // FINALIZAR LLAMADA
    // ==========================================

    socket.on(
        "finalizar-llamada",
        (data) => {

            console.log(
                "Usuario",
                socket.id,
                "finalizó la llamada con",
                data.to
            );


            const usuarioOrigen =
                usuariosConectados.find(
                    usuario =>
                        usuario.id === socket.id
                );


            const usuarioDestino =
                usuariosConectados.find(
                    usuario =>
                        usuario.id === data.to
                );


            // Volver a disponibles
            if (usuarioOrigen) {

                usuarioOrigen.estado =
                    "disponible";

            }


            if (usuarioDestino) {

                usuarioDestino.estado =
                    "disponible";

            }


            enviarUsuarios();


            // Avisar al otro usuario
            io.to(data.to).emit(
                "llamada-finalizada",
                {

                    from:
                        socket.id

                }
            );

        }
    );


    // ==========================================
    // DESCONEXIÓN
    // ==========================================

    socket.on("disconnect", () => {

        console.log(
            "Usuario desconectado:",
            socket.id
        );


        // Buscar usuario
        const usuario =
            usuariosConectados.find(
                item =>
                    item.id === socket.id
            );


        // ======================================
        // SI ESTABA EN LLAMADA
        // ======================================

        if (
            usuario &&
            usuario.estado ===
            "ocupado"
        ) {

            console.log(
                "Usuario ocupado se desconectó."
            );


            // Buscar compañero
            const otroUsuario =
                usuariosConectados.find(
                    item =>
                        item.id !== socket.id &&
                        item.estado === "ocupado"
                );


            if (otroUsuario) {

                otroUsuario.estado =
                    "disponible";


                io.to(otroUsuario.id).emit(
                    "llamada-finalizada",
                    {

                        from:
                            socket.id

                    }
                );

            }

        }


        // ======================================
        // ELIMINAR USUARIO
        // ======================================

        usuariosConectados =
            usuariosConectados.filter(
                usuario =>
                    usuario.id !== socket.id
            );


        enviarUsuarios();

    });

});


// ==========================================
// SERVIDOR
// ==========================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});