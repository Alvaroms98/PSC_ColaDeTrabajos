¿Hay que cambiar algo en ColaDeTrabajos para que un mismo trabajo pueda llegar a dos workers pero sólo se guarde la primera respuesta proporcionada? Probarlo. Si hay que realizar algún cambio, efectuarlo y realizar una prueba.

Se ha modificado el código de la cola para que nombre a los workers de distinta forma cada vez (segun el número de consumidores activos)
Y haciendo pruebas se ha podido observar que cuando los dos o mas worker responden al mismo trabajo, marcando la repuesta con el mismo 
ID del trabajo, nats descarta automáticamente respuestas repetidas.
