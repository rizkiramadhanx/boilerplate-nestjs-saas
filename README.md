

# NestJS Project - Auth with Google OAuth, Manual Auth, TypeORM (MySQL), Role System & AI-powered Generator

This is a **NestJS** project that implements authentication using both **Google OAuth** and **manual login** (username and password), a role-based user system, **TypeORM** for **MySQL** database integration, and a feature to **generate AI-based content** using an external API.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Database Entities](#database-entities)
- [AI Generator](#ai-generator)
- [License](#license)

## Features

- **Google OAuth 2.0 Authentication**: Allows users to log in with their Google accounts.
- **Manual Authentication**: Users can also register and log in with a username and password.
- **Role-based Authorization**: Supports user roles such as `user`, `admin`, etc.
- **MySQL Integration**: Uses **TypeORM** to manage entities and migrations.
- **AI-Powered Content Generation**: Integrates AI service to generate copywriting/content based on user input.

## Requirements

- **Node.js** (version 14 or higher)
- **MySQL** (for database)
- **Google Developer Console** (for Google OAuth)
- **OpenAI API** (for AI-based content generation)

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/soimalfath/qiblatbizzapi.git
   cd qiblatbizzapi
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create the MySQL database and configure your `.env` file.

## Configuration

1. **Google OAuth Setup:**
   - Go to [Google Developer Console](https://console.developers.google.com/).
   - Create a project and configure **OAuth Consent Screen**.
   - Set up OAuth 2.0 credentials for **Web Application**.
   - Note down the **Client ID** and **Client Secret**.

2. **Database Configuration:**
   - Make sure you have MySQL installed and running.
   - Create a `.env` file in the root of the project with the following structure:

     ```env
     # App
     PORT=5000
     FRONT_END_URL=https://your-frontend-url.com
     AUTH_CALLBACK=https://your-frontend-url.com/auth/callback

     # Database
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=root
     DB_PASSWORD=yourpassword
     DB_NAME=nestjs_project

     # JWT
     JWT_SECRET=your_jwt_secret
     JWT_EXPIRATION_TIME=3600

     JWT_SECRET_REFRESH=your_jwt_secret
     JWT_EXPIRES_IN_REFRESH=3d

     # Google OAuth
     GOOGLE_CLIENT_ID=your-google-client-id
     GOOGLE_CLIENT_SECRET=your-google-client-secret
     GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback

     # GEMINI
     GEMINI_APIKEY = your-apikey-gemini
     GEMINI_MODEL_NAME = gemini-1.5-flash-latest
     GEMINI_BASE_URL= https://generativelanguage.googleapis.com/v1beta/models/

     # AI API (e.g., OpenAI)
     AI_API_KEY=your-ai-api-key
     ```

3. **Run Migrations**:
   - Ensure the database is set up and then run:

     ```bash
     npm run typeorm migration:run
     ```

## Running the Application

- To run the application in development mode:

  ```bash
  npm run start:dev
  ```

- The app will be available at `http://localhost:5000`.

## API Endpoints

### Auth Endpoints

- **Google OAuth Login**:
  - `GET /auth/google`
  - Redirects the user to Google OAuth login.
  
- **Google OAuth Callback**:
  - `GET /auth/google/callback`
  - Handles the Google login callback.

- **Manual Login**:
  - `POST /auth/login`
  - Payload: `{ "email": "user@example.com", "password": "yourpassword" }`
  - Returns a JWT token.

- **Manual Registration**:
  - `POST /auth/register`
  - Payload: `{ "email": "user@example.com", "password": "yourpassword", "confirmPassword": "yourpassword" }`
  
- **User Profile** (Protected):
  - `GET /users/profile`
  - Requires JWT token.

### Role-Based Access

- **Admin Route** (only for users with the `admin` role):
  - `GET /admin`
  - Protected route that requires the user to have the `admin` role.

- **Role Management**:
  - `POST /admin/roles`
  - Allows assigning roles to users (e.g., `admin`, `user`).

### AI Generator

- **Generate Content** (Protected):
  - `POST /generate`
  - Payload: `{ "product": "Your Product", "type": "google-ads" }`
  - Requires JWT token.
  - Returns AI-generated content (copywriting) for various platforms (e.g., Meta Ads, Google Ads).

## Database Entities 

- **User Entity**:
  - Includes fields like `id`, `email`, `password`, `roles`, and `authProvider` (to distinguish between manual login and Google OAuth).

  ```typescript
  @Entity()
  export class User {
     @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  picture: string;

  @Column({ nullable: true })
  provider: string;

  @Column({ nullable: true })
  providerID: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER }) // Default role USER
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ProductEntity, (product) => product.user)
  products: ProductEntity;
  }
  ```

- **Roles**:
  - Enum: `admin`,  `user`, `sub-user`


## AI Generator

This feature uses an external AI API (e.g., OpenAI) to generate content such as copywriting. The service takes input (like product name and type of ad) and returns content optimized for platforms like Google Ads, Meta Ads, or landing pages.

Example usage:

```typescript
const response = await this.aiService.generateCopywriting({
  product: 'Awesome Product',
  type: 'google-ads',
});
```

## License

This project is licensed under the MIT License.

---

### Notes:
- **Google OAuth**: Ensure you have correct Google credentials and have set up OAuth properly.
- **Manual Authentication**: Be sure to handle hashing passwords before saving them in the database.
- **AI Integration**: You can use any AI service provider, like OpenAI, and configure it via the `.env` file.
