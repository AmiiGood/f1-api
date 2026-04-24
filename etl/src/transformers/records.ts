export function recordsSQL(): string {
    // Todos los records se calculan desde datos ya cargados.
    // La tabla records guarda resultados agregados para servirlos instantáneos.
    return `
-- Limpia records previos
DELETE FROM records;

-- ═══ CLÁSICOS DRIVERS ═══

-- Most wins (driver)
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-wins-driver', 'driver', 'wins', 'driver', driver_id, COUNT(*) AS v
FROM results WHERE position = 1
GROUP BY driver_id ORDER BY v DESC LIMIT 1;

-- Most poles (driver)
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-poles-driver', 'driver', 'poles', 'driver', driver_id, COUNT(*) AS v
FROM qualifying WHERE position = 1
GROUP BY driver_id ORDER BY v DESC LIMIT 1;

-- Most podiums (driver)
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-podiums-driver', 'driver', 'podiums', 'driver', driver_id, COUNT(*) AS v
FROM results WHERE position <= 3
GROUP BY driver_id ORDER BY v DESC LIMIT 1;

-- Most championships (driver)
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-championships-driver', 'driver', 'championships', 'driver', champion_driver_id, COUNT(*) AS v
FROM seasons WHERE champion_driver_id IS NOT NULL
GROUP BY champion_driver_id ORDER BY v DESC LIMIT 1;

-- Most fastest laps (driver)
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-fastest-laps-driver', 'driver', 'fastest_laps', 'driver', driver_id, COUNT(*) AS v
FROM results WHERE fastest_lap = 1
GROUP BY driver_id ORDER BY v DESC LIMIT 1;

-- Most race entries (driver)
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-entries-driver', 'driver', 'entries', 'driver', driver_id, COUNT(*) AS v
FROM results
GROUP BY driver_id ORDER BY v DESC LIMIT 1;

-- Most career points (driver)
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-points-driver', 'driver', 'points', 'driver', driver_id, SUM(points) AS v
FROM results
GROUP BY driver_id ORDER BY v DESC LIMIT 1;

-- ═══ CLÁSICOS CONSTRUCTORS ═══

-- Most wins (constructor)
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-wins-constructor', 'constructor', 'wins', 'constructor', constructor_id, COUNT(*) AS v
FROM results WHERE position = 1
GROUP BY constructor_id ORDER BY v DESC LIMIT 1;

-- Most championships (constructor)
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-championships-constructor', 'constructor', 'championships', 'constructor', champion_constructor_id, COUNT(*) AS v
FROM seasons WHERE champion_constructor_id IS NOT NULL
GROUP BY champion_constructor_id ORDER BY v DESC LIMIT 1;

-- Most poles (constructor)
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-poles-constructor', 'constructor', 'poles', 'constructor', constructor_id, COUNT(*) AS v
FROM qualifying WHERE position = 1
GROUP BY constructor_id ORDER BY v DESC LIMIT 1;

-- Most podiums (constructor)
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-podiums-constructor', 'constructor', 'podiums', 'constructor', constructor_id, COUNT(*) AS v
FROM results WHERE position <= 3
GROUP BY constructor_id ORDER BY v DESC LIMIT 1;

-- ═══ JUGOSOS / TRIVIA ═══

-- Youngest race winner
INSERT INTO records (id, category, metric, holder_type, holder_id, value, date_set)
SELECT 'youngest-winner', 'driver', 'youngest_winner_days', 'driver', r.driver_id,
       (julianday(rc.date) - julianday(d.date_of_birth)) AS v,
       rc.date
FROM results r
JOIN races rc ON r.race_id = rc.id
JOIN drivers d ON r.driver_id = d.id
WHERE r.position = 1 AND d.date_of_birth IS NOT NULL
ORDER BY v ASC LIMIT 1;

-- Oldest race winner
INSERT INTO records (id, category, metric, holder_type, holder_id, value, date_set)
SELECT 'oldest-winner', 'driver', 'oldest_winner_days', 'driver', r.driver_id,
       (julianday(rc.date) - julianday(d.date_of_birth)) AS v,
       rc.date
FROM results r
JOIN races rc ON r.race_id = rc.id
JOIN drivers d ON r.driver_id = d.id
WHERE r.position = 1 AND d.date_of_birth IS NOT NULL
ORDER BY v DESC LIMIT 1;

-- Youngest pole sitter
INSERT INTO records (id, category, metric, holder_type, holder_id, value, date_set)
SELECT 'youngest-pole', 'driver', 'youngest_pole_days', 'driver', q.driver_id,
       (julianday(rc.date) - julianday(d.date_of_birth)) AS v,
       rc.date
FROM qualifying q
JOIN races rc ON q.race_id = rc.id
JOIN drivers d ON q.driver_id = d.id
WHERE q.position = 1 AND d.date_of_birth IS NOT NULL
ORDER BY v ASC LIMIT 1;

-- Youngest champion (solo temporadas completadas)
INSERT INTO records (id, category, metric, holder_type, holder_id, value, date_set)
SELECT 'youngest-champion', 'driver', 'youngest_champion_days', 'driver', s.champion_driver_id,
       (julianday(s.year || '-12-31') - julianday(d.date_of_birth)) AS v,
       s.year || '-12-31'
FROM seasons s
JOIN drivers d ON s.champion_driver_id = d.id
WHERE s.champion_driver_id IS NOT NULL
  AND d.date_of_birth IS NOT NULL
  AND s.year < (SELECT MAX(rc.season) FROM races rc WHERE rc.date <= date('now'))
ORDER BY v ASC LIMIT 1;

-- Most wins at a single circuit
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-wins-single-circuit', 'driver', 'wins_single_circuit', 'driver',
       driver_id || ' @ ' || circuit_id, v
FROM (
  SELECT r.driver_id, rc.circuit_id, COUNT(*) AS v
  FROM results r
  JOIN races rc ON r.race_id = rc.id
  WHERE r.position = 1
  GROUP BY r.driver_id, rc.circuit_id
  ORDER BY v DESC LIMIT 1
);

-- Most wins in a single season
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-wins-season', 'driver', 'wins_season', 'driver',
       driver_id || ' (' || season || ')', v
FROM (
  SELECT r.driver_id, rc.season, COUNT(*) AS v
  FROM results r
  JOIN races rc ON r.race_id = rc.id
  WHERE r.position = 1
  GROUP BY r.driver_id, rc.season
  ORDER BY v DESC LIMIT 1
);

-- Most consecutive wins
-- (approx: most wins by same driver across contiguous rounds in a season — ventana simple)
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-consecutive-wins', 'driver', 'consecutive_wins', 'driver', driver_id, MAX(streak)
FROM (
  SELECT driver_id,
         COUNT(*) AS streak
  FROM (
    SELECT r.driver_id,
           rc.season,
           rc.round,
           rc.round - ROW_NUMBER() OVER (PARTITION BY r.driver_id ORDER BY rc.season, rc.round) AS grp
    FROM results r
    JOIN races rc ON r.race_id = rc.id
    WHERE r.position = 1
  )
  GROUP BY driver_id, grp
)
GROUP BY driver_id ORDER BY MAX(streak) DESC LIMIT 1;

-- Most poles in a single season
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-poles-season', 'driver', 'poles_season', 'driver',
       driver_id || ' (' || season || ')', v
FROM (
  SELECT q.driver_id, rc.season, COUNT(*) AS v
  FROM qualifying q
  JOIN races rc ON q.race_id = rc.id
  WHERE q.position = 1
  GROUP BY q.driver_id, rc.season
  ORDER BY v DESC LIMIT 1
);

-- Most podiums in a single season
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-podiums-season', 'driver', 'podiums_season', 'driver',
       driver_id || ' (' || season || ')', v
FROM (
  SELECT r.driver_id, rc.season, COUNT(*) AS v
  FROM results r
  JOIN races rc ON r.race_id = rc.id
  WHERE r.position <= 3
  GROUP BY r.driver_id, rc.season
  ORDER BY v DESC LIMIT 1
);

-- Biggest qualifying-to-win comeback
INSERT INTO records (id, category, metric, holder_type, holder_id, value, date_set)
SELECT 'biggest-grid-to-win', 'race', 'grid_to_win', 'driver',
       r.driver_id || ' @ ' || r.race_id, r.grid, rc.date
FROM results r
JOIN races rc ON r.race_id = rc.id
WHERE r.position = 1 AND r.grid IS NOT NULL
ORDER BY r.grid DESC LIMIT 1;

-- Most different race winners in a season
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-different-winners-season', 'race', 'different_winners', 'constructor',
       CAST(season AS TEXT), v
FROM (
  SELECT rc.season, COUNT(DISTINCT r.driver_id) AS v
  FROM results r
  JOIN races rc ON r.race_id = rc.id
  WHERE r.position = 1
  GROUP BY rc.season
  ORDER BY v DESC LIMIT 1
);

-- Most 1-2 finishes (constructor)
INSERT INTO records (id, category, metric, holder_type, holder_id, value)
SELECT 'most-one-twos-constructor', 'constructor', 'one_twos', 'constructor', constructor_id, COUNT(*)
FROM (
  SELECT race_id, constructor_id
  FROM results
  WHERE position IN (1, 2)
  GROUP BY race_id, constructor_id
  HAVING COUNT(*) = 2
)
GROUP BY constructor_id ORDER BY COUNT(*) DESC LIMIT 1;
`;
}