// Require cola de trabajos y la librería de asserts
const { ColaDeTrabajos, esperar } = require('./ColaDeTrabajos_7');
const assert = require( "assert" );
const { argv, mainModule, setMaxListeners } = require('process');
const { ClientRequest } = require('http');

// Esta URL hay que cambiarla si no trabajamos en local
const NATS_URL =  "localhost:4222";



main = async () => {
    // Iniciamos cliente
    const deb = await new ColaDeTrabajos(NATS_URL,
                    { worker: false,
                        nombreCliente: `debugger`});


    
    

    console.log("***** INFO STREAM **********");

    await deb.muestraInfoStreams();

    

    // console.log("********* Mirar Mensajes ********");
    // const sm = await deb.jsManager.streams.getMessage(deb.datosStream.name, {seq:1});
    // console.log(sm);
    // console.log(sm.header.headers);

    if (argv[2] === '1'){
        console.log("************ Purgando todo el stream **********");
        await deb.jsManager.streams.purge(deb.datosStream.name);
    }

    // En el mensaje hay que averiguar el sm.time
    // Y luego con "new Date()" y restando las dos sacamos el tiempo
    // transcurrido en milisegundos, entonces hay que meter un umbral

    await deb.cerrar();

}

main();