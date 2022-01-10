// Require cola de trabajos y la librería de asserts
const { ColaDeTrabajos } = require('../ColaDeTrabajos');
const assert = require( "assert" );

// Esta URL hay que cambiarla si no trabajamos en local
const NATS_URL =  "localhost:4222";



const main = async () => {
    // Iniciamos cliente
    const cliente = await new ColaDeTrabajos(NATS_URL,
                    { worker: false,
                      nombreCliente: "primerCliente"});
    

    
    // Para matar desconectarse de la cola y salir
    process.on('SIGINT', async () => {
        await cliente.cerrar();
    });

    // Enviar trabajo y esperar respuesta síncronamente
    const ticket = await cliente.anyadirTrabajo(
        {
            funcion: "hazalgo",
            parametros: { mensaje: "Un saludo del primerCliente"},
        }, null);

    // Imprimir id del trabajo enviado
    console.log(`Ticket: ${ticket}`);

    // Esperar respuesta
    const respuesta = await cliente.pedirRespuesta(ticket,10000);

    // Imprimir respuesta
    console.log(`Respuesta del worker:`);
    console.log(respuesta);


    // Se acabo el programa
    console.log("Ya he enviado todo lo que quería... (ctrl-C para cerrar)");
}

main();