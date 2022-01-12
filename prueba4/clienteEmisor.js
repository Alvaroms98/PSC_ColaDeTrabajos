// El cliente emisor pone los trabajos en la cola, y publica
// las keys de los trabajos por un canal, para que el cliente receptor
// rescate las respuestas de la cola


// Require cola de trabajos y la librería de asserts
const { ColaDeTrabajos, esperar } = require('../ColaDeTrabajos');
const assert = require( "assert" );
const zmq = require('zeromq');
const { resolve } = require('path');
const { rejects } = require('assert');

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

const iniciarSocket = () => {
    return new Promise((resolve, rejects) => {
        const publicador = zmq.socket('pub');
        publicador.bind(`tcp://*:8888`, (err) => {
            if (!err){
                console.log(`Publicando tickets de trabajos en el puerto 8888`);
                resolve(publicador);
            } else{
                console.log(err);
                rejects(err);
            }
        });
    });
}

const main = async () => {
    // Identificamos al cliente con un nombre
    nombre = "clienteEmisor";

    // Iniciamos cliente
    const cliente = await new ColaDeTrabajos(NATS_URL,
                    { worker: false,
                      nombreCliente: `${nombre}`});
    
    // Socket zmq para enviar los tickets
    const publicador = await iniciarSocket();

    
    // Para matar desconectarse de la cola y salir
    process.on('SIGINT', async () => {
        await cliente.cerrar();
        publicador.close();
    });

    // Envío de trabajos
    let tickets = [];
    for (let i=1; i <= 5; i++){
        // Enviar trabajo y esperar respuesta síncronamente
        console.log(`\nEnviando Trabajo${i}...`);
        tickets[i] = await cliente.anyadirTrabajo(
            {
                funcion: `Trabajo${i}`,
                parametros: { mensaje: `Un saludo de ${nombre}`},
            }
        );
        console.log(`Ticket para recoger Trabajo${i}: ${tickets[i]}`);
        console.log(`Publicándolo para que el compi recoja las respuestas...`);
        publicador.send(tickets[i]);
        await esperar(2000);
    }

    // Se acabo el programa
    console.log("Ya he enviado todo lo que quería... (ctrl-C para cerrar)");
}

main();