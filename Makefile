up:
	docker-compose up -d
	
rebuild: 
	docker compose up --build -d 

down:
	docker compose down

logs:
	docker compose logs