NATS_NAME=natssrv

help:
	@echo
	@echo "make all (ejecuta prueba 3)"
	@echo
	@echo "make natsup (levanta NATS)"
	@echo
	@echo "make natsdown (tumba NATS)"
	@echo
	@echo "make clienteEmisor"
	@echo
	@echo "make clienteReceptor"
	@echo
	@echo "make worker"
	@echo
	@echo "make clean"
	@echo

all: natsup
	gnome-terminal -e "node clienteReceptor.js"
	gnome-terminal -e "node clienteEmisor.js"

	gnome-terminal -e "node worker.js"
	gnome-terminal -e "node worker.js"
	gnome-terminal -e "node worker.js"

clienteEmisor:
	gnome-terminal -e "node clienteEmisor.js"

clienteReceptor:
	gnome-terminal -e "node clienteReceptor.js"

worker:
	gnome-terminal -e "node worker.js"

natsup:
	docker run -d --name $(NATS_NAME) \
	--rm  -p 4222:4222 nats -js

natsdown:
	docker stop $(NATS_NAME)

clean: natsdown
