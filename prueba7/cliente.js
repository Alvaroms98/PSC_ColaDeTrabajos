// Cuando un cliente envía trabajos asíncronamente hay dos maneras
// de recibir la respuesta:
// 1. Mediante un callback, que se ejecuta cuando la respuesta está lista
// 2. Síncronamente en el código en el momento que se requiera

// La primera opción es muy cómoda, mientras no suponga el "callback hell"
// en la aplicación que se está tratando. Sin embargo, la segunda se ajusta
// de mejor manera al ejercicio que se pide


// Require cola de trabajos y la librería de asserts
const { ColaDeTrabajos, esperar } = require('./ColaDeTrabajos_7');
const assert = require( "assert" );
const { argv } = require('process');

// Esta URL hay que cambiarla si no trabajamos en local
const NATS_URL =  "localhost:4222";

// el callback únicamente muestra la respuesta por pantalla
const callback = (err, respuesta) => {
    if (err){
        console.log(err);
    }

    console.log(`Respuesta del worker:`);
    console.log(respuesta);
}

const main = async () => {
    // Identificamos al cliente con un nombre
    nombre = argv[2] || "ClienteRandom";

    // Iniciamos cliente
    const cliente = await new ColaDeTrabajos(NATS_URL,
                    { worker: false,
                      nombreCliente: `${nombre}`});
    

    
    // Para matar desconectarse de la cola y salir
    process.on('SIGINT', async () => {
        await cliente.cerrar();
    });

    // Envío de trabajos
    let tickets = [];
    for (let i=1; i <= 1; i++){
        // Enviar trabajo y esperar respuesta síncronamente
        console.log(`\nEnviando Trabajo${i}...`);
        tickets[i] = await cliente.anyadirTrabajo(
            {
                funcion: `Trabajo${i}`,
                parametros: { mensaje: `Un saludo de ${nombre}`},
            }
        );
        console.log(`Ticket para recoger Trabajo${i}: ${tickets[i]}`);
    }
    

    //console.log("Esperando 20 segundos para recoger las respuestas...");
    //await esperar(20000);

    // Recogida de respuestas
    let respuestas = [];
    for (let i=1; i < tickets.length; i++){
        console.log(`\nRecogiendo respuesta de Trabajo${i}...`);
        respuestas[i] = await cliente.pedirRespuesta(tickets[i], 30000);
        console.log("La respuesta es:");
        console.log(respuestas[i]);
    }

    // Se acabo el programa
    console.log("Ya he enviado todo lo que quería... (ctrl-C para cerrar)");
}

main();