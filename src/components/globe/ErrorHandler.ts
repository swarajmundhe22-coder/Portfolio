/**
 * Enhanced Error Handling System
 * Comprehensive error management for globe component
 */

export class ErrorHandler {
  private errorLog: Array<{ timestamp: Date; error: Error; context?: string }> = [];
  private maxLogSize = 50;
  private errorCallback?: (error: Error, context?: string) => void;

  constructor(errorCallback?: (error: Error, context?: string) => void) {
    this.errorCallback = errorCallback;
  }

  /**
   * Handle and log error
   */
  public handle(error: Error | string, context?: string): void {
    const err = typeof error === 'string' ? new Error(error) : error;
    
    this.errorLog.push({
      timestamp: new Date(),
      error: err,
      context
    });

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    console.error(`[Globe Error${context ? ` - ${context}` : ''}]`, err);

    if (this.errorCallback) {
      this.errorCallback(err, context);
    }
  }

  /**
   * Get error log
   */
  public getLog(): Array<{ timestamp: Date; error: Error; context?: string }> {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  public clearLog(): void {
    this.errorLog = [];
  }

  /**
   * Get last error
   */
  public getLastError(): { timestamp: Date; error: Error; context?: string } | null {
    return this.errorLog[this.errorLog.length - 1] || null;
  }

  /**
   * Has errors
   */
  public hasErrors(): boolean {
    return this.errorLog.length > 0;
  }

  /**
   * Export error report
   */
  public exportReport(): string {
    const report = this.errorLog.map(entry => 
      `[${entry.timestamp.toISOString()}] ${entry.context ? `${entry.context}: ` : ''}${entry.error.message}\n${entry.error.stack}`
    ).join('\n\n');

    return report;
  }
}
