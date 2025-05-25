To run locally:
1. Rename the /backend/config.dev.env.example into /backend/config.dev.env
2. Set DB_HOST=localhost 
3. Set JWT strong secret key (Optional)
4. Enter SMTP provider email and password
5. Run `make up` under /backend directory

To deploy in production: 
1. Move /backend/config/config.dev.env.example into /backend/.env
2. Set DB_HOST=db
3. Set JWT strong secret key
4. Enter SMTP provider email and password
5. Go to root of project and run `make up` or `make rebuild`
