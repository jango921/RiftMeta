package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"

	"github.com/riftmeta/backend/internal/api"
	"github.com/riftmeta/backend/internal/api/handlers"
	"github.com/riftmeta/backend/internal/cache"
	"github.com/riftmeta/backend/internal/config"
	"github.com/riftmeta/backend/internal/db"
	"github.com/riftmeta/backend/internal/riot"
	"github.com/riftmeta/backend/internal/worker"
)

func main() {
	log, _ := zap.NewProduction()
	defer log.Sync()

	cfg, err := config.Load()
	if err != nil {
		log.Fatal("load config", zap.Error(err))
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Connect to PostgreSQL
	database, err := db.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal("connect postgres", zap.Error(err))
	}
	defer database.Close()
	log.Info("postgres connected")

	// Connect to Redis
	cacheClient, err := cache.New(cfg.RedisURL)
	if err != nil {
		log.Fatal("connect redis", zap.Error(err))
	}
	defer cacheClient.Close()
	log.Info("redis connected")

	// Riot API client
	riotClient := riot.New(cfg.RiotAPIKey)

	// Background worker (created before handler so handler can expose its status)
	w := worker.New(riotClient, database, cacheClient, log, cfg.DefaultRegion, cfg.DefaultRouting)

	// HTTP handler
	h := handlers.New(riotClient, cacheClient, database, w, cfg.DefaultRegion, cfg.DefaultRouting)
	app := api.NewRouter(h)

	go func() {
		// Initial run on startup
		runCtx, runCancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer runCancel()
		if err := w.RunOnce(runCtx); err != nil {
			log.Warn("worker initial run", zap.Error(err))
		}
	}()

	// Schedule worker to run every 4 hours via goroutine ticker
	go func() {
		ticker := time.NewTicker(4 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			runCtx, runCancel := context.WithTimeout(context.Background(), 30*time.Minute)
			if err := w.RunOnce(runCtx); err != nil {
				log.Warn("worker scheduled run", zap.Error(err))
			}
			runCancel()
		}
	}()

	// Start HTTP server
	go func() {
		log.Info("server starting", zap.String("port", cfg.Port))
		if err := app.Listen(":" + cfg.Port); err != nil {
			log.Fatal("server listen", zap.Error(err))
		}
	}()

	// Graceful shutdown on SIGINT/SIGTERM
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("shutting down")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	_ = shutdownCtx

	if err := app.Shutdown(); err != nil {
		log.Error("server shutdown", zap.Error(err))
	}
	log.Info("server stopped")
}
