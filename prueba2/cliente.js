// Require cola de trabajos y la librería de asserts
const { ColaDeTrabajos } = require('../ColaDeTrabajos');
const assert = require( "assert" );
const { argv } = require('process');

// Esta URL hay que cambiarla si no trabajamos en local
const NATS_URL =  "localhost:4222";



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

    for (let trabajo=1; trabajo <= 5; trabajo++){
        // Enviar trabajo y esperar respuesta síncronamente
        const respuesta = await cliente.anyadirTrabajoEsperando(
            {
                funcion: `Trabajo${trabajo}`,
                parametros: { mensaje: `Un saludo de ${nombre}`},
            }, 30000
        );

        console.log(`Respuesta del worker:`);
        console.log(respuesta);
    }
    


    // Se acabo el programa
    console.log("Ya he enviado todo lo que quería... (ctrl-C para cerrar)");
}

main();