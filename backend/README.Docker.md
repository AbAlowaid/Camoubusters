# CamouBusters Backend - Docker Deployment

## Quick Start

### Using Docker Compose (Recommended)

1. **Ensure .env file exists in project root:**
```bash
# From project root
cat .env
# Should contain:
# GEMINI_API_KEY=your_api_key_here
# MIRQAB_API_KEY=your_mirqab_key
```

2. **Build and run:**
```bash
docker-compose up -d
```

3. **View logs:**
```bash
docker-compose logs -f backend
```

4. **Stop:**
```bash
docker-compose down
```

### Using Docker Directly

1. **Build the image:**
```bash
docker build -f backend/Dockerfile -t mirqab-backend .
```

2. **Run the container:**
```bash
docker run -d \
  --name mirqab-backend \
  -p 8000:8000 \
  -v $(pwd)/.env:/app/.env:ro \
  -v $(pwd)/backend/storage:/app/storage \
  -v $(pwd)/resnet_finetuned_best.h5:/app/resnet_finetuned_best.h5:ro \
  mirqab-backend
```

3. **View logs:**
```bash
docker logs -f mirqab-backend
```

4. **Stop and remove:**
```bash
docker stop mirqab-backend
docker rm mirqab-backend
```

## Configuration

### Environment Variables

Mount your `.env` file or set these environment variables:

- `GEMINI_API_KEY` - Google Gemini API key (required for AI analysis)
- `MIRQAB_API_KEY` - API key for Raspberry Pi authentication (optional)

### Volumes

- `./backend/storage` - Persists uploaded images and reports
- `./.env` - Environment configuration
- `./resnet_finetuned_best.h5` - Pre-trained model file

## API Endpoints

Once running, the API is available at `http://localhost:8000`

- **Health Check:** `GET /health`
- **API Docs:** `http://localhost:8000/docs`
- **Analyze Media:** `POST /api/analyze_media`
- **Get Reports:** `GET /api/detection-reports`
- **RAG Query:** `POST /api/moraqib_query`

## Troubleshooting

### Check container status
```bash
docker ps -a | grep mirqab
```

### Check health
```bash
docker inspect mirqab-backend | grep -A 10 Health
```

### Enter container shell
```bash
docker exec -it mirqab-backend bash
```

### View real-time logs
```bash
docker logs -f mirqab-backend
```

### Rebuild after code changes
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Production Considerations

1. **Use a production WSGI server** (already using uvicorn)
2. **Set proper API keys** in `.env`
3. **Configure firewall** to restrict port 8000
4. **Use nginx** as reverse proxy
5. **Enable HTTPS** with SSL certificates
6. **Monitor logs** and set up alerts
7. **Regular backups** of storage volume
