package api

import (
	"time"

	"github.com/gofiber/fiber/v2"
	fibercompress "github.com/gofiber/fiber/v2/middleware/compress"
	fibercors "github.com/gofiber/fiber/v2/middleware/cors"
	fiberlimiter "github.com/gofiber/fiber/v2/middleware/limiter"
	fiberlogger "github.com/gofiber/fiber/v2/middleware/logger"
	fiberrecover "github.com/gofiber/fiber/v2/middleware/recover"

	"github.com/riftmeta/backend/internal/api/handlers"
)

// NewRouter sets up the Fiber app with all middleware and routes
func NewRouter(h *handlers.Handler) *fiber.App {
	app := fiber.New(fiber.Config{
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	})

	// Middleware stack
	app.Use(fiberrecover.New())
	app.Use(fiberlogger.New(fiberlogger.Config{
		Format: "[${time}] ${method} ${path} ${status} ${latency}\n",
	}))
	app.Use(fibercors.New(fibercors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,OPTIONS",
		AllowHeaders: "Content-Type",
	}))
	app.Use(fibercompress.New())

	// Rate limit: 60 requests/minute per IP
	app.Use(fiberlimiter.New(fiberlimiter.Config{
		Max:        60,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// API v1 routes
	v1 := app.Group("/api")

	v1.Get("/version", h.GetVersion)
	v1.Get("/champions", h.ListChampions)
	v1.Get("/champions/:id", h.GetChampion)
	v1.Get("/champions/:id/stats", h.GetChampionStats)
	v1.Get("/champions/:id/builds", h.GetChampionBuilds)
	v1.Get("/champions/:id/runes", h.GetChampionRunes)
	v1.Get("/champions/:id/counters", h.GetChampionCounters)
	v1.Get("/meta/top", h.GetMeta)

	// Admin routes — worker control and diagnostics
	admin := v1.Group("/admin")
	admin.Get("/worker/status", h.GetWorkerStatus)
	admin.Post("/worker/run", h.TriggerWorker)
	admin.Get("/ping", h.PingRiotAPI)

	return app
}
