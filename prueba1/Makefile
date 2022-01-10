NATS_NAME = natssrv

help:
	@echo
	@echo "make all (para levantar todo de golpe)"
	@echo
	@echo "make natsup (levanta NATS)"
	@echo
	@echo "make natsdown (tumba NATS)"
	@echo
	@echo "make cliente"
	@echo
	@echo "make worker"
	@echo

all: natsup cliente worker

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
