Añadir la siguiente funcionalidad a ColaDeTrabajos: purgar los trabajos con una cierta antigüedad (elegible) para los que existe una respuesta.

Con estado de desarrollo de la API de JetStreams actual, no es posible acceder al tiempo de creación de los mensajes a voluntad.
Esta información solo está disponible en el momento que se hace "pull". Como solución lo que se ha desarrollado es que cada worker elimine 
cada trabajo que haya sido respondido
