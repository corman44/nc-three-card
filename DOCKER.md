# Docker Setup for Three Card Game

## Quick Start with Docker

### Prerequisites
- Docker installed on your machine
- Docker Compose (usually comes with Docker Desktop)

### Build and Run

**Using Docker Compose (Recommended):**

```bash
# Start the game
docker-compose up -d

# Stop the game
docker-compose down

# View logs
docker-compose logs -f

# Restart the game
docker-compose restart
```

**Using Docker directly:**

```bash
# Build the image
docker build -t three-card-game .

# Run the container
docker run -d -p 3333:3333 --name three-card-game three-card-game

# Stop the container
docker stop three-card-game

# Start the container again
docker start three-card-game

# Remove the container
docker rm three-card-game
```

### Access the Game

Once running, open your browser to:
- **http://localhost:3333**

### Useful Commands

```bash
# View running containers
docker ps

# View container logs
docker logs three-card-game

# Follow logs in real-time
docker logs -f three-card-game

# Rebuild after code changes
docker-compose up -d --build

# Stop and remove everything
docker-compose down
```

### Connecting from Other Computers

When running in Docker, other players can connect using your computer's IP address:
- **http://YOUR-IP-ADDRESS:3333**

To find your IP:
- **Windows**: `ipconfig`
- **Mac/Linux**: `ifconfig` or `ip addr`

### Firewall Configuration

If other players can't connect, make sure:
1. Port 3333 is open in your firewall
2. Docker has permission to bind to ports
3. You're all on the same network (or using port forwarding)

### Development Mode

For development with auto-restart, use the local installation instead:

```bash
npm run dev
```

Docker is best for production/deployment use.

## Troubleshooting

### Port Already in Use
If port 3333 is already taken, edit `docker-compose.yml`:
```yaml
ports:
  - "3334:3333"  # Change left number to different port
```

### Container Won't Start
Check logs:
```bash
docker-compose logs
```

### Rebuild After Changes
```bash
docker-compose up -d --build
```

### Clean Everything
```bash
# Remove container and image
docker-compose down
docker rmi three-card-game
```
