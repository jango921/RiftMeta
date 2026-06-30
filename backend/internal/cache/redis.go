package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Client wraps redis.Client with helper methods
type Client struct {
	rdb *redis.Client
}

// New creates a Redis client from a connection URL
func New(redisURL string) (*Client, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("parse redis url: %w", err)
	}

	rdb := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("ping redis: %w", err)
	}

	return &Client{rdb: rdb}, nil
}

// Set marshals v to JSON and stores it with the given TTL
func (c *Client) Set(ctx context.Context, key string, v any, ttl time.Duration) error {
	b, err := json.Marshal(v)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}
	return c.rdb.Set(ctx, key, b, ttl).Err()
}

// Get retrieves and unmarshals a JSON value into dest
func (c *Client) Get(ctx context.Context, key string, dest any) error {
	b, err := c.rdb.Get(ctx, key).Bytes()
	if err != nil {
		return err // propagates redis.Nil so callers can check
	}
	return json.Unmarshal(b, dest)
}

// Delete removes a key
func (c *Client) Delete(ctx context.Context, key string) error {
	return c.rdb.Del(ctx, key).Err()
}

// Exists returns true if the key is present
func (c *Client) Exists(ctx context.Context, key string) (bool, error) {
	n, err := c.rdb.Exists(ctx, key).Result()
	return n > 0, err
}

// IsNil reports whether err is the redis cache-miss sentinel
func IsNil(err error) bool {
	return err == redis.Nil
}

// Close shuts down the connection
func (c *Client) Close() error {
	return c.rdb.Close()
}

// TTL constants for consistent cache lifetimes
const (
	TTLVersion    = 1 * time.Hour
	TTLChampions  = 6 * time.Hour
	TTLStats      = 30 * time.Minute
	TTLBuilds     = 30 * time.Minute
	TTLRunes      = 30 * time.Minute
	TTLCounters   = 30 * time.Minute
	TTLMeta       = 15 * time.Minute
	TTLMatchData  = 24 * time.Hour
)
