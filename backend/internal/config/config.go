package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	RiotAPIKey     string
	DatabaseURL    string
	RedisURL       string
	DefaultRegion  string
	DefaultRouting string
	Port           string
}

func Load() (*Config, error) {
	// Load .env if present; ignore error in production (env vars set externally)
	_ = godotenv.Load()

	cfg := &Config{
		RiotAPIKey:     os.Getenv("RIOT_API_KEY"),
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		RedisURL:       os.Getenv("REDIS_URL"),
		DefaultRegion:  getEnvOrDefault("DEFAULT_REGION", "na1"),
		DefaultRouting: getEnvOrDefault("DEFAULT_ROUTING", "americas"),
		Port:           getEnvOrDefault("PORT", "8080"),
	}

	return cfg, nil
}

func getEnvOrDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
