// Port for storing usage data

export interface UsageRepoPort {
  storeUsage(command: string, durationMs: number): Promise<void>;
}
