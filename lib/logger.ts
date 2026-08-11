export interface LogEntry {
  moduleName: string;
  startTime: string;
  endTime?: string;
  status: 'Started' | 'Success' | 'Error';
  error?: string;
  inputId?: string;
  outputId?: string;
}

export class Logger {
  static log(entry: LogEntry) {
    console.log(`[${new Date().toISOString()}] [${entry.moduleName}] - Status: ${entry.status}`);
    if (entry.error) {
      console.error(`[${entry.moduleName}] Error: ${entry.error}`);
    }
  }
}
