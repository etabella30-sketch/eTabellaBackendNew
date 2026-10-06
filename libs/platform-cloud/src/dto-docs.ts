/**
 * Swagger docs for the shared DTOs (plan decision D9a). The request classes in @app/rt-features carry class-validator
 * rules only: the venue box bundle has no @nestjs/swagger package, so a shared DTO may not import it. The live hosts
 * get their docs back from here: `applyDtoDocs(Dto, {field: options})` runs `ApiProperty(options)(Dto.prototype,
 * field)` for every field named, which is exactly what the decorator would have recorded had it been written on the
 * class. `design:type` is already on every validated field (any property decorator makes TypeScript emit it), so the
 * schema type is inferred as before. Idempotent: swagger's own decorator merges a second application into the first.
 *
 * The per-feature files live in ./docs/<feature>.docs.ts and are called from each host's main.ts before
 * SwaggerModule.createDocument (the plan's "at live boot"). A host imports `@app/platform-cloud/docs/<feature>.docs`
 * for each feature it mounts, never through the root barrel: the root is imported by every live host (authapi
 * included) for the port adapters and must pull no feature code, and there is no docs barrel either, so coreapi never
 * bundles a feature it does not mount.
 */
import { Type } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';

/** Per field of T: the options the class would have carried on @ApiProperty. */
export type DtoDocs<T> = Readonly<Partial<Record<Extract<keyof T, string>, ApiPropertyOptions>>>;

/** Records ApiProperty metadata for every documented field of the class; a field left out stays undocumented. */
export function applyDtoDocs<T extends object>(target: Type<T>, docs: DtoDocs<T>): void {
  for (const [field, options] of Object.entries(docs) as Array<[string, ApiPropertyOptions | undefined]>) {
    if (options) ApiProperty(options)(target.prototype, field);
  }
}
