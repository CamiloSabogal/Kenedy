const socket = io();


// =====================================================
// ELEMENTOS DEL HTML
// =====================================================

const videoLocal =
    document.getElementById("videoLocal");

const videoRemoto =
    document.getElementById("videoRemoto");

const mensajeLocal =
    document.getElementById("mensajeLocal");

const mensajeRemoto =
    document.getElementById("mensajeRemoto");

const btnCamara =
    document.getElementById("btnCamara");

const btnWebRTC =
    document.getElementById("btnWebRTC");

const btnFinalizar =
    document.getElementById("btnFinalizar");

const btnMicrofono =
    document.getElementById("btnMicrofono");

const btnVideo =
    document.getElementById("btnVideo");

const btnPrueba =
    document.getElementById("btnPrueba");

const mensaje =
    document.getElementById("mensaje");

const listaUsuarios =
    document.getElementById("listaUsuarios");


// =====================================================
// VARIABLES
// =====================================================

let streamLocal = null;

let peerConnection = null;

let usuarioRemoto = null;

let candidatosPendientes = [];

let usuariosActuales = [];

let estadoLlamada =
    "disponible";

let microfonoActivo =
    true;

let camaraActiva =
    true;


// =====================================================
// CONFIGURACIÓN WEBRTC
// =====================================================

const configuracionRTC = {

    iceServers: [

        {
            urls:
                "stun:stun.l.google.com:19302"
        }

    ]

};


// =====================================================
// ACTUALIZAR ESTADO
// =====================================================

function actualizarEstado(
    texto,
    tipo = "disponible"
) {

    mensaje.textContent =
        texto;

    mensaje.className =
        "";

    mensaje.classList.add(
        `estado-${tipo}`
    );

}


// =====================================================
// CONTROL DE BOTONES
// =====================================================

function actualizarBotones(
    estado
) {

    estadoLlamada =
        estado;


    switch (estado) {

        // -----------------------------------------
        // DISPONIBLE
        // -----------------------------------------

        case "disponible":

            btnCamara.disabled =
                false;

            btnWebRTC.disabled =
                false;

            btnFinalizar.disabled =
                true;

            btnMicrofono.disabled =
                true;

            btnVideo.disabled =
                true;

            break;


        // -----------------------------------------
        // CONECTANDO
        // -----------------------------------------

        case "conectando":

            btnCamara.disabled =
                true;

            btnWebRTC.disabled =
                true;

            btnFinalizar.disabled =
                false;

            btnMicrofono.disabled =
                true;

            btnVideo.disabled =
                true;

            break;


        // -----------------------------------------
        // LLAMADA
        // -----------------------------------------

        case "llamada":

            btnCamara.disabled =
                true;

            btnWebRTC.disabled =
                true;

            btnFinalizar.disabled =
                false;

            btnMicrofono.disabled =
                false;

            btnVideo.disabled =
                false;

            break;


        // -----------------------------------------
        // FINALIZADA
        // -----------------------------------------

        case "finalizada":

            btnCamara.disabled =
                false;

            btnWebRTC.disabled =
                false;

            btnFinalizar.disabled =
                true;

            btnMicrofono.disabled =
                true;

            btnVideo.disabled =
                true;

            break;


        // -----------------------------------------
        // ERROR
        // -----------------------------------------

        case "error":

            btnCamara.disabled =
                false;

            btnWebRTC.disabled =
                false;

            btnFinalizar.disabled =
                true;

            btnMicrofono.disabled =
                true;

            btnVideo.disabled =
                true;

            break;

    }

}


// =====================================================
// MOSTRAR USUARIOS
// =====================================================

function mostrarUsuarios(
    usuarios
) {

    usuariosActuales =
        usuarios;


    listaUsuarios.innerHTML =
        "";


    if (
        !usuarios ||
        usuarios.length === 0
    ) {

        const mensajeVacio =
            document.createElement(
                "p"
            );


        mensajeVacio.className =
            "sin-usuarios";


        mensajeVacio.textContent =
            "No hay usuarios conectados.";


        listaUsuarios.appendChild(
            mensajeVacio
        );


        return;

    }


    usuarios.forEach(
        (usuario) => {

            const fila =
                document.createElement(
                    "div"
                );


            fila.className =
                "lista-usuario";


            // --------------------------------------
            // NOMBRE
            // --------------------------------------

            const nombre =
                document.createElement(
                    "span"
                );


            nombre.className =
                "usuario-nombre";


            if (
                usuario.id ===
                socket.id
            ) {

                nombre.textContent =
                    "👤 Tú";

            } else {

                nombre.textContent =
                    "👤 Usuario " +
                    usuario.id.substring(
                        0,
                        6
                    );

            }


            // --------------------------------------
            // ESTADO
            // --------------------------------------

            const estado =
                document.createElement(
                    "span"
                );


            estado.className =
                "usuario-estado";


            if (
                usuario.estado ===
                "disponible"
            ) {

                estado.textContent =
                    "🟢 Disponible";

                estado.classList.add(
                    "estado-disponible-usuario"
                );

            }


            else if (
                usuario.estado ===
                "conectando"
            ) {

                estado.textContent =
                    "🟡 Conectando...";

                estado.classList.add(
                    "estado-conectando-usuario"
                );

            }


            else if (
                usuario.estado ===
                "ocupado"
            ) {

                estado.textContent =
                    "🔴 Ocupado";

                estado.classList.add(
                    "estado-ocupado-usuario"
                );

            }


            fila.appendChild(
                nombre
            );


            fila.appendChild(
                estado
            );


            listaUsuarios.appendChild(
                fila
            );

        }
    );

}


// =====================================================
// CONEXIÓN AL SERVIDOR
// =====================================================

socket.on(
    "connect",
    () => {

        console.log(
            "Conectado al servidor:",
            socket.id
        );


        actualizarEstado(
            "🟢 Sistema disponible.",
            "disponible"
        );


        actualizarBotones(
            "disponible"
        );


        socket.emit(
            "solicitar-usuarios"
        );

    }
);


// =====================================================
// USUARIOS CONECTADOS
// =====================================================

socket.on(
    "usuarios-conectados",
    (usuarios) => {

        console.log(
            "Usuarios conectados:",
            usuarios
        );


        mostrarUsuarios(
            usuarios
        );

    }
);


// =====================================================
// LISTA DE USUARIOS
// =====================================================

socket.on(
    "lista-usuarios",
    (usuarios) => {

        mostrarUsuarios(
            usuarios
        );

    }
);


socket.on(
    "usuarios-actuales",
    (usuarios) => {

        mostrarUsuarios(
            usuarios
        );

    }
);


// =====================================================
// DESCONEXIÓN
// =====================================================

socket.on(
    "disconnect",
    () => {

        actualizarEstado(
            "🔴 Desconectado del servidor.",
            "error"
        );


        actualizarBotones(
            "error"
        );

    }
);


// =====================================================
// CREAR CONEXIÓN WEBRTC
// =====================================================

function crearConexion() {

    console.log(
        "Creando conexión WebRTC..."
    );


    peerConnection =
        new RTCPeerConnection(
            configuracionRTC
        );


    // =================================================
    // RECIBIR STREAM REMOTO
    // =================================================

    peerConnection.ontrack =
        (event) => {

            console.log(
                "Stream remoto recibido."
            );


            videoRemoto.srcObject =
                event.streams[0];


            mensajeRemoto.style.display =
                "none";

        };


    // =================================================
    // ICE CANDIDATE
    // =================================================

    peerConnection.onicecandidate =
        (event) => {

            if (
                event.candidate &&
                usuarioRemoto
            ) {

                socket.emit(
                    "ice-candidate",
                    {

                        to:
                            usuarioRemoto,

                        candidate:
                            event.candidate

                    }
                );

            }

        };


    // =================================================
    // ESTADO DE CONEXIÓN
    // =================================================

    peerConnection.onconnectionstatechange =
        () => {

            const estado =
                peerConnection.connectionState;


            console.log(
                "Estado WebRTC:",
                estado
            );


            // -----------------------------------------
            // CONECTANDO
            // -----------------------------------------

            if (
                estado ===
                "connecting"
            ) {

                actualizarEstado(
                    "🟡 Conectando con el otro usuario...",
                    "conectando"
                );


                actualizarBotones(
                    "conectando"
                );

            }


            // -----------------------------------------
            // CONECTADO
            // -----------------------------------------

            if (
                estado ===
                "connected"
            ) {

                actualizarEstado(
                    "🟢 Llamada conectada correctamente.",
                    "llamada"
                );


                actualizarBotones(
                    "llamada"
                );

            }


            // -----------------------------------------
            // DESCONECTADO
            // -----------------------------------------

            if (
                estado ===
                "disconnected"
            ) {

                actualizarEstado(
                    "🔴 Conexión perdida.",
                    "error"
                );


                actualizarBotones(
                    "error"
                );

            }


            // -----------------------------------------
            // FALLA
            // -----------------------------------------

            if (
                estado ===
                "failed"
            ) {

                actualizarEstado(
                    "🔴 Error en la conexión WebRTC.",
                    "error"
                );


                actualizarBotones(
                    "error"
                );

            }

        };


    // =================================================
    // ICE CONNECTION
    // =================================================

    peerConnection.oniceconnectionstatechange =
        () => {

            console.log(
                "Estado ICE:",
                peerConnection.iceConnectionState
            );

        };


    // =================================================
    // DATA CHANNEL
    // =================================================

    peerConnection.ondatachannel =
        (event) => {

            const canal =
                event.channel;


            canal.onopen =
                () => {

                    console.log(
                        "Canal de datos abierto."
                    );

                };


            canal.onmessage =
                (event) => {

                    console.log(
                        "Mensaje recibido:",
                        event.data
                    );

                };

        };


    return peerConnection;

}


// =====================================================
// ACTIVAR CÁMARA Y MICRÓFONO
// =====================================================

btnCamara.addEventListener(
    "click",
    async () => {

        try {

            actualizarEstado(
                "🟡 Solicitando acceso a cámara y micrófono...",
                "conectando"
            );


            const stream =
                await navigator
                    .mediaDevices
                    .getUserMedia({

                        video: true,

                        audio: true

                    });


            streamLocal =
                stream;


            videoLocal.srcObject =
                streamLocal;


            mensajeLocal.style.display =
                "none";


            microfonoActivo =
                true;

            camaraActiva =
                true;


            btnMicrofono.textContent =
                "🎤 Micrófono";


            btnVideo.textContent =
                "📹 Cámara";


            actualizarEstado(
                "🟢 Cámara y micrófono activados.",
                "disponible"
            );


            actualizarBotones(
                "disponible"
            );

        }

        catch (error) {

            console.error(
                "Error al acceder a dispositivos:",
                error
            );


            actualizarEstado(
                "⚠️ No se pudo acceder a cámara/micrófono.",
                "error"
            );


            actualizarBotones(
                "disponible"
            );

        }

    }
);


// =====================================================
// INICIAR LLAMADA
// =====================================================

btnWebRTC.addEventListener(
    "click",
    async () => {

        try {

            actualizarEstado(
                "🟡 Buscando usuario disponible...",
                "conectando"
            );


            actualizarBotones(
                "conectando"
            );


            const usuarios =
                await obtenerUsuarios();


            // -----------------------------------------
            // BUSCAR USUARIO DISPONIBLE
            // -----------------------------------------

            const disponibles =
                usuarios.filter(
                    usuario =>

                        usuario.id !==
                        socket.id &&

                        usuario.estado ===
                        "disponible"
                );


            if (
                disponibles.length ===
                0
            ) {

                actualizarEstado(
                    "⚠️ No hay usuarios disponibles para llamar.",
                    "error"
                );


                actualizarBotones(
                    "disponible"
                );


                return;

            }


            usuarioRemoto =
                disponibles[0].id;


            console.log(
                "Llamando a:",
                usuarioRemoto
            );


            // -----------------------------------------
            // CREAR CONEXIÓN
            // -----------------------------------------

            crearConexion();


            // -----------------------------------------
            // AGREGAR STREAM
            // -----------------------------------------

            if (
                streamLocal
            ) {

                streamLocal
                    .getTracks()
                    .forEach(
                        track => {

                            peerConnection
                                .addTrack(
                                    track,
                                    streamLocal
                                );

                        }
                    );

            }


            // -----------------------------------------
            // DATA CHANNEL
            // -----------------------------------------

            const canal =
                peerConnection
                    .createDataChannel(
                        "chat"
                    );


            canal.onopen =
                () => {

                    console.log(
                        "Canal de datos abierto."
                    );

                };


            // -----------------------------------------
            // CREAR OFFER
            // -----------------------------------------

            const offer =
                await peerConnection
                    .createOffer();


            await peerConnection
                .setLocalDescription(
                    offer
                );


            // -----------------------------------------
            // ENVIAR OFFER
            // -----------------------------------------

            socket.emit(
                "offer",
                {

                    to:
                        usuarioRemoto,

                    offer:
                        offer

                }
            );


            actualizarEstado(
                "🟡 Oferta enviada. Esperando respuesta...",
                "conectando"
            );

        }

        catch (error) {

            console.error(
                "Error iniciando llamada:",
                error
            );


            actualizarEstado(
                "🔴 Error al iniciar la llamada.",
                "error"
            );


            actualizarBotones(
                "disponible"
            );

        }

    }
);


// =====================================================
// USUARIO OCUPADO
// =====================================================

socket.on(
    "usuario-ocupado",
    () => {

        console.log(
            "El usuario está ocupado."
        );


        cerrarConexion();


        actualizarEstado(
            "⚠️ El usuario seleccionado está ocupado.",
            "error"
        );


        actualizarBotones(
            "disponible"
        );

    }
);


// =====================================================
// RECIBIR OFFER
// =====================================================

socket.on(
    "offer",
    async (data) => {

        try {

            console.log(
                "Oferta recibida de:",
                data.from
            );


            usuarioRemoto =
                data.from;


            actualizarEstado(
                "🟡 Llamada entrante. Estableciendo conexión...",
                "conectando"
            );


            actualizarBotones(
                "conectando"
            );


            crearConexion();


            // -----------------------------------------
            // AGREGAR STREAM
            // -----------------------------------------

            if (
                streamLocal
            ) {

                streamLocal
                    .getTracks()
                    .forEach(
                        track => {

                            peerConnection
                                .addTrack(
                                    track,
                                    streamLocal
                                );

                        }
                    );

            }


            // -----------------------------------------
            // REMOTE DESCRIPTION
            // -----------------------------------------

            await peerConnection
                .setRemoteDescription(
                    new RTCSessionDescription(
                        data.offer
                    )
                );


            // -----------------------------------------
            // ICE PENDIENTES
            // -----------------------------------------

            await procesarCandidatosPendientes();


            // -----------------------------------------
            // ANSWER
            // -----------------------------------------

            const answer =
                await peerConnection
                    .createAnswer();


            await peerConnection
                .setLocalDescription(
                    answer
                );


            // -----------------------------------------
            // ENVIAR ANSWER
            // -----------------------------------------

            socket.emit(
                "answer",
                {

                    to:
                        data.from,

                    answer:
                        answer

                }
            );


            actualizarEstado(
                "🟡 Respuesta enviada. Conectando...",
                "conectando"
            );

        }

        catch (error) {

            console.error(
                "Error aceptando llamada:",
                error
            );


            actualizarEstado(
                "🔴 Error aceptando la llamada.",
                "error"
            );


            actualizarBotones(
                "disponible"
            );

        }

    }
);


// =====================================================
// RECIBIR ANSWER
// =====================================================

socket.on(
    "answer",
    async (data) => {

        try {

            if (
                !peerConnection
            ) {

                return;

            }


            if (
                peerConnection.signalingState !==
                "have-local-offer"
            ) {

                console.log(
                    "Answer ignorada. Estado:",
                    peerConnection.signalingState
                );

                return;

            }


            await peerConnection
                .setRemoteDescription(
                    new RTCSessionDescription(
                        data.answer
                    )
                );


            await procesarCandidatosPendientes();

        }

        catch (error) {

            console.error(
                "Error procesando answer:",
                error
            );

        }

    }
);


// =====================================================
// RECIBIR ICE CANDIDATE
// =====================================================

socket.on(
    "ice-candidate",
    async (data) => {

        try {

            if (
                !peerConnection ||
                !peerConnection.remoteDescription
            ) {

                candidatosPendientes.push(
                    data.candidate
                );

                return;

            }


            await peerConnection
                .addIceCandidate(
                    new RTCIceCandidate(
                        data.candidate
                    )
                );

        }

        catch (error) {

            console.error(
                "Error agregando ICE:",
                error
            );

        }

    }
);


// =====================================================
// PROCESAR ICE PENDIENTES
// =====================================================

async function procesarCandidatosPendientes() {

    if (
        !peerConnection
    ) {

        return;

    }


    for (
        const candidate
        of candidatosPendientes
    ) {

        try {

            await peerConnection
                .addIceCandidate(
                    new RTCIceCandidate(
                        candidate
                    )
                );

        }

        catch (error) {

            console.error(
                "Error procesando ICE pendiente:",
                error
            );

        }

    }


    candidatosPendientes =
        [];

}


// =====================================================
// OBTENER USUARIOS
// =====================================================

function obtenerUsuarios() {

    return new Promise(
        (resolve) => {

            socket.emit(
                "solicitar-usuarios"
            );


            socket.once(
                "usuarios-actuales",
                (usuarios) => {

                    resolve(
                        usuarios
                    );

                }
            );

        }
    );

}


// =====================================================
// FINALIZAR LLAMADA
// =====================================================

btnFinalizar.addEventListener(
    "click",
    () => {

        console.log(
            "Finalizando llamada..."
        );


        if (
            usuarioRemoto
        ) {

            socket.emit(
                "finalizar-llamada",
                {

                    to:
                        usuarioRemoto

                }
            );

        }


        cerrarConexion();


        actualizarEstado(
            "⚫ Llamada finalizada.",
            "finalizada"
        );


        actualizarBotones(
            "finalizada"
        );

    }
);


// =====================================================
// LLAMADA FINALIZADA REMOTAMENTE
// =====================================================

socket.on(
    "llamada-finalizada",
    () => {

        console.log(
            "El otro usuario finalizó la llamada."
        );


        cerrarConexion();


        actualizarEstado(
            "⚫ El otro usuario finalizó la llamada.",
            "finalizada"
        );


        actualizarBotones(
            "finalizada"
        );

    }
);


// =====================================================
// CERRAR CONEXIÓN
// =====================================================

function cerrarConexion() {

    console.log(
        "Cerrando conexión..."
    );


    if (
        peerConnection
    ) {

        peerConnection.close();

        peerConnection =
            null;

    }


    if (
        streamLocal
    ) {

        streamLocal
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );

        streamLocal =
            null;

    }


    videoLocal.srcObject =
        null;

    videoRemoto.srcObject =
        null;


    mensajeLocal.style.display =
        "flex";

    mensajeRemoto.style.display =
        "flex";


    mensajeLocal.querySelector(
        "span"
    ).textContent =
        "Cámara no disponible";


    mensajeRemoto.querySelector(
        "span"
    ).textContent =
        "Esperando conexión...";


    usuarioRemoto =
        null;


    candidatosPendientes =
        [];


    microfonoActivo =
        true;


    camaraActiva =
        true;


    btnMicrofono.textContent =
        "🎤 Micrófono";


    btnVideo.textContent =
        "📹 Cámara";

}


// =====================================================
// CONTROL DEL MICRÓFONO
// =====================================================

btnMicrofono.addEventListener(
    "click",
    () => {

        if (
            !streamLocal
        ) {

            console.log(
                "No existe stream local."
            );

            return;

        }


        const pistasAudio =
            streamLocal.getAudioTracks();


        if (
            pistasAudio.length ===
            0
        ) {

            console.log(
                "No existe pista de audio."
            );

            return;

        }


        microfonoActivo =
            !microfonoActivo;


        pistasAudio.forEach(
            track => {

                track.enabled =
                    microfonoActivo;

            }
        );


        if (
            microfonoActivo
        ) {

            btnMicrofono.textContent =
                "🎤 Micrófono";

        } else {

            btnMicrofono.textContent =
                "🔇 Micrófono silenciado";

        }

    }
);


// =====================================================
// CONTROL DE CÁMARA
// =====================================================

btnVideo.addEventListener(
    "click",
    () => {

        if (
            !streamLocal
        ) {

            console.log(
                "No existe stream local."
            );

            return;

        }


        const pistasVideo =
            streamLocal.getVideoTracks();


        if (
            pistasVideo.length ===
            0
        ) {

            console.log(
                "No existe pista de video."
            );

            return;

        }


        camaraActiva =
            !camaraActiva;


        pistasVideo.forEach(
            track => {

                track.enabled =
                    camaraActiva;

            }
        );


        if (
            camaraActiva
        ) {

            btnVideo.textContent =
                "📹 Cámara";

        } else {

            btnVideo.textContent =
                "🚫 Cámara apagada";

        }

    }
);


// =====================================================
// PRUEBA DE SEÑALIZACIÓN
// =====================================================

btnPrueba.addEventListener(
    "click",
    () => {

        socket.emit(
            "mensaje-prueba",
            {

                mensaje:
                    "Hola desde este navegador"

            }
        );

    }
);


// =====================================================
// RECIBIR MENSAJE DE PRUEBA
// =====================================================

socket.on(
    "mensaje-prueba",
    (data) => {

        console.log(
            "Mensaje recibido:",
            data
        );

    }
);


// =====================================================
// ESTADO INICIAL
// =====================================================

actualizarBotones(
    "disponible"
);


actualizarEstado(
    "🟢 Sistema disponible.",
    "disponible"
);