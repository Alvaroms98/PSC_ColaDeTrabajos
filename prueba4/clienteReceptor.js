// El cliente emisor pone los trabajos en la cola, y publica
// las keys de los trabajos por un canal, para que el cliente receptor
// rescate las respuestas de la cola

// Require cola de trabajos y la librería de asserts
const { ColaDeTrabajos, esperar } = require('../ColaDeTrabajos');
const assert = require( "assert" );
const zmq = require('zeromq');

// Estas URL hay que cambiarlas si no trabajamos en local
const NATS_URL =  "localhost:4222";
const ZMQ_URL = "localhost:8888";

// el callback únicamente muestra la respuesta por pantalla
const callback = (err, respuesta) => {
    if (err){
        console.log(err);
    }

    console.log(`Respuesta del worker:`);
    console.log(respuesta);
}

const iniciarSocket = () => {
    const receptor = zmq.socket('sub');
    receptor.connect(`tcp://${ZMQ_URL}`);
    receptor.subscribe('');
    return receptor;
}

const main = async () => {
    // Identificamos al cliente con un nombre
    nombre = "clienteReceptor"

    // Iniciamos cliente
    const cliente = await new ColaDeTrabajos(NATS_URL,
                    { worker: false,
                      nombreCliente: `${nombre}`});
    

    

    // Iniciamos socket para recoger los tickets de los trabajos
    const receptor = iniciarSocket();
    console.log("A la espera de recibir tickets para recoger trabajos de la cola...");

    // Para matar desconectarse de la cola y salir
    process.on('SIGINT', async () => {
        await cliente.cerrar();
        receptor.close();
    });

    // Recogida de tickets y de respuestas de trabajos
    receptor.on('message', async (ticket) => {
        ticket = ticket.toString();
        console.log(`\nRecibido ticket para recoger trabajo: ${ticket}`);
        console.log("Mandando petición a la cola de respuestas para recoger el trabajo...");
        const respuesta = await cliente.pedirRespuesta(ticket, 30000);
        console.log(`La respuesta al trabajo ${ticket} es:`);
        console.log(respuesta);
    });
}

main();