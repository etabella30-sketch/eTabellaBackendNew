import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception instanceof HttpException ? exception.getStatus() : 500;
        const exceptionResponse: any = exception instanceof HttpException ? exception.getResponse() : { error: exception?.message || 'Internal Server Error' };
        // console.log(exceptionResponse)
        try {
            response
                .status(status)
                .json({
                    statusCode: status,
                    message: exceptionResponse.error || exceptionResponse.message || 'An error occurred',
                    detailedError: JSON.stringify(exceptionResponse) || 'An error occurred',
                    timestamp: new Date().toISOString(),
                });
        } catch (error) {
            response
                .status(status)
                .json({
                    statusCode: status,
                    message: 'An error occurred',
                    detailedError: exception?.message || 'An error occurred',
                    timestamp: new Date().toISOString(),
                });
        }

    }
}
