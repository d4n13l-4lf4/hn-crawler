CREATE TABLE `usage` (
	`request_id` text PRIMARY KEY,
	`request_timestamp` integer NOT NULL,
	`applied_filters` text NOT NULL,
	`duration_ms` integer NOT NULL
);
