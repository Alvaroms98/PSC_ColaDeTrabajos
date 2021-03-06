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

    for (let trabajo=1; trabajo <= 10; trabajo++){
        // Enviar trabajo y esperar respuesta síncronamente
        const respuesta = await cliente.anyadirTrabajoEsperando(
            {
                funcion: `Trabajo${trabajo}`,
                parametros: { mensaje: "Un saludo del primerCliente"},
            }, 30000
        );

        console.log(`Respuesta del worker:`);
        console.log(respuesta);
    }
    


    // Se acabo el programa
    console.log("Ya he enviado todo lo que quería... (ctrl-C para cerrar)");
}

main();