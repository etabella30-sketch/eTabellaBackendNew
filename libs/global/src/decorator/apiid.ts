// import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// export const ApiId = createParamDecorator((data: any, ctx: ExecutionContext) => {
//   const request = ctx.switchToHttp().getRequest();
//   request.apiId = data;  // Attach the custom ID (number or string) to the request object
//   return data;  // Return the ID if needed elsewhere
// });


import { SetMetadata } from '@nestjs/common';

// This decorator will be used as a method decorator to set the API ID
export const ApiId = (apiId: number): MethodDecorator => {
  return (target, key, descriptor: TypedPropertyDescriptor<any>) => {
    SetMetadata('apiId', apiId)(target, key, descriptor);
  };
};
