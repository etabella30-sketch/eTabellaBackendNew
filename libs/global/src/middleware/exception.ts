import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpErrorFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const exceptionResponse: any = exception.getResponse();
        // console.log(exceptionResponse)
        try {
            response
                .status(status)
                .json({
                    statusCode: status,
                    message: exceptionResponse.error,
                    detailedError: JSON.stringify(exceptionResponse) || 'An error occurred',
                    timestamp: new Date().toISOString(),
                });
        } catch (error) {
            response
                .status(status)
                .json({
                    statusCode: status,
                    message: exceptionResponse.error,
                    detailedError: 'An error occurred',
                    timestamp: new Date().toISOString(),
                });
        }

    }
}
