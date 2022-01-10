// ---------------------------------------------------------------------
//
// ColaDeTrabajos.js
//
// @version    1.03 (beta) 2021-12-29
// @author     Jordi Bataller Mascarell
// 
// @see        Fuente Nats-JetStream:
//               github.com/nats-io/nats.deno/blobl/main/jetstream.md
// @see        Fuente Nats: github.com/nats-io/nats.js 
//
// ---------------------------------------------------------------------

const DEBUG = true

// ---------------------------------------------------------------------
// require
// ---------------------------------------------------------------------
const { connect, StringCodec, Subscription,
		AckPolicy, WorkQueuePolicy, consumerOpts, createInbox }
	  = require( "nats" )

const assert = require( "assert" )

const codificador = StringCodec()

// ---------------------------------------------------------------------
// msg: Texto --> f()
// ---------------------------------------------------------------------
// Para escribr en pantalla
// ---------------------------------------------------------------------
function debug( msg ) {
	debug.DEBUG = DEBUG

	if ( debug.DEBUG ) {
		console.log( msg )
	}
} // ()

// ---------------------------------------------------------------------
// milis: N --> f()
// ---------------------------------------------------------------------
// @return Promesa       para poder hacer: await esperar( 1500 )
// ---------------------------------------------------------------------
function esperar( milis ) {
	return new Promise( function( aceptar ) {
		setTimeout( function() {
			aceptar()
		}, milis )
	})
} // ()

// ---------------------------------------------------------------------
//  f() --> Texto
// ---------------------------------------------------------------------
function getRandomString() {
	let fecha = ( Date.now() % 123456789 ).toString()
	let sufijo =  Math.random().toString(36).substr(2,8) 
	return fecha+sufijo
}

// ---------------------------------------------------------------------
// obj: Objecto --> f()
// ---------------------------------------------------------------------
// Escribe en pantalla propiedades del objeto
// ---------------------------------------------------------------------
function mostrarObjeto( obj ) {
	if ( ! obj ) {
		return
	}

	console.log( " ---- mostrarObjeto -------------- " )
	console.log( " id in obj " )
	console.log( " --------------------------------- " )
	for (let id in obj) {
		console.log( id )
	}
	console.log( " --------------------------------- " )
	console.log( " methods"  )
	console.log( " --------------------------------- " )
	for ( let m of Object.getOwnPropertyNames( obj ) ) {
		if ( typeof obj[m] === 'function' ) {
			console.log( m )
		}
	}
	console.log( " --------------------------------- " )
} 

// ---------------------------------------------------------------------
// 
// ---------------------------------------------------------------------
class ColaDeTrabajos {

	// -----------------------------------------------------------------
	// urlNats: Texto 
	// worker: VoF
	// nombreCliente: Texto
	//                       --> f() -->
	// -----------------------------------------------------------------
	// Si worker=false => cliente=true y debe haber nombrecliente
	// 
	// @return Promesa   para poder hacer: 
	// 	                    let cdtWorker = await new ColaDeTrabajos(
	//                              NATS_URL, {worker: true} )
	//                   	let cdtClient = await new ColaDeTrabajos(
	//                     			NATS_URL,
	//             			{worker: false, nombreCliente: "clientecito1" }
	// -----------------------------------------------------------------
	constructor( urlNats, {worker=true, nombreCliente=null} ) {

		debug( "ColaDeTrabajos.constructor()" )
		// 
		// guardo parámetros
		// 
		this.urlNats = urlNats

		// 
		// guardo parámetros
		// 
		this.soyWorker = worker
		this.soyCliente = ! this.soyWorker
		// si soy cliente, debo tener nombre
		if ( this.soyCliente ) {
			assert( nombreCliente )
			this.nombreCliente = nombreCliente
		}

		// 
		//  para crear un stream con dos subjects
		// 
		this.temaTrabajos = "trabajos"
		this.temaRespuestas = "respuestas"
		this.datosStream = {
			name: "colaDeTrabajos",
			subjects: [ this.temaTrabajos,
						this.temaRespuestas+".*" ], 
			retention: WorkQueuePolicy // no sé si es necesaria
		} 

		// 
		// Conecto con nats e inicializo worker o cliente
		// Lo hago dentro de una promesa que devuelvo
		// para poder hacer: await new ColaDeTrabajos
		// 
		return new Promise( async ( resolver, rechazar )  => {
			try {

				await this.conectarConNatsYCrearStream()

				if ( this.soyWorker ) {
					await this.iniciarWorker()
				}
				else if (this.soyCliente ) {
					await this.iniciarCliente( )
				} else {
					rechazar( "no soy worker ni cliente ???" )
				}

				resolver( this )
			} catch( error ) {
				rechazar( error )
			}
		})
	} //  ()

	// -----------------------------------------------------------------
	//  f() <--
	//      -->
	// -----------------------------------------------------------------
	async conectarConNatsYCrearStream() {

		debug( "ColaDeTrabajos.conectarConNatsYCrearStream()" )
		
		// 
		// abro conexión con nats y
		// objtengo un manager y un client de jetstream
		// 
		this.conexion = await connect( 
			{ servers: this.urlNats }
		)

		this.jsManager = await this.conexion.jetstreamManager()
		this.jsClient = await this.conexion.jetstream()

		// 
		// creo el stream en nats-jetstrem
		// 
		await this.jsManager.streams.add( this.datosStream )
	} //  ()

	// -----------------------------------------------------------------
	//  f() <--
	//      -->
	// -----------------------------------------------------------------
	async iniciarWorker() {
		debug( "ColaDeTrabajos.iniciarWorker()" )

		assert( this.soyWorker )

		try {

			this.workerDurableName = "WORKER"

			// pull subscription : pediremos mensaje con pull
			this.suscripcionWorker = await this.jsClient.pullSubscribe(
				this.temaTrabajos,
				{ config: { durable_name: this.workerDurableName } }
			)

			assert( this.suscripcionWorker )

/*
			if ( debug.DEBUG ) {
				console.log( " \n\n\n ++++++++ consumer info del worker ++++ " )
				const consumerInfo = await this.jsManager.consumers.info(
					this.datosStream.name, this.workerDurableName )
				console.log( consumerInfo )
			}
*/

			debug( "ColaDeTrabajos.iniciarWorker() FIN" )
		} catch( error ) {
			debug( "xxxxxxxxxx Error iniciar worker xxxxxxxxxxxxxxxxxxxxxxx" )
			debug( error ) 
			throw "inciarWorker() " + error 
		}
		
	} //  ()

	// -----------------------------------------------------------------
	//  f() <--
	//      -->
	// -----------------------------------------------------------------
	async iniciarCliente( ) {
		debug( "ColaDeTrabajos.iniciarCliente(): " + this.nombreCliente )

		assert( this.soyCliente )
		assert( this.nombreCliente )

		try {
			this.clienteDurableName = this.nombreCliente
			
			// pull subscription
			this.suscripcionCliente = await this.jsClient.pullSubscribe(
				this.temaRespuestas + ".*", 
				{ config: { durable_name: this.clienteDurableName } }
			)


			assert( this.suscripcionCliente )
			
/*
			if ( debug.DEBUG ) {
				console.log( " \n\n\n ++++++++ consumer info del cliente ++++ " )
				const consumerInfo = await this.jsManager.consumers.info(
					this.datosStream.name, this.clienteDurableName )
				console.log( consumerInfo )
			}
*/
			
			debug( "ColaDeTrabajos.iniciarCliente(): FIN " )
			
		} catch( error ) {
			debug( "oooooooo Error iniciarcliente ooooooooooooooooooooooooo" )
			debug( error ) 
			throw "inciarCliente() " + error 
		}
		
	} //  ()

	// -----------------------------------------------------------------
	//   f() <--
	// -----------------------------------------------------------------
	async cerrar() {

		// 
		// No sé si es necesario, o al cerrar luego
		// la conexión con nats ya se cancelan
		// las suscripciones
		// 
		if ( this.suscripcionWorker ) {
			try {
				this.suscripcionWorker.destroy()
			} catch( error ) { }
		}

		if ( this.suscripcionCliente ) {
			try {
				this.suscripcionCliente.destroy()
			} catch( error ) { }
		}

		/*
		  NINGUNO de estos VA
		  mostrarObjeto( this.jsManager )
		  
		  this.jsManager.close()
		  this.jsCliente.close()
		  
		  mostrarObjeto( this.suscripcionWorker )
		  setTimeout( () => suscri.destroy(), timeout )
		  
		  if ( this.suscripcionWorker ) {
		  // this.suscripcionWorker.close() NO EXISTE
		  }
		*/
		
		
		// 
		//  ESTO SI QUE VA Y DEBE ESTAR
		// 
		// Cierro la conexion con nats.
		// No sé si haría falta cancelar suscripciones.
		await this.conexion.close()
		const err = await this.conexion.closed()

		if ( ! err ) {
			debug( "desconexion ok" )
		} else {
			throw err
		}
	} //  ()

	// -----------------------------------------------------------------
	// Utilidad
	// -----------------------------------------------------------------
	async muestraInfoStreams () {
		const losStreams = await this.jsManager.streams.list().next()

		console.log( " \n\n\n ++++++++ Info de los streams ++++++ " )
		losStreams?.forEach( (s) => { console.log( s ) } )
		console.log( " \n " )
	}

	// -----------------------------------------------------------------
	// trabajo: Trabajo
	// timeout: N            --> 
	//                           f() -->
	// Respuesta | Error     <--
	// -----------------------------------------------------------------
	// Para añadir un trabajo y esperar su respuesta con await
	// @return Promesa   para devolver la respuesta asíncronamente:
    //                   const respuesta = await cdtClient.anyadirTrabajoEsperando(
	// -----------------------------------------------------------------
	async anyadirTrabajoEsperando( trabajo, timeout=1000 ) {

		const self = this
		
		return new Promise( async function( resolver, rechazar ) {
			await self.anyadirTrabajo( trabajo, function( error, respuesta ) {
				// debug( " anyadirTrabajoEsperando(): " + error )
				// debug( " anyadirTrabajoEsperando(): " + respuesta )
				if( error ) {
					// debug( " anyadirTrabajoEsperando(): " + error )
					rechazar( error )
				} else {
					resolver( respuesta )
				}
			}, timeout) // anayadirTrabajo
		})
		
	} // ()

	// -----------------------------------------------------------------
	// trabajo: Trabajo 
	// timeout: N         -->
	//                       f() -->
	// Respuesta | Error  <--
	// idTrabajo: Texto
	// -----------------------------------------------------------------
	// Para añadir un trabajo y esperar su respuesta con callback o
	// añadirlo sin esperar respuesta.
	// Si se espera respuesta, habrá un timeout. Y si éste vence,
	// se devolverá null como respuesta
	// -----------------------------------------------------------------
	// @param trabajo    Trabajo = { idTrabajo: Texto,
	//                               funcion: Texto, parametros: Objeto }
	// @param callback   para devolver la respuesta asíncronamente
	// @return           el idenificador de trabajo
	// -----------------------------------------------------------------
	async anyadirTrabajo( trabajo, callback=null, timeout=1000 ) {
		debug( "ColaDeTrabajos.anyadirTrabajo()" )

		try {
			assert( this.soyCliente )
			assert( this.suscripcionCliente )
			assert( trabajo.funcion )
			assert( trabajo.parametros )
			
			if ( ! trabajo.idTrabajo ) {
				trabajo.idTrabajo = getRandomString()
			}
			
			debug( " añadiendo trabajo: " + trabajo.idTrabajo )
			// debug( trabajo )
			
			// 
			// 1. Si hay que  esperar la respuesta a este trabajo
			//  Primero se isntalla la espera
			// 
			if ( callback ) {
				let suscripcion = await this.conexion.subscribe(
					this.temaRespuestas+"."+trabajo.idTrabajo,
					// auto-unsuscribe después de recibir
					// un mensaje: max=1
					{ max: 1, 
					  // con callback
					  callback: function( err, resp ) {
						  if ( err ) {
							  callback( err, null )
							  return
						  }
						  // /debug( "\n+\n+\n+\n+\n+" )
						  let respuesta = JSON.parse( codificador.decode( resp.data ) )
						  callback(null, respuesta)
					  } // callback
					}
				) // subscribe
				
				// chapucilla para tener un timeout
				// si vence, cancelará la suscripción
				setTimeout( async () => {
					try { 
						// debug( " --> TIMEOUT esperando respuesta " )
						await suscripcion.close()
						callback( "TIMEOUT esperando  RESPUESTA", null )
					} catch( error ) {
						callback( "TIMEOUT esperando  RESPUESTA:"+error, null )
					}
				}, timeout )
			} // if callback

			// 
			// 2. Envío el trabajo al stream
			// 
			await this.jsClient.publish(
				this.temaTrabajos,
				codificador.encode( JSON.stringify( trabajo ) ),
				// Mejor ponerlo. Así no encola dos entradas con el mismo
				// idTrabajo !!!
				{ msgID: this.temaTrabajos+"."+trabajo.idTrabajo }
			)
			
			// 
			// 
			// 
			return trabajo.idTrabajo
		} catch( error ) {
			if ( callback ) {
				callback( error, null )
			}
			return null
		}
	} //  ()

	// -----------------------------------------------------------------
	// idTrabajo: Texto
	// timeout: N             --> f() <--
	// Respuesta | null       <--
	// -----------------------------------------------------------------
	// Busca la respuesta a idTrabajo en el stream. Espera un máximo
	// de timeout milisegundos
	// -----------------------------------------------------------------
	async pedirRespuesta( idTrabajo, timeout=20 ) {

		assert( idTrabajo )

		// Creo que es un tanto complicado, pero no he visto cómoo
		// hacerlo más sencillo

		try {
			// me suscribo para recibir un único mensaje
			// con un nombre aleatorio. Esto permitirá leer
			// cualquier mensaje de respuesta en el stream
			// auqnue otro lo hubiera leído
			let suscri = await this.jsClient.pullSubscribe(
				this.temaRespuestas + "." + idTrabajo  // subject
				, {
					max: 1,  /* para obtener un mensaje
							  * y cancelar suscripcion */
					timeout: timeout, // NO LE HACE CASO
					config: {
						timeout: timeout, // NO LE HACE CASO
						// me invento el nombre
						// del suscriptor porque es efímero
						durable_name: getRandomString()
					}
				}
			) // jsClient.pullSubscribe

			// pido el mensaje
			suscri.pull( )				

			// chapucilla para tener un timeout
			// si vence, cancelará la suscripción
			// y nos sacar´a del for await
			setTimeout( async () => {
				try { 
					await suscri.destroy()
				} catch( error ) { }
			}, timeout )

			// 
			// espero el mensaje
			// debug( "pedirRespuesta(): ESPERANDO la respuesta " )
			for await (const m of suscri ) {
				/*
				debug( " =========== " )
				debug( " pedirRespuesta(): " +
					   JSON.parse( codificador.decode( m.data ) ) )
				debug( m.subject )
				debug( m.data )
				debug( codificador.decode( m.data ) )
				debug( " =========== " )
				*/

				//
				// Había una respuesta: la devuelvo
				//
				return JSON.parse( codificador.decode( m.data ) )
			} // for await

			// Si llego aquí es que no había mensaje
			// Deuelvo null
			// suscri.destroy() ???
			// try { suscri.destroy() } catch( error ) { } AUN ASI FALLA
			return null
			
		} catch( error ) {
			debug( error )
			throw( error )
		}
	} // ()

	// -----------------------------------------------------------------
	//                  f() <--
	// ConsumerInfo <--
	// -----------------------------------------------------------------
	async getWorkerConsumerInfo() {
		return await this.jsManager.consumers.info(
			this.datosStream.name, this.workerDurableName )
	} // ()

	// -----------------------------------------------------------------
	//       f() <--
	// N <--
	// -----------------------------------------------------------------
	async getWorkerNumPendigMessages() {
		const info = await this.getWorkerConsumerInfo()
		return info.num_pending
	}
	// -----------------------------------------------------------------

	// -----------------------------------------------------------------
	// Utilidad
	// -----------------------------------------------------------------
	async muestraInfoWorker() {
		console.log( " \n\n\n ++++++++ consumer info del worker ++++ " )
		const consumerInfo = await this.getWorkerConsumerInfo()
		console.log( consumerInfo )
	} // ()


	// -----------------------------------------------------------------
	// timeout: N      -->
	//                     f() <--
	// Trabajo | null  <--
	// -----------------------------------------------------------------
	// Trabajo = { idTrabajo: Texto, funcion: Texto, parametros: Objeto }
	// @return    el trabajo o null si no hay ninguno
	// -----------------------------------------------------------------
	async pedirTrabajo( timeout = 0 ) {
		assert( this.soyWorker, "sólo un worker puede pedir trabajo" )

		let m = null

		// 
		// primer intento de lectura de mensaje
		// 
		try {
			m = await this.jsClient.pull( this.datosStream.name, 
										  this.workerDurableName )
		} catch( error ) {
		}

		// 
		// si no obtuvimos un mensaje y no hay timeout
		// devuelvo null
		// 
		if ( m == null && timeout == 0 ) {
			return null
		}

		// 
		// si no obtuvimos un mensaje y sí hay timeout
		//  espero y sigo:w
		// 
		if ( m == null & timeout > 0 ) {
			await esperar( timeout )
		}

		// 
		// segundo intento de lectura de mensaje,
		// Si falla: return null
		// 
		if ( m == null ) {
			try {
				m = await this.jsClient.pull( this.datosStream.name, 
										  this.workerDurableName )
			} catch( error ) {
				return null
			}
		}

		// 
		// según la documenación, el pull dispara excepción si
		// no se lee ningún  mensaje, pero por si acaso
		// 
		if ( m == null ) {
			return null
		}

		// 
		//  tengo mensaje
		// 
		debug( `${m.info.stream}->${m.seq}: ack: ${m.didAck}: -->` + m )
				
		try {
			let trabajo = JSON.parse( codificador.decode( m.data )  )
			// debug( " trabajo recibido" + JSON.stringify( trabajo ) )
			
			//
			// He de gaurdar el mensaje original para poder
			// luego, cuando esté completado, hacer ack()
			// Por eso necesito el trabajo en el método
			// responderATrabajo()
			//
			trabajo.mensajeOriginal = m
			
			return trabajo
			
			
		} catch( error ) {
			throw " pedirTrabajo()  " + error
		}
	} // ()

/* pruebas que hice
	async pedirTrabajo2( timeout = 0 ) {
		assert( this.soyWorker, "sólo un worker puede pedir trabajo" )



		try {

			/ *
			debug( "**** pedirTrabajo(): timeout=" + timeout )

			var n = await this.getWorkerNumPendigMessages() 

			if ( n == 0 && timeout > 0 ) {
				await esperar( timeout )
				n = await this.getWorkerNumPendigMessages() 
			}	

			debug( "******\n mensajes: n = " + n )

			if ( n == 0 ) {
				return null
			}
* /

			// hay que hacer pull para luego poder recibir
			this.suscripcionWorker.pull()
			this.suscripcionWorker.pull()
			this.suscripcionWorker.pull()
			this.suscripcionWorker.pull()
			this.suscripcionWorker.pull()
			
			debug( "ColaDeTrabajos.pedirTrabajo(): ESPERANDO !!!!" )
			
			// redibo el mensaje con el trabajo
			var m = 1234

			mostrarObjeto( this.suscripcionWorker )

			this.muestraInfoWorker()

			for await ( m of this.suscripcionWorker ) {
				// debug( " ******************************************** " )
				debug( `${m.info.stream}->${m.seq}: ack: ${m.didAck}: -->` + m )
				
				let trabajo = JSON.parse( codificador.decode( m.data )  )
				// debug( " trabajo recibido" + JSON.stringify( trabajo ) )

				//
				// He de gaurdar el mensaje original para poder
				// luego, cuando esté completado, hacer ack()
				// Por eso necesito el trabajo en el método
				// responderATrabajo()
				//
				trabajo.mensajeOriginal = m
				
				return trabajo
			} // for

			debug( "ColaDeTrabajos.pedirTrabajo(): ¿¿¿¿ despues del for ???? : m = " + m )
			return null
			
		} catch( error ) {
			debug( " pedirTrabajo()  " + error )
			throw " pedirTrabajo()  " + error
		}
	} // ()
*/

	// -----------------------------------------------------------------
	// trabajo: Trabajo
	// respuesta: Respuesta --> f() -->
	// -----------------------------------------------------------------
	//  Respuesta = { idTrabajo: Texto, estado: Texto, respuesta: Objeto }
	// -----------------------------------------------------------------
	async responderATrabajo( trabajo, respuesta ) {
		debug( "ColaDeTrabajos.responderATrabajo()" )
		assert( this.soyWorker )
		assert( this.suscripcionWorker )
		assert( trabajo.mensajeOriginal )
		assert( trabajo.idTrabajo )
		assert( respuesta.estado )
		assert( respuesta.respuesta )

		// Han de coincidir. Lo copio por si no lo pusieron
		respuesta.idTrabajo = trabajo.idTrabajo

		try {
		
			debug( " respondiendo a trabajo: " + respuesta.idTrabajo )
			// 
			// 1. respondo a trabajo dejándolo en el stream
			// en el tema respuestas.*
			// con el tema respuestas.idTrabajo
			//
			await this.jsClient.publish(
				this.temaRespuestas + "." + trabajo.idTrabajo, 
				codificador.encode( JSON.stringify( respuesta ) ),
				// Esto descarta respuestas repetidas en el stream
				// (usamos como ID, tambien el mismo tema del mensaje:
				// respuestas.idTrabajo)
				// Debe ser distinto del msgID del encargo del trabajo
				// para no colisionar con él
				{ msgID: this.temaRespuestas+"."+respuesta.idTrabajo }
			)
			
			// 
			// 1.1 hago ack como que he resuelto el trabajo 
			//
			await trabajo.mensajeOriginal.ack()
			// se podria borrar el mensaje por subject
			// await jsm.streams.purge( stream, { filter: "a.b" }

			//
			// 2. También publico la respuesta con pub.
			// (Si el cliente no ha puesto un sub, la respuesta por esta
			// vía se pierde)
			//
			// Ahora dudo si esto ohace falta porque al ponerlo
			// el cliente ve dos veces la respuesta

			// Según parece, no hace falta, porque se ve que
			// el publish anterior
			// a partede de dejarlo persistentemente en el stream,
			// también lo publica como habitualmente
			/*
			await this.conexion.publish( 
				this.temaRespuestas + "." + trabajo.idTrabajo, 
				codificador.encode( JSON.stringify( respuesta ) )
			)
			*/

			//
			debug( `trabajo ${respuesta.idTrabajo} RESPONDIDO !!!!` )

		} catch( error ) {
			debug( error )
			throw "responderATrabajo(): " + error 
		}
			
	} //  ()

	// -----------------------------------------------------------------
	// Utilidad para hacer pruebas. Espera todas los mensajes
	// de trabajos que se hayan encargado
	// -----------------------------------------------------------------
	async esperarTrabajos() {
		debug( "*******************************************************" )
		debug( "\n\nColaDeTrabajos.esperarTrabajos()" )
		debug( "*******************************************************" )

		assert( this.soyWorker )
		assert( this.suscripcionWorker )

		const NOMBRE =  getRandomString()
		try {
			let suscri = await this.jsClient.pullSubscribe(
				this.temaTrabajos 
				, {
					config: {
						durable_name: NOMBRE
						  , callback: function( error, resp ) {
							  debug( " ++++++++++++" )
							  debug( " ++++++++++++" )
						  }
					} // config
					, callback: function( error, resp ) {
						debug( " +++ 2 +++++++++" )
						debug( " ++++ ++++++++" )
					} // callback
				}
			)

/*
			let pa = await this.jsClient.publish( this.temaTrabajos )
			debug( "pa ------------------------------------------" )
			console.log( pa.stream )
*/

			// await this.muestraInfoWorker()

			debug( " espesaraTrabajos(): pulling " )
			// /let kk = await this.jsClient.pull( "colaDeTrabajos", NOMBRE )
			// /debug( "kk ------------------------------------------" )
			// /debug( kk )
			// const losStreams = await this.jsManager.streams.list().next() console.log( losStreams )
			// /debug( "kk ------------------------------------------" )


			debug( " esperarTrabajos(): esperando " )

			// mostrarObjeto( suscri )

// 			let m = await suscri[Symbol.asyncIterator]().next() // OK
			// let {done, m}  = await suscri.next()
			// let {done, m}  = suscri[Symbol.asyncIterator]().next()

			let m = await this.jsClient.pull( "colaDeTrabajos", NOMBRE )



			debug( "1 ------------------------------------------" )
			debug( m )
			debug( "2 ------------------------------------------" )
			debug( m.subject )
			debug( "3 ------------------------------------------" )
			debug( codificador.decode( m.data ) )
			// let trabajo = codificador.decode( m.value.msg._rdata ) 

			// console.log( trabajo )
			debug( "3.1 ------------------------------------------" )
			// // console.log( trabajo[3] )
			debug( "4 ------------------------------------------" )
			let trabajo = JSON.parse( codificador.decode( m.data ) )
			// trabajo = JSON.parse( codificador.decode( m.data ) )

			// let msg = codificador.decode( m.msg )
			debug( "5 ------------------------------------------" )
			debug( trabajo )
			debug( "6 ------------------------------------------" )

// 			let m = await suscri.asyncIterator()

	// 		debug( m )
			debug( " espesaraTrabajos(): MENSAJE !!!! " )

			// suscri.destroy()
		} catch( error ) {
			console.log( error )
		}
	} // ()


/*

	
	async esperarTrabajos2() {
		debug( "*******************************************************" )
		debug( "\n\nColaDeTrabajos.esperarTrabajos()" )
		debug( "*******************************************************" )

		assert( this.soyWorker )
		assert( this.suscripcionWorker )
		

		try {
			let suscri = await this.jsClient.pullSubscribe(
				this.temaTrabajos 
				, {
					config: {
						durable_name: getRandomString()
						  , callback: function( error, resp ) {
						  debug( " ++++++++++++" )
						  debug( " ++++++++++++" )
						  }
					}
				}
			)

			var contador = 0
			debug( " ..... esperando 1 " )
			suscri.pull()				
			while( true ) {
				for await (var m of suscri ) {

					debug( " *************************** " )
					mostrarObjeto( m )
					debug( " *************************** " )

					contador++

					debug( " == 1 ======== contador: " + contador)
					debug( m.subject )
					
					let trabajo = JSON.parse( codificador.decode( m.data ) )
					
					debug( " recibo trabajo: " )
					debug( trabajo )
					
					trabajo.mensajeOriginal = m
					
					await this.responderATrabajo(
						trabajo,
						{ estado: "OK", respuesta: { c:3, d:4 } } // respuestas
					)
					
					debug( " === 2 ======== " )
					
					debug( " ..... esperando 2 " )
					suscri.pull()				

					break
				} // for

				debug( "   *** tras el for **** " )
				await esperar( 500 )
			} // while true
				
			// suscri.destroy()
		} catch( error ) {
			console.log( error )
		}
	} // ()
*/

	// -----------------------------------------------------------------
	// Utilidad para hacer pruebas. Espera todas las respuestas a
	// los trabajos que se hayan encargado
	// -----------------------------------------------------------------
	async esperarRespuestasATrabajos() {
		debug( "\n\nColaDeTrabajos.esperarRespuestasATrabajos()" )
		assert( this.soyCliente )
		assert( this.suscripcionCliente )
		
		try {

			/*
			// prueba para buscar un mensaje en el stream
			// por su subject: NO VA
			const prueba = this.jsManager.streams.getMessage(
				this.datosStream.name,
				{ filter: "respuestas.primerTrabajo" } NO VA
			)
			*/
			try {
				// así parece que podría buscar un mensaje por tema
				let suscri = await this.jsClient.pullSubscribe(
					this.temaRespuestas + ".primerTrabajo" // 
					, {
						config: {
							durable_name: getRandomString()
							/*
							, callback: function( error, resp ) {
								debug( " =========== " )
								debug( " =========== " )
							}
							*/
						}
					}
				)
				suscri.pull()				
				for await (const m of suscri ) {
					debug( " =========== " )
					debug( m.subject )
					debug( " =========== " )
					break;
				}

				// suscri.destroy()
			} catch( error ) {
				console.log( error )
			}
		
			// hay que hacer pull para luego poder recibir
			this.suscripcionCliente.pull()
			debug( "\n\nColaDeTrabajos.esperarRespuestasATrabajos()" )

			// 
			// esperar mensaje
			// 
			for await (const m of this.suscripcionCliente ) {

				debug( "\n***\n***\n*** ColaDeTrabajos.esperarRespuestasATrabajos() : llega respuesta: !!!!! " )

				debug( "   subject = " + m.subject + " seq: " + m.seq )

				let respuesta = codificador.decode( m.data ) 
				
				debug( "\n***\n***\n *** : llega respuesta: " + respuesta )
				
				// 
				// 
				// 
				await m.ack()
				// se podria borrar el mensaje por subject
				// await jsm.streams.purge( stream, { filter: "a.b" }

			// hay que hacer pull para luego poder recibir
				this.suscripcionCliente.pull()
			} // for

		} catch( error ) {
			throw "esperarRespuestasATrabajos()  " + error
		}
	} // ()
		
} // class
// ---------------------------------------------------------------------
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// ---------------------------------------------------------------------
module.exports = { ColaDeTrabajos, esperar, getRandomString, mostrarObjeto }
// ---------------------------------------------------------------------
// ---------------------------------------------------------------------
