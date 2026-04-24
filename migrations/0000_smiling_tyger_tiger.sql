CREATE TABLE `circuits` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`country` text NOT NULL,
	`city` text,
	`length_km` real,
	`turns` integer,
	`lap_record_time` text,
	`lap_record_driver_id` text,
	`lap_record_year` integer,
	`latitude` real,
	`longitude` real,
	`layout_svg_url` text,
	`photo_url` text,
	`wikipedia_url` text,
	FOREIGN KEY (`lap_record_driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `constructor_standings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`season` integer NOT NULL,
	`round` integer NOT NULL,
	`constructor_id` text NOT NULL,
	`position` integer NOT NULL,
	`points` real NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`season`) REFERENCES `seasons`(`year`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`constructor_id`) REFERENCES `constructors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_cs_season_round` ON `constructor_standings` (`season`,`round`);--> statement-breakpoint
CREATE TABLE `constructors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`nationality` text NOT NULL,
	`base_location` text,
	`founded_year` integer,
	`first_entry_year` integer,
	`last_entry_year` integer,
	`founder` text,
	`logo_url` text,
	`primary_color` text,
	`secondary_color` text,
	`wikipedia_url` text
);
--> statement-breakpoint
CREATE TABLE `driver_standings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`season` integer NOT NULL,
	`round` integer NOT NULL,
	`driver_id` text NOT NULL,
	`constructor_id` text NOT NULL,
	`position` integer NOT NULL,
	`points` real NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`season`) REFERENCES `seasons`(`year`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`constructor_id`) REFERENCES `constructors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_ds_season_round` ON `driver_standings` (`season`,`round`);--> statement-breakpoint
CREATE INDEX `idx_ds_driver` ON `driver_standings` (`driver_id`);--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`full_name` text NOT NULL,
	`code` text,
	`permanent_number` integer,
	`nationality` text NOT NULL,
	`date_of_birth` text,
	`date_of_death` text,
	`place_of_birth` text,
	`status` text NOT NULL,
	`image_url` text,
	`wikipedia_url` text
);
--> statement-breakpoint
CREATE INDEX `idx_drivers_nationality` ON `drivers` (`nationality`);--> statement-breakpoint
CREATE INDEX `idx_drivers_status` ON `drivers` (`status`);--> statement-breakpoint
CREATE TABLE `qualifying` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`race_id` text NOT NULL,
	`driver_id` text NOT NULL,
	`constructor_id` text NOT NULL,
	`position` integer NOT NULL,
	`q1_time` text,
	`q2_time` text,
	`q3_time` text,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`constructor_id`) REFERENCES `constructors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_qualifying_race` ON `qualifying` (`race_id`);--> statement-breakpoint
CREATE TABLE `races` (
	`id` text PRIMARY KEY NOT NULL,
	`season` integer NOT NULL,
	`round` integer NOT NULL,
	`name` text NOT NULL,
	`official_name` text,
	`circuit_id` text NOT NULL,
	`date` text NOT NULL,
	`time_utc` text,
	`weather` text,
	`has_sprint` integer DEFAULT false,
	FOREIGN KEY (`season`) REFERENCES `seasons`(`year`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`circuit_id`) REFERENCES `circuits`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_races_season` ON `races` (`season`);--> statement-breakpoint
CREATE INDEX `idx_races_circuit` ON `races` (`circuit_id`);--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`metric` text NOT NULL,
	`holder_type` text NOT NULL,
	`holder_id` text NOT NULL,
	`value` real NOT NULL,
	`date_set` text,
	`still_active` integer DEFAULT true
);
--> statement-breakpoint
CREATE INDEX `idx_records_category` ON `records` (`category`);--> statement-breakpoint
CREATE INDEX `idx_records_metric` ON `records` (`metric`);--> statement-breakpoint
CREATE TABLE `results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`race_id` text NOT NULL,
	`driver_id` text NOT NULL,
	`constructor_id` text NOT NULL,
	`position` integer,
	`position_text` text NOT NULL,
	`grid` integer,
	`laps` integer,
	`time_ms` integer,
	`status` text NOT NULL,
	`points` real DEFAULT 0 NOT NULL,
	`fastest_lap` integer DEFAULT false,
	`fastest_lap_time` text,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`constructor_id`) REFERENCES `constructors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_results_race` ON `results` (`race_id`);--> statement-breakpoint
CREATE INDEX `idx_results_driver` ON `results` (`driver_id`);--> statement-breakpoint
CREATE INDEX `idx_results_constructor` ON `results` (`constructor_id`);--> statement-breakpoint
CREATE TABLE `rivalries` (
	`id` text PRIMARY KEY NOT NULL,
	`driver_a_id` text NOT NULL,
	`driver_b_id` text NOT NULL,
	`start_year` integer NOT NULL,
	`end_year` integer,
	`era` text,
	`intensity` text,
	FOREIGN KEY (`driver_a_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`driver_b_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rivalry_key_races` (
	`rivalry_id` text NOT NULL,
	`race_id` text NOT NULL,
	PRIMARY KEY(`rivalry_id`, `race_id`),
	FOREIGN KEY (`rivalry_id`) REFERENCES `rivalries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `seasons` (
	`year` integer PRIMARY KEY NOT NULL,
	`champion_driver_id` text,
	`champion_constructor_id` text,
	`total_races` integer NOT NULL,
	`regulation_era` text,
	FOREIGN KEY (`champion_driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`champion_constructor_id`) REFERENCES `constructors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `translations` (
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`field` text NOT NULL,
	`lang` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`entity_type`, `entity_id`, `field`, `lang`)
);
--> statement-breakpoint
CREATE INDEX `idx_translations_lookup` ON `translations` (`entity_type`,`entity_id`,`lang`);