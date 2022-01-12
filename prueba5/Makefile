NATS_NAME=natssrv

help:
	@echo
	@echo "make all (ejecuta prueba 5)"
	@echo
	@echo "make natsup (levanta NATS)"
	@echo
	@echo "make natsdown (tumba NATS)"
	@echo
	@echo "make cliente <nombre>"
	@echo
	@echo "make workerTroll"
	@echo
	@echo "make workerHeroe"
	@echo
	@echo "make clean"
	@echo

all: natsup
	gnome-terminal -e "node cliente.js"

	gnome-terminal -e "node workerTroll.js"
	gnome-terminal -e "node workerHeroe.js"

cliente:
	gnome-terminal -e "node cliente.js"

workerTroll:
	gnome-terminal -e "node workerTroll.js"

workerHeroe:
	gnome-terminal -e "node workerHeroe.js"

natsup:
	docker run -d --name $(NATS_NAME) \
	--rm  -p 4222:4222 nats -js

natsdown:
	docker stop $(NATS_NAME)

clean: natsdown
