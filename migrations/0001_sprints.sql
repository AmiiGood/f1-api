CREATE TABLE `sprint_results` (
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
CREATE INDEX `idx_sprint_results_race` ON `sprint_results` (`race_id`);--> statement-breakpoint
CREATE INDEX `idx_sprint_results_driver` ON `sprint_results` (`driver_id`);--> statement-breakpoint
CREATE INDEX `idx_sprint_results_constructor` ON `sprint_results` (`constructor_id`);--> statement-breakpoint
CREATE TABLE `sprint_qualifying` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`race_id` text NOT NULL,
	`driver_id` text NOT NULL,
	`constructor_id` text NOT NULL,
	`position` integer NOT NULL,
	`sq1_time` text,
	`sq2_time` text,
	`sq3_time` text,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`constructor_id`) REFERENCES `constructors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sprint_qualifying_race` ON `sprint_qualifying` (`race_id`);