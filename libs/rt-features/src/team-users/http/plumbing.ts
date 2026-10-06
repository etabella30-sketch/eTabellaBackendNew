/**
 * The controller plumbing every shared controller of this feature uses, gathered once so the two controllers read
 * the same: the kernel's guards, decorators, filter and validation options, plus Nest's Inject.
 */
export { Inject } from '@nestjs/common';
export { Caller, CallerGuard, CaseScoped, CaseScopeGuard, DomainErrorFilter, RouteId, SHARED_VALIDATION } from '@app/api-kernel';
