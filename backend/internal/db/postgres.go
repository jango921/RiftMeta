package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB wraps a pgxpool connection pool
type DB struct {
	Pool *pgxpool.Pool
}

// New connects to PostgreSQL and runs migrations
func New(ctx context.Context, databaseURL string) (*DB, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping postgres: %w", err)
	}

	d := &DB{Pool: pool}
	if err := d.migrate(ctx); err != nil {
		return nil, fmt.Errorf("migrate: %w", err)
	}

	return d, nil
}

// migrate runs all DDL migrations in order
func (d *DB) migrate(ctx context.Context) error {
	migrations := []string{
		createChampionStats,
		createChampionBuilds,
		createChampionRunes,
		createChampionCounters,
		createMatchCache,
	}

	for _, m := range migrations {
		if _, err := d.Pool.Exec(ctx, m); err != nil {
			return fmt.Errorf("exec migration: %w", err)
		}
	}
	return nil
}

// Close releases all pool connections
func (d *DB) Close() {
	d.Pool.Close()
}

// ---- DDL ----

const createChampionStats = `
CREATE TABLE IF NOT EXISTS champion_stats (
	champion_id  TEXT    NOT NULL,
	patch        TEXT    NOT NULL,
	role         TEXT    NOT NULL,
	region       TEXT    NOT NULL,
	wins         INTEGER NOT NULL DEFAULT 0,
	losses       INTEGER NOT NULL DEFAULT 0,
	games        INTEGER NOT NULL DEFAULT 0,
	bans         INTEGER NOT NULL DEFAULT 0,
	total_games  INTEGER NOT NULL DEFAULT 0,
	updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	PRIMARY KEY (champion_id, patch, role, region)
);`

const createChampionBuilds = `
CREATE TABLE IF NOT EXISTS champion_builds (
	champion_id  TEXT    NOT NULL,
	patch        TEXT    NOT NULL,
	role         TEXT    NOT NULL,
	region       TEXT    NOT NULL,
	build_data   JSONB   NOT NULL,
	sample_size  INTEGER NOT NULL DEFAULT 0,
	updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	PRIMARY KEY (champion_id, patch, role, region)
);`

const createChampionRunes = `
CREATE TABLE IF NOT EXISTS champion_runes (
	champion_id  TEXT    NOT NULL,
	patch        TEXT    NOT NULL,
	role         TEXT    NOT NULL,
	region       TEXT    NOT NULL,
	rune_data    JSONB   NOT NULL,
	sample_size  INTEGER NOT NULL DEFAULT 0,
	updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	PRIMARY KEY (champion_id, patch, role, region)
);`

const createChampionCounters = `
CREATE TABLE IF NOT EXISTS champion_counters (
	champion_id  TEXT    NOT NULL,
	patch        TEXT    NOT NULL,
	role         TEXT    NOT NULL,
	region       TEXT    NOT NULL,
	counter_data JSONB   NOT NULL,
	sample_size  INTEGER NOT NULL DEFAULT 0,
	updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	PRIMARY KEY (champion_id, patch, role, region)
);`

const createMatchCache = `
CREATE TABLE IF NOT EXISTS processed_matches (
	match_id   TEXT        NOT NULL PRIMARY KEY,
	region     TEXT        NOT NULL,
	patch      TEXT        NOT NULL,
	processed  BOOLEAN     NOT NULL DEFAULT FALSE,
	processed_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`
