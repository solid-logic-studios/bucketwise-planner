import type { NextFunction, Request, Response } from 'express';
import type { IApplicationError } from '../../../application/errors/application-error.interface.js';
import { ErrorMapper } from '../../../application/errors/error-mapper.js';
import { ResponseFormatter } from '../utils/response-formatter.js';

/**
 * BaseController: Abstract base class for all HTTP controllers.
 * Provides common error handling, response formatting, and request validation.
 * All controllers should extend this class.
 * 
 * @abstract
 * @example
 * ```typescript
 * export class UserController extends BaseController {
 *   constructor(private userService: UserService) {
 *     super();
 *   }
 *   
 *   async getUser(req: Request, res: Response): Promise<void> {
 *     try {
 *       const user = await this.userService.findById(req.params.id);
 *       this.sendSuccess(res, user);
 *     } catch (error) {
 *       this.handleError(res, error);
 *     }
 *   }
 * }
 * ```
 */
export abstract class BaseController {
  /**
   * Check if running in development environment.
   * Determines whether to include detailed error info in responses.
   */
  protected isDevelopment = process.env.NODE_ENV !== 'production';

  /**
   * Send a successful response with data.
   * @param res - Express Response object
   * @param data - Data to send
   * @param statusCode - HTTP status code (default 200)
   */
  protected sendSuccess<T>(
    res: Response,
    data: T,
    statusCode = 200
  ): Response {
    return res.status(statusCode).json(ResponseFormatter.success(data));
  }

  /**
   * Send a created response (201).
   * @param res - Express Response object
   * @param data - Created resource data
   */
  protected sendCreated<T>(res: Response, data: T): Response {
    return this.sendSuccess(res, data, 201);
  }

  /**
   * Send an error response.
   * @param res - Express Response object
   * @param error - The error to handle
   */
  protected handleError(res: Response, error: unknown): Response {
    const appError = ErrorMapper.mapError(error, this.isDevelopment);
    return this.sendErrorResponse(res, appError);
  }

  /**
   * Send a formatted error response.
   * @param res - Express Response object
   * @param appError - IApplicationError with status code
   */
  protected sendErrorResponse(res: Response, appError: IApplicationError): Response {
    return res
      .status(appError.statusCode)
      .json(
        ResponseFormatter.error(
          appError.code || 'ERROR',
          appError.message,
          appError.details
        )
      );
  }

  /**
   * Wrap an async request handler to catch errors automatically.
   * Use this to wrap async controller methods.
   * 
   * @param fn - Async controller function
   * @returns Wrapped function that catches errors and calls handleError
   * @example
   * ```typescript
   * router.get('/:id', this.asyncHandler((req, res) => this.getUser(req, res)));
   * ```
   */
  public asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch((error) => {
        this.handleError(res, error);
      });
    };
  }
}
