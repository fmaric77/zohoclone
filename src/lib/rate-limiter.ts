/**
 * Rate limiter for email sending
 * Ensures maximum send rate of 14 emails per second
 */

class EmailRateLimiter {
  private sendTimes: number[] = []
  private readonly maxPerSecond = 14
  private readonly windowMs = 1000

  /**
   * Wait if necessary to maintain the rate limit
   * Returns a promise that resolves when it's safe to send the next email
   */
  async waitForSlot(): Promise<void> {
    const now = Date.now()
    
    // Remove timestamps older than 1 second
    this.sendTimes = this.sendTimes.filter(
      (time) => now - time < this.windowMs
    )

    // If we're at the limit, wait until the oldest send is outside the window
    if (this.sendTimes.length >= this.maxPerSecond) {
      const oldestTime = this.sendTimes[0]
      const waitTime = this.windowMs - (now - oldestTime) + 10 // Add 10ms buffer
      
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
      
      // Clean up again after waiting
      const afterWait = Date.now()
      this.sendTimes = this.sendTimes.filter(
        (time) => afterWait - time < this.windowMs
      )
    }

    // Record this send time
    this.sendTimes.push(Date.now())
  }

  /**
   * Reset the rate limiter (useful for testing or cleanup)
   */
  reset(): void {
    this.sendTimes = []
  }
}

// Export a singleton instance
export const emailRateLimiter = new EmailRateLimiter()

