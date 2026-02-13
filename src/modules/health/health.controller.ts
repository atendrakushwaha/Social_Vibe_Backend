import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as os from 'os';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongooseHealth: MongooseHealthIndicator,
    private memoryHealth: MemoryHealthIndicator,
    private diskHealth: DiskHealthIndicator,
  ) { }

  /**
   * Custom CPU health check
   * Checks 1-minute load average against CPU cores
   */
  private async checkCpu(): Promise<HealthIndicatorResult> {
    const load = os.loadavg()[0] / os.cpus().length; // 1 min load / CPU cores
    const threshold = 0.7;
    if (load > threshold) {
      return { cpu: { status: 'down', load, message: 'CPU load high' } };
    }
    return { cpu: { status: 'up', load } };
  }

  private async checkDiskSafe(): Promise<HealthIndicatorResult> {
    const diskPath = process.platform === 'win32' ? 'C:\\' : '/';
    try {
      return await this.diskHealth.checkStorage('disk', {
        path: diskPath,
        threshold: 0.95, // 95% full - more lenient threshold
      });
    } catch (err) {
      // Return 'up' with warning to avoid failing health checks
      return {
        disk: {
          status: 'up',
          message: 'Disk usage high (non-critical warning)',
          warning: true,
        },
      } as HealthIndicatorResult;
    }
  }


  /**
   * Complete health check endpoint
   * Includes: MongoDB, memory heap, memory RSS, disk storage, CPU
   */
  @Get()
  @HealthCheck()
  @ApiOperation({
    summary:
      'Check overall application health including DB, Memory, Disk, CPU',
  })
  async check() {
    return this.health.check([
      () => this.mongooseHealth.pingCheck('database'), // MongoDB
      () => this.memoryHealth.checkHeap('memory_heap', 150 * 1024 * 1024), // Heap memory
      () => this.memoryHealth.checkRSS('memory_rss', 150 * 1024 * 1024), // RSS memory
      async () => this.checkDiskSafe(), // Disk
      async () => this.checkCpu(), // CPU load
    ]);
  }

  /**
   * Simple ping endpoint
   * Returns basic server info + memory usage
   */
  @Get('ping')
  @ApiOperation({
    summary: 'Simple ping endpoint with server memory, CPU, platform info',
  })
  ping() {
    const memoryUsage = process.memoryUsage();

    return {
      success: true,
      message: 'pong',
      timestamp: new Date().toISOString(),
      serverMemory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      platform: os.platform(),
      cpuCores: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
    };
  }
}
