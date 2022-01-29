// Require cola de trabajos y la librería de asserts
const { ColaDeTrabajos, esperar } = require('./ColaDeTrabajos_8');
const assert = require( "assert" );

// Esta URL hay que cambiarla si no trabajamos en local
const NATS_URL =  "localhost:4222";

let intentos = 1;

// Con esta función el worker empieza la rutina de trabajo
// si se queda sin trabajo lo dice por pantalla, y vuelve a entrar recursivamente
const entroATrabajar = async (worker) => {
    try{
        await rutinaDeTrabajo(worker);
    } catch(err){
        console.log("\n\nEn la rutina de trabajo ha saltado este error:\n");
        console.log(err);

        if (intentos < 4){
            console.log(`\nVoy a intentar trabajar de nuevo... INTENTOS: ${intentos}`);
            entroATrabajar(worker);
            intentos += 1;
        } else {
            console.log(`\nParece que no hay más trabajo en la cola, me voy!`);

            // Fin de la jornada
            await worker.cerrar();
        }
    }
}

// La rutina de trabajo consiste en:
// 1. Pedir trabajo a la cola
// 2. Esperar un tiempo aleatorio en responder
// 3. Responder la petición devolviendolo a la cola (cola de respuestas)
const rutinaDeTrabajo = async (worker) => {
    while (true){
        // Recoger trabajo
        const trabajo = await worker.pedirTrabajo( 2000 );
        //console.log("******* TRABAJO RECIEN LLEGADO *********");
        //console.log(trabajo);
        // Si trabajo distinto de null es que hay trabajo
        // por tanto bajamos el contador de intentos a 1
        if (trabajo !== null){
            intentos = 1;
        }

        // Imprimir trabajo
        console.log(`Me han asignado este trabajo: ${trabajo.funcion}`);
        console.log(trabajo.parametros);


        // Esperar un tiempo aleatorio de entre 0 a 5 segundos

        const time = Math.floor( Math.random() * 5000 );
        await esperar( time );

        // Responder trabajo
        await worker.responderATrabajo(trabajo,{
            estado: "OK",
            respuesta: { 
                mensaje: `He esperado ${time/1000} segundos en responderte` 
            }
        });

        //console.log("************ TRABAJO RESPOINDIDO **********");
        //console.log(trabajo);
    }
}

const main = async () => {
    // Iniciamos worker
    const worker = await new ColaDeTrabajos(NATS_URL, { worker: true });
    await worker.muestraInfoWorker();
    // Para matar desconectarse de la cola y salir
    process.on('SIGINT', async () => {
        await worker.cerrar();
    });

    // Comienza el trabajo
    await entroATrabajar(worker);
}



main();