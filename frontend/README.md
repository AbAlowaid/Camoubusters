# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.
## Docker Deployment

### Building and Running with Docker

**Using Docker directly:**

```sh
# Build the Docker image
docker build -t camoubusters-frontend .

# Run the container
docker run -d -p 3000:80 --name camoubusters-frontend camoubusters-frontend
```

**Using Docker Compose:**

```sh
# Build and start the container
docker-compose up -d

# Stop the container
docker-compose down
```

The application will be available at `http://localhost:3000`

### Docker Configuration

- **Dockerfile**: Multi-stage build using Bun for building and Nginx for serving
- **nginx.conf**: Custom Nginx configuration with caching and client-side routing support
- **.dockerignore**: Excludes unnecessary files from the Docker build context
- **docker-compose.yml**: Orchestration configuration for easy deployment

### Environment Variables

Configure your backend API URL by setting the `VITE_API_BASE_URL` environment variable before building:

```sh
# Build with custom API URL
docker build --build-arg VITE_API_BASE_URL=https://api.example.com -t camoubusters-frontend .
```
## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
