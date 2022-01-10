// Require cola de trabajos y la librería de asserts
const { ColaDeTrabajos, esperar } = require('../ColaDeTrabajos');
const assert = require( "assert" );
const { isFlowControlMsg } = require('nats');

// Esta URL hay que cambiarla si no trabajamos en local
const NATS_URL =  "localhost:4222";

// // función para ejecutar en la llamada del cliente
// const prueba = (...args) => {
//     args.forEach( (arg) => console.log(arg));
// }

const main = async () => {
    // Iniciamos worker
    const worker = await new ColaDeTrabajos(NATS_URL, { worker: true });
    
    // Para matar desconectarse de la cola y salir
    process.on('SIGINT', async () => {
        await worker.cerrar();
    });

    // Recoger trabajo
    const trabajo = await worker.pedirTrabajo( 100 );

    // Imprimir trabajo
    console.log(`Me han asignado este trabajo:`);
    console.log(trabajo);

    // Esperar un tiempo aleatorio de entre 0 a 10 segundos

    const time = Math.floor( Math.random() * 10000 );
    await esperar( time );

    // Responder trabajo
    await worker.responderATrabajo(trabajo,{
        estado: "OK",
        respuesta: { 
            mensaje: `He esperado ${time} segundos en responderte` 
        }
    });

    // Se acaba el programa
    console.log("Mi trabajo se ha acabado... (ctrl-C para cerrar)");
}

main();