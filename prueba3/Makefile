NATS_NAME=natssrv

help:
	@echo
	@echo "make all (ejecuta prueba 3)"
	@echo
	@echo "make natsup (levanta NATS)"
	@echo
	@echo "make natsdown (tumba NATS)"
	@echo
	@echo "make cliente <nombre>"
	@echo
	@echo "make worker"
	@echo
	@echo "make clean"
	@echo

all: natsup
	gnome-terminal -e "node cliente.js Cliente1"
	gnome-terminal -e "node cliente.js Cliente2"

	gnome-terminal -e "node worker.js"
	gnome-terminal -e "node worker.js"
	gnome-terminal -e "node worker.js"

cliente:
	gnome-terminal -e "node cliente.js"

worker:
	gnome-terminal -e "node worker.js"

natsup:
	docker run -d --name $(NATS_NAME) \
	--rm  -p 4222:4222 nats -js

natsdown:
	docker stop $(NATS_NAME)

clean: natsdown
