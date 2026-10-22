// ============================================================
// SISTEMA DE VIDEOLLAMADA WEBRTC
// INSTITUCIÓN EDUCATIVA JOHN F. KENNEDY
// Puerto Boyacá - Boyacá
// ============================================================


// ============================================================
// CONEXIÓN CON SOCKET.IO
// ============================================================

const socket = io();


// ============================================================
// ELEMENTOS DEL DOM
// ============================================================

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


// ============================================================
// VARIABLES PRINCIPALES
// ============================================================

let streamLocal = null;

let peerConnection = null;

let usuarioRemoto = null;

let candidatosPendientes = [];

let usuariosActuales = [];

let estadoLlamada = "disponible";

let microfonoActivo = true;

let camaraActiva = true;

let rolLlamada = null;


// ============================================================
// CONFIGURACIÓN WEBRTC
// ============================================================

const configuracionRTC = {

    iceServers: [

        {
            urls: "stun:stun.l.google.com:19302"
        },

        {
            urls: "stun:stun1.l.google.com:19302"
        }

    ]

};


// ============================================================
// ACTUALIZAR ESTADO GENERAL
// ============================================================

function actualizarEstado(
    texto,
    estado = "disponible"
) {

    estadoLlamada = estado;

    if (mensaje) {

        mensaje.textContent = texto;

    }

    actualizarModoVisual();

    actualizarBotones(estado);

}


// ============================================================
// ACTUALIZAR MODO VISUAL
// ============================================================

function actualizarModoVisual() {

    const contenedor =
        document.querySelector(".contenedor");

    if (!contenedor) {

        return;

    }

    contenedor.classList.remove(
        "llamada-activa",
        "llamada-conectando"
    );


    if (
        estadoLlamada === "conectando"
    ) {

        contenedor.classList.add(
            "llamada-conectando"
        );

    }


    if (
        estadoLlamada === "ocupado"
    ) {

        contenedor.classList.add(
            "llamada-activa"
        );

    }

}


// ============================================================
// ACTUALIZAR BOTONES
// ============================================================

function actualizarBotones(
    estado
) {

    if (!btnWebRTC) {

        return;

    }


    if (
        estado === "disponible"
    ) {

        btnWebRTC.disabled = false;

        btnWebRTC.textContent =
            "📞 Iniciar llamada";

    }


    if (
        estado === "conectando"
    ) {

        btnWebRTC.disabled = true;

        btnWebRTC.textContent =
            "⏳ Conectando...";

    }


    if (
        estado === "ocupado"
    ) {

        btnWebRTC.disabled = true;

        btnWebRTC.textContent =
            "📞 Llamada en curso";

    }


    if (
        estado === "error"
    ) {

        btnWebRTC.disabled = false;

        btnWebRTC.textContent =
            "📞 Intentar nuevamente";

    }


    if (btnFinalizar) {

        btnFinalizar.disabled =
            estado === "disponible";

    }


    if (btnMicrofono) {

        btnMicrofono.disabled =
            streamLocal === null;

    }


    if (btnVideo) {

        btnVideo.disabled =
            streamLocal === null;

    }

}


// ============================================================
// OBTENER NOMBRE DEL USUARIO
// ============================================================

function obtenerNombreUsuario(
    usuario,
    indice
) {

    if (
        usuario.id === socket.id
    ) {

        return "👤 Tú";

    }

    return "👤 Usuario " +
        (indice + 1);

}


// ============================================================
// OBTENER ROL DEL USUARIO
// ============================================================

function obtenerRolUsuario(
    usuarioId
) {

    if (
        usuarioId === socket.id
    ) {

        return rolLlamada;

    }

    return null;

}


// ============================================================
// ACTUALIZAR ETIQUETAS DE LLAMADA
// ============================================================

function actualizarEtiquetasLlamada() {

    if (!mensajeLocal) {

        return;

    }

    if (!mensajeRemoto) {

        return;

    }


    if (
        rolLlamada === "emisor"
    ) {

        mensajeLocal.textContent =
            "Tú";

        mensajeRemoto.textContent =
            "Usuario remoto";

    }


    else if (
        rolLlamada === "receptor"
    ) {

        mensajeLocal.textContent =
            "Tú";

        mensajeRemoto.textContent =
            "Usuario remoto";

    }


    else {

        mensajeLocal.textContent =
            "Cámara local";

        mensajeRemoto.textContent =
            "Esperando conexión";

    }

}


// ============================================================
// MOSTRAR USUARIOS CONECTADOS
// ============================================================

function mostrarUsuarios(
    usuarios
) {

    usuariosActuales =
        usuarios || [];


    if (!listaUsuarios) {

        return;

    }


    listaUsuarios.innerHTML = "";


    if (
        usuariosActuales.length === 0
    ) {

        const elemento =
            document.createElement("div");

        elemento.className =
            "usuario-item";

        elemento.textContent =
            "No hay usuarios conectados.";

        listaUsuarios.appendChild(
            elemento
        );

        return;

    }


    usuariosActuales.forEach(
        (usuario, indice) => {

            const elemento =
                document.createElement("div");

            elemento.className =
                "usuario-item";


            const nombre =
                obtenerNombreUsuario(
                    usuario,
                    indice
                );


            const estado =
                usuario.estado ||
                "disponible";


            let textoEstado =
                "Disponible";


            if (
                estado === "conectando"
            ) {

                textoEstado =
                    "Conectando...";

            }


            if (
                estado === "ocupado"
            ) {

                textoEstado =
                    "En llamada";

            }


            if (
                usuario.id === socket.id
            ) {

                textoEstado =
                    "Disponible (Tú)";

            }


            elemento.innerHTML = `
                <span class="usuario-nombre">
                    ${nombre}
                </span>

                <span class="usuario-estado">
                    ${textoEstado}
                </span>
            `;


            listaUsuarios.appendChild(
                elemento
            );

        }
    );

}


// ============================================================
// CONEXIÓN DEL SOCKET
// ============================================================

socket.on(
    "connect",
    () => {

        console.log(
            "Conectado al servidor:",
            socket.id
        );


        actualizarEstado(
            "🟢 Sistema disponible",
            "disponible"
        );


        socket.emit(
            "solicitar-usuarios"
        );

    }
);


// ============================================================
// USUARIOS CONECTADOS
// ============================================================

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


// ============================================================
// LISTA DE USUARIOS
// ============================================================

socket.on(
    "lista-usuarios",
    (usuarios) => {

        console.log(
            "Lista de usuarios:",
            usuarios
        );

        mostrarUsuarios(
            usuarios
        );

    }
);


// ============================================================
// USUARIOS ACTUALES
// ============================================================

socket.on(
    "usuarios-actuales",
    (usuarios) => {

        console.log(
            "Usuarios actuales:",
            usuarios
        );

        mostrarUsuarios(
            usuarios
        );

    }
);


// ============================================================
// USUARIO DESCONECTADO
// ============================================================

socket.on(
    "usuario-desconectado",
    (usuarioId) => {

        console.log(
            "Usuario desconectado:",
            usuarioId
        );

        socket.emit(
            "solicitar-usuarios"
        );

    }
);

// ============================================================
// CREAR CONEXIÓN WEBRTC
// ============================================================

function crearConexion() {

    console.log(
        "Creando conexión WebRTC..."
    );


    peerConnection =
        new RTCPeerConnection(
            configuracionRTC
        );


    // ========================================================
    // RECIBIR STREAM REMOTO
    // ========================================================

    peerConnection.ontrack =
        (event) => {

            console.log(
                "Stream remoto recibido."
            );


            if (
                event.streams &&
                event.streams[0]
            ) {

                videoRemoto.srcObject =
                    event.streams[0];

            }

            else {

                if (
                    !videoRemoto.srcObject
                ) {

                    videoRemoto.srcObject =
                        new MediaStream();

                }


                videoRemoto.srcObject.addTrack(
                    event.track
                );

            }


            if (mensajeRemoto) {

                mensajeRemoto.textContent =
                    "Usuario remoto conectado";

            }

        };


    // ========================================================
    // ENVIAR CANDIDATOS ICE
    // ========================================================

    peerConnection.onicecandidate =
        (event) => {

            if (
                event.candidate &&
                usuarioRemoto
            ) {

                console.log(
                    "Enviando candidato ICE..."
                );


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


    // ========================================================
    // ESTADO DE CONEXIÓN WEBRTC
    // ========================================================

    peerConnection.onconnectionstatechange =
        () => {

            const estado =
                peerConnection
                    .connectionState;


            console.log(
                "Estado WebRTC:",
                estado
            );


            if (
                estado === "connecting"
            ) {

                actualizarEstado(
                    "🟡 Estableciendo conexión...",
                    "conectando"
                );

            }


            if (
    estado === "connected"
) {

    console.log(
        "🟢 WEBRTC CONECTADO CORRECTAMENTE"
    );

    estadoLlamada =
        "ocupado";

    actualizarEstado(
        "🟢 Llamada conectada",
        "ocupado"
    );

    actualizarBotones(
        "ocupado"
    );

    actualizarEtiquetasLlamada();

}


            if (
                estado === "disconnected"
            ) {

                actualizarEstado(
                    "🟠 Conexión interrumpida.",
                    "conectando"
                );

            }


            if (
                estado === "failed"
            ) {

                console.error(
                    "La conexión WebRTC falló."
                );


                actualizarEstado(
                    "🔴 No fue posible establecer la conexión.",
                    "error"
                );

            }


            if (
                estado === "closed"
            ) {

                actualizarEstado(
                    "🟢 Sistema disponible",
                    "disponible"
                );

            }

        };


    // ========================================================
    // ESTADO ICE
    // ========================================================

    peerConnection.oniceconnectionstatechange =
        () => {

            const estadoICE =
                peerConnection
                    .iceConnectionState;


            console.log(
                "Estado ICE:",
                estadoICE
            );


            if (
                estadoICE === "checking"
            ) {

                actualizarEstado(
                    "🟡 Verificando conexión...",
                    "conectando"
                );

            }


            if (
                estadoICE === "connected" ||
                estadoICE === "completed"
            ) {

                console.log(
                    "ICE conectado correctamente."
                );

            }


            if (
                estadoICE === "disconnected"
            ) {

                console.warn(
                    "ICE desconectado."
                );

            }


            if (
                estadoICE === "failed"
            ) {

                console.error(
                    "ICE falló."
                );

                actualizarEstado(
                    "🔴 No se pudo establecer la conexión de red.",
                    "error"
                );

            }

        };


    // ========================================================
    // CANAL DE DATOS
    // ========================================================

    peerConnection.ondatachannel =
        (event) => {

            console.log(
                "Canal de datos recibido."
            );


            const canal =
                event.channel;


            canal.onopen =
                () => {

                    console.log(
                        "Canal de datos abierto."
                    );

                };


            canal.onmessage =
                (mensajeRecibido) => {

                    console.log(
                        "Mensaje recibido:",
                        mensajeRecibido.data
                    );

                };

        };


    return peerConnection;

}


// ============================================================
// PROCESAR CANDIDATOS ICE PENDIENTES
// ============================================================

async function procesarCandidatosPendientes() {

    if (
        !peerConnection
    ) {

        return;

    }


    if (
        !peerConnection.remoteDescription
    ) {

        return;

    }


    while (
        candidatosPendientes.length > 0
    ) {

        const candidato =
            candidatosPendientes.shift();


        try {

            await peerConnection.addIceCandidate(
                new RTCIceCandidate(
                    candidato
                )
            );


            console.log(
                "Candidato ICE pendiente agregado."
            );

        }

        catch (error) {

            console.error(
                "Error agregando candidato ICE:",
                error
            );

        }

    }

}


// ============================================================
// ACTIVAR CÁMARA Y MICRÓFONO
// ============================================================

if (btnCamara) {

    btnCamara.addEventListener(
        "click",
        async () => {

            try {

                console.log(
                    "Solicitando cámara y micrófono..."
                );


                if (
                    streamLocal
                ) {

                    console.log(
                        "Los dispositivos ya están activos."
                    );

                    return;

                }


                streamLocal =
                    await navigator.mediaDevices.getUserMedia(
                        {

                            video: true,

                            audio: true

                        }
                    );


                console.log(
                    "Cámara y micrófono activados."
                );


                videoLocal.srcObject =
                    streamLocal;


                videoLocal.muted =
                    true;


                if (mensajeLocal) {

                    mensajeLocal.textContent =
                        "Cámara y micrófono activos";

                }


                microfonoActivo =
                    true;

                camaraActiva =
                    true;


                actualizarBotones(
                    estadoLlamada
                );


                actualizarEstado(
                    "🟢 Cámara y micrófono activos",
                    estadoLlamada
                );

            }

            catch (error) {

                console.error(
                    "Error al acceder a cámara/micrófono:",
                    error
                );


                actualizarEstado(
                    "🔴 No se pudo acceder a la cámara o al micrófono.",
                    "error"
                );


                if (mensajeLocal) {

                    mensajeLocal.textContent =
                        "Permiso de cámara/micrófono requerido";

                }

            }

        }
    );

}


// ============================================================
// FUNCIÓN PARA OBTENER USUARIOS DISPONIBLES
// ============================================================

function obtenerUsuarios() {

    return new Promise(
        (resolve) => {

            socket.once(
                "usuarios-actuales",
                (usuarios) => {

                    usuariosActuales =
                        usuarios || [];


                    mostrarUsuarios(
                        usuariosActuales
                    );


                    resolve(
                        usuariosActuales
                    );

                }
            );


            socket.emit(
                "solicitar-usuarios"
            );

        }
    );

}

// ============================================================
// INICIAR LLAMADA WEBRTC
// ============================================================

if (btnWebRTC) {

    btnWebRTC.addEventListener(
        "click",
        async () => {

            try {

                console.log(
                    "Iniciando llamada..."
                );


                // ====================================================
                // VERIFICAR CÁMARA Y MICRÓFONO
                // ====================================================

                if (!streamLocal) {

                    actualizarEstado(
                        "🟡 Primero activa la cámara y el micrófono.",
                        "error"
                    );

                    return;

                }


                // ====================================================
                // CAMBIAR ESTADO
                // ====================================================

                actualizarEstado(
                    "🟡 Buscando un usuario disponible...",
                    "conectando"
                );


                // ====================================================
                // OBTENER USUARIOS
                // ====================================================

                const usuarios =
                    await obtenerUsuarios();


                console.log(
                    "Usuarios disponibles:",
                    usuarios
                );


                // ====================================================
                // BUSCAR OTRO USUARIO
                // ====================================================

                const usuarioDisponible =
                    usuarios.find(
                        (usuario) => {

                            return (
                                usuario.id !== socket.id &&
                                usuario.estado === "disponible"
                            );

                        }
                    );


                // ====================================================
                // NO HAY USUARIOS
                // ====================================================

                if (!usuarioDisponible) {

                    console.warn(
                        "No se encontró otro usuario disponible."
                    );


                    actualizarEstado(
                        "🟠 No hay otro usuario disponible para llamar.",
                        "disponible"
                    );


                    return;

                }


                // ====================================================
                // GUARDAR USUARIO REMOTO
                // ====================================================

                usuarioRemoto =
                    usuarioDisponible.id;


                rolLlamada =
                    "emisor";


                console.log(
                    "Llamando a:",
                    usuarioRemoto
                );


                actualizarEtiquetasLlamada();


                // ====================================================
                // CREAR CONEXIÓN WEBRTC
                // ====================================================

                crearConexion();


                // ====================================================
                // AGREGAR STREAM LOCAL
                // ====================================================

                streamLocal
                    .getTracks()
                    .forEach(
                        (track) => {

                            peerConnection.addTrack(
                                track,
                                streamLocal
                            );

                        }
                    );


                // ====================================================
                // CREAR CANAL DE DATOS
                // ====================================================

                const canalDatos =
                    peerConnection.createDataChannel(
                        "canal-datos"
                    );


                canalDatos.onopen =
                    () => {

                        console.log(
                            "Canal de datos abierto."
                        );


                        try {

                            canalDatos.send(
                                "Hola desde la videollamada institucional."
                            );

                        }

                        catch (error) {

                            console.warn(
                                "No fue posible enviar mensaje por el canal de datos.",
                                error
                            );

                        }

                    };


                canalDatos.onmessage =
                    (event) => {

                        console.log(
                            "Mensaje recibido:",
                            event.data
                        );

                    };


                // ====================================================
                // CREAR OFERTA
                // ====================================================

                console.log(
                    "Creando oferta WebRTC..."
                );


                const offer =
                    await peerConnection.createOffer();


                // ====================================================
                // ESTABLECER DESCRIPCIÓN LOCAL
                // ====================================================

                await peerConnection.setLocalDescription(
                    offer
                );


                console.log(
                    "Descripción local establecida."
                );


                // ====================================================
                // ENVIAR OFERTA AL OTRO USUARIO
                // ====================================================

                socket.emit(
                    "offer",
                    {

                        to:
                            usuarioRemoto,

                        offer:
                            offer

                    }
                );


                console.log(
                    "Oferta enviada a:",
                    usuarioRemoto
                );


                actualizarEstado(
                    "🟡 Llamando... esperando respuesta.",
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
                    "error"
                );

            }

        }
    );

}


// ============================================================
// USUARIO OCUPADO
// ============================================================

socket.on(
    "usuario-ocupado",
    (data) => {

        console.warn(
            "El usuario está ocupado:",
            data
        );


        actualizarEstado(
            "🟠 El usuario seleccionado está ocupado.",
            "disponible"
        );


        usuarioRemoto =
            null;

        rolLlamada =
            null;


        if (
            peerConnection
        ) {

            try {

                peerConnection.close();

            }

            catch (error) {

                console.warn(
                    "Error cerrando conexión:",
                    error
                );

            }

            peerConnection =
                null;

        }

    }
);


// ============================================================
// ERROR DE SEÑALIZACIÓN
// ============================================================

socket.on(
    "error-llamada",
    (data) => {

        console.error(
            "Error de llamada:",
            data
        );


        actualizarEstado(
            "🔴 " +
            (
                data?.mensaje ||
                "Se produjo un error durante la llamada."
            ),
            "error"
        );

    }
);

// ============================================================
// RECIBIR OFERTA WEBRTC
// ============================================================
// El usuario receptor acepta automáticamente la llamada.
// No se utiliza modal ni botones de aceptar/rechazar.
// ============================================================

socket.on(
    "offer",
    async (data) => {

        try {

            console.log(
                "Oferta recibida de:",
                data.from
            );


            // ====================================================
            // GUARDAR USUARIO REMOTO
            // ====================================================

            usuarioRemoto =
                data.from;


            rolLlamada =
                "receptor";


            actualizarEtiquetasLlamada();


            actualizarEstado(
                "🟡 Llamada entrante. Estableciendo conexión...",
                "conectando"
            );


            // ====================================================
            // CREAR CONEXIÓN WEBRTC
            // ====================================================

            crearConexion();


            // ====================================================
            // AGREGAR CÁMARA Y MICRÓFONO
            // ====================================================

            if (streamLocal) {

                streamLocal
                    .getTracks()
                    .forEach(
                        (track) => {

                            peerConnection.addTrack(
                                track,
                                streamLocal
                            );

                        }
                    );

            }

            else {

                console.warn(
                    "El receptor no tiene cámara/micrófono activados."
                );

            }


            // ====================================================
            // ESTABLECER OFERTA REMOTA
            // ====================================================

            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(
                    data.offer
                )
            );


            console.log(
                "Oferta remota establecida."
            );


            // ====================================================
            // PROCESAR CANDIDATOS ICE PENDIENTES
            // ====================================================

            await procesarCandidatosPendientes();


            // ====================================================
            // CREAR RESPUESTA
            // ====================================================

            console.log(
                "Creando respuesta WebRTC..."
            );


            const answer =
                await peerConnection.createAnswer();


            // ====================================================
            // ESTABLECER DESCRIPCIÓN LOCAL
            // ====================================================

            await peerConnection.setLocalDescription(
                answer
            );


            console.log(
                "Descripción local de respuesta establecida."
            );


            // ====================================================
            // ENVIAR RESPUESTA AL EMISOR
            // ====================================================

            socket.emit(
                "answer",
                {

                    to:
                        data.from,

                    answer:
                        answer

                }
            );


            console.log(
                "Respuesta enviada a:",
                data.from
            );


            actualizarEstado(
                "🟡 Respuesta enviada. Conectando...",
                "conectando"
            );

        }

        catch (error) {

            console.error(
                "Error aceptando automáticamente la llamada:",
                error
            );


            actualizarEstado(
                "🔴 Error al aceptar la llamada.",
                "error"
            );


            actualizarBotones(
                "error"
            );

        }

    }
);


// ============================================================
// RECIBIR RESPUESTA WEBRTC
// ============================================================

socket.on(
    "answer",
    async (data) => {

        try {

            console.log(
                "Respuesta recibida de:",
                data.from
            );


            if (
                !peerConnection
            ) {

                console.warn(
                    "No existe una conexión WebRTC activa."
                );

                return;

            }


            // ====================================================
            // ESTADO DE CONEXIÓN
            // ====================================================

            actualizarEstado(
                "🟡 Respuesta recibida. Estableciendo conexión...",
                "conectando"
            );


            // ====================================================
            // ESTABLECER RESPUESTA REMOTA
            // ====================================================

            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(
                    data.answer
                )
            );


            console.log(
                "Respuesta remota establecida."
            );


            // ====================================================
            // PROCESAR CANDIDATOS ICE PENDIENTES
            // ====================================================

            await procesarCandidatosPendientes();


            console.log(
                "Candidatos ICE procesados."
            );


            // ====================================================
            // VERIFICAR SI YA ESTÁ CONECTADO
            // ====================================================

            if (
                peerConnection.connectionState ===
                "connected"
            ) {

                console.log(
                    "🟢 La conexión ya está establecida."
                );


                actualizarEstado(
                    "🟢 Llamada conectada",
                    "ocupado"
                );


                actualizarBotones(
                    "ocupado"
                );


                actualizarEtiquetasLlamada();

            }

        }

        catch (error) {

            console.error(
                "Error procesando respuesta:",
                error
            );


            actualizarEstado(
                "🔴 Error procesando la respuesta.",
                "error"
            );


            actualizarBotones(
                "error"
            );

        }

    }
);

// ============================================================
// RECIBIR CANDIDATOS ICE
// ============================================================

socket.on(
    "ice-candidate",
    async (data) => {

        try {

            console.log(
                "Candidato ICE recibido de:",
                data.from
            );


            // ====================================================
            // VERIFICAR QUE EXISTA LA CONEXIÓN
            // ====================================================

            if (!peerConnection) {

                console.warn(
                    "No existe una conexión WebRTC para recibir el candidato ICE."
                );

                candidatosPendientes.push(
                    data.candidate
                );

                return;

            }


            // ====================================================
            // SI TODAVÍA NO EXISTE DESCRIPCIÓN REMOTA,
            // GUARDAR EL CANDIDATO PARA PROCESARLO DESPUÉS
            // ====================================================

            if (
                !peerConnection.remoteDescription
            ) {

                console.log(
                    "Guardando candidato ICE pendiente..."
                );


                candidatosPendientes.push(
                    data.candidate
                );


                return;

            }


            // ====================================================
            // AGREGAR CANDIDATO ICE
            // ====================================================

            await peerConnection.addIceCandidate(
                new RTCIceCandidate(
                    data.candidate
                )
            );


            console.log(
                "Candidato ICE agregado correctamente."
            );

        }

        catch (error) {

            console.error(
                "Error procesando candidato ICE:",
                error
            );

        }

    }
);


// ============================================================
// SOLICITAR USUARIOS MANUALMENTE
// ============================================================

socket.on(
    "usuarios-actuales",
    (usuarios) => {

        usuariosActuales =
            usuarios || [];


        mostrarUsuarios(
            usuariosActuales
        );

    }
);


// ============================================================
// VERIFICAR CONEXIÓN DEL SOCKET
// ============================================================

socket.on(
    "connect_error",
    (error) => {

        console.error(
            "Error de conexión con el servidor:",
            error
        );


        actualizarEstado(
            "🔴 No fue posible conectar con el servidor.",
            "error"
        );

    }
);


// ============================================================
// SOCKET DESCONECTADO
// ============================================================

socket.on(
    "disconnect",
    (motivo) => {

        console.warn(
            "Socket desconectado:",
            motivo
        );


        if (
            estadoLlamada !== "disponible"
        ) {

            actualizarEstado(
                "🟠 Se perdió la conexión con el servidor.",
                "error"
            );

        }

        else {

            actualizarEstado(
                "🟠 Conexión con el servidor perdida.",
                "error"
            );

        }

    }
);

// ============================================================
// FINALIZAR LLAMADA
// ============================================================

if (btnFinalizar) {

    btnFinalizar.addEventListener(
        "click",
        () => {

            console.log(
                "Finalizando llamada..."
            );


            // ====================================================
            // AVISAR AL OTRO USUARIO
            // ====================================================

            if (usuarioRemoto) {

                socket.emit(
                    "finalizar-llamada",
                    {

                        to:
                            usuarioRemoto

                    }
                );

            }


            // ====================================================
            // CERRAR CONEXIÓN LOCAL
            // ====================================================

            cerrarConexion();


            actualizarEstado(
                "🟢 Sistema disponible",
                "disponible"
            );

        }
    );

}


// ============================================================
// RECIBIR FINALIZACIÓN DE LLAMADA
// ============================================================

socket.on(
    "llamada-finalizada",
    (data) => {

        console.log(
            "La llamada fue finalizada por el otro usuario.",
            data
        );


        cerrarConexion();


        actualizarEstado(
            "🟢 La llamada ha finalizado.",
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


// ============================================================
// CERRAR CONEXIÓN WEBRTC
// ============================================================

function cerrarConexion() {

    console.log(
        "Cerrando conexión WebRTC..."
    );


    // ========================================================
    // CERRAR CANALES DE DATOS Y CONEXIÓN
    // ========================================================

    if (peerConnection) {

        try {

            peerConnection
                .getSenders()
                .forEach(
                    (sender) => {

                        try {

                            if (
                                sender.track
                            ) {

                                sender.track.stop();

                            }

                        }

                        catch (error) {

                            console.warn(
                                "Error deteniendo sender:",
                                error
                            );

                        }

                    }
                );

        }

        catch (error) {

            console.warn(
                "Error procesando los senders:",
                error
            );

        }


        try {

            peerConnection.close();

        }

        catch (error) {

            console.warn(
                "Error cerrando PeerConnection:",
                error
            );

        }


        peerConnection =
            null;

    }


    // ========================================================
    // DETENER CÁMARA Y MICRÓFONO
    // ========================================================

    if (streamLocal) {

        streamLocal
            .getTracks()
            .forEach(
                (track) => {

                    try {

                        track.stop();

                    }

                    catch (error) {

                        console.warn(
                            "Error deteniendo dispositivo:",
                            error
                        );

                    }

                }
            );


        streamLocal =
            null;

    }


    // ========================================================
    // LIMPIAR VIDEO LOCAL
    // ========================================================

    if (videoLocal) {

        videoLocal.srcObject =
            null;

    }


    // ========================================================
    // LIMPIAR VIDEO REMOTO
    // ========================================================

    if (videoRemoto) {

        videoRemoto.srcObject =
            null;

    }


    // ========================================================
    // LIMPIAR VARIABLES
    // ========================================================

    usuarioRemoto =
        null;

    candidatosPendientes =
        [];

    rolLlamada =
        null;

    microfonoActivo =
        true;

    camaraActiva =
        true;


    // ========================================================
    // MENSAJES DE VIDEO
    // ========================================================

    if (mensajeLocal) {

        mensajeLocal.textContent =
            "Cámara local";

    }


    if (mensajeRemoto) {

        mensajeRemoto.textContent =
            "Esperando conexión";

    }


    // ========================================================
    // ACTUALIZAR INTERFAZ
    // ========================================================

    actualizarModoVisual();

    actualizarBotones(
        "disponible"
    );


    console.log(
        "Conexión WebRTC cerrada correctamente."
    );

}


// ============================================================
// ACTUALIZAR LISTA DESPUÉS DE FINALIZAR
// ============================================================

socket.on(
    "usuarios-conectados",
    (usuarios) => {

        usuariosActuales =
            usuarios || [];


        mostrarUsuarios(
            usuariosActuales
        );

    }
);

// ============================================================
// CONTROL DEL MICRÓFONO
// ============================================================

if (btnMicrofono) {

    btnMicrofono.addEventListener(
        "click",
        () => {

            if (!streamLocal) {

                console.warn(
                    "No existe un stream local."
                );

                return;

            }


            const pistasAudio =
                streamLocal.getAudioTracks();


            if (
                pistasAudio.length === 0
            ) {

                console.warn(
                    "No se encontró pista de audio."
                );

                return;

            }


            microfonoActivo =
                !microfonoActivo;


            pistasAudio.forEach(
                (track) => {

                    track.enabled =
                        microfonoActivo;

                }
            );


            if (
                microfonoActivo
            ) {

                btnMicrofono.textContent =
                    "🎤 Micrófono";

                console.log(
                    "Micrófono activado."
                );

            }

            else {

                btnMicrofono.textContent =
                    "🔇 Micrófono";

                console.log(
                    "Micrófono silenciado."
                );

            }

        }
    );

}


// ============================================================
// CONTROL DE LA CÁMARA
// ============================================================

if (btnVideo) {

    btnVideo.addEventListener(
        "click",
        () => {

            if (!streamLocal) {

                console.warn(
                    "No existe un stream local."
                );

                return;

            }


            const pistasVideo =
                streamLocal.getVideoTracks();


            if (
                pistasVideo.length === 0
            ) {

                console.warn(
                    "No se encontró pista de video."
                );

                return;

            }


            camaraActiva =
                !camaraActiva;


            pistasVideo.forEach(
                (track) => {

                    track.enabled =
                        camaraActiva;

                }
            );


            if (
                camaraActiva
            ) {

                btnVideo.textContent =
                    "📹 Cámara";

                console.log(
                    "Cámara activada."
                );

            }

            else {

                btnVideo.textContent =
                    "🚫 Cámara";

                console.log(
                    "Cámara apagada."
                );

            }

        }
    );

}


// ============================================================
// PRUEBA DE SEÑALIZACIÓN
// ============================================================

if (btnPrueba) {

    btnPrueba.addEventListener(
        "click",
        () => {

            console.log(
                "Enviando mensaje de prueba..."
            );


            socket.emit(
                "mensaje-prueba",
                {

                    mensaje:
                        "Prueba de señalización desde la plataforma institucional.",

                    fecha:
                        new Date().toISOString()

                }
            );

        }
    );

}


// ============================================================
// RECIBIR MENSAJE DE PRUEBA
// ============================================================

socket.on(
    "mensaje-prueba",
    (data) => {

        console.log(
            "Mensaje de prueba recibido:",
            data
        );


        if (mensaje) {

            mensaje.textContent =
                "🟢 Señalización funcionando correctamente.";

        }

    }
);


// ============================================================
// MANEJAR CAMBIO DE ESTADO DE LOS USUARIOS
// ============================================================

socket.on(
    "usuarios-actuales",
    (usuarios) => {

        if (
            Array.isArray(usuarios)
        ) {

            usuariosActuales =
                usuarios;

            mostrarUsuarios(
                usuariosActuales
            );

        }

    }
);


// ============================================================
// ACTUALIZAR BOTONES SEGÚN EL STREAM
// ============================================================

function actualizarEstadoDispositivos() {

    if (!btnMicrofono || !btnVideo) {

        return;

    }


    if (!streamLocal) {

        btnMicrofono.disabled =
            true;

        btnVideo.disabled =
            true;

        return;

    }


    btnMicrofono.disabled =
        false;

    btnVideo.disabled =
        false;


    if (
        microfonoActivo
    ) {

        btnMicrofono.textContent =
            "🎤 Micrófono";

    }

    else {

        btnMicrofono.textContent =
            "🔇 Micrófono";

    }


    if (
        camaraActiva
    ) {

        btnVideo.textContent =
            "📹 Cámara";

    }

    else {

        btnVideo.textContent =
            "🚫 Cámara";

    }

}


// ============================================================
// ACTUALIZAR INTERFAZ CUANDO SE ACTIVAN DISPOSITIVOS
// ============================================================

if (btnCamara) {

    btnCamara.addEventListener(
        "click",
        () => {

            setTimeout(
                () => {

                    actualizarEstadoDispositivos();

                },
                100
            );

        }
    );

}

// ============================================================
// INICIALIZACIÓN FINAL DE LA APLICACIÓN
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "Sistema de videollamada institucional iniciado."
        );


        // ========================================================
        // ESTADO INICIAL
        // ========================================================

        estadoLlamada =
            "disponible";


        microfonoActivo =
            true;


        camaraActiva =
            true;


        rolLlamada =
            null;


        usuarioRemoto =
            null;


        candidatosPendientes =
            [];


        // ========================================================
        // CONFIGURAR VIDEOS
        // ========================================================

        if (videoLocal) {

            videoLocal.muted =
                true;

            videoLocal.autoplay =
                true;

            videoLocal.playsInline =
                true;

        }


        if (videoRemoto) {

            videoRemoto.autoplay =
                true;

            videoRemoto.playsInline =
                true;

        }


        // ========================================================
        // ACTUALIZAR INTERFAZ
        // ========================================================

        actualizarModoVisual();

        actualizarBotones(
            "disponible"
        );

        actualizarEstadoDispositivos();

        actualizarEtiquetasLlamada();


        // ========================================================
        // MOSTRAR ESTADO INICIAL
        // ========================================================

        if (mensaje) {

            mensaje.textContent =
                "🟢 Sistema disponible";

        }


        if (mensajeLocal) {

            mensajeLocal.textContent =
                "Cámara local";

        }


        if (mensajeRemoto) {

            mensajeRemoto.textContent =
                "Esperando conexión";

        }


        // ========================================================
        // SOLICITAR LISTA DE USUARIOS
        // ========================================================

        if (
            socket.connected
        ) {

            socket.emit(
                "solicitar-usuarios"
            );

        }


        console.log(
            "Interfaz inicializada correctamente."
        );

    }
);


// ============================================================
// EVITAR QUE EL VIDEO LOCAL REPRODUZCA AUDIO
// ============================================================

if (videoLocal) {

    videoLocal.addEventListener(
        "loadedmetadata",
        () => {

            videoLocal.muted =
                true;


            const resultado =
                videoLocal.play();


            if (
                resultado &&
                typeof resultado.catch === "function"
            ) {

                resultado.catch(
                    (error) => {

                        console.warn(
                            "El navegador bloqueó la reproducción automática del video local.",
                            error
                        );

                    }
                );

            }

        }
    );

}


// ============================================================
// INTENTAR REPRODUCIR VIDEO REMOTO
// ============================================================

if (videoRemoto) {

    videoRemoto.addEventListener(
        "loadedmetadata",
        () => {

            const resultado =
                videoRemoto.play();


            if (
                resultado &&
                typeof resultado.catch === "function"
            ) {

                resultado.catch(
                    (error) => {

                        console.warn(
                            "El navegador requiere interacción para reproducir el video remoto.",
                            error
                        );

                    }
                );

            }

        }
    );

}


// ============================================================
// MANEJAR CIERRE DE LA PÁGINA
// ============================================================

window.addEventListener(
    "beforeunload",
    () => {

        console.log(
            "Cerrando página..."
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

    }
);


// ============================================================
// ATAJO DE TECLADO
// ESC = FINALIZAR LLAMADA
// ============================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape"
        ) {

            if (
                estadoLlamada !== "disponible"
            ) {

                console.log(
                    "Finalizando llamada mediante tecla ESC."
                );


                if (btnFinalizar) {

                    btnFinalizar.click();

                }

            }

        }

    }
);


// ============================================================
// FIN DEL SISTEMA
// ============================================================

console.log(
    "================================================="
);

console.log(
    "Videollamada WebRTC - John F. Kennedy"
);

console.log(
    "Sistema cargado correctamente."
);

console.log(
    "================================================="
);