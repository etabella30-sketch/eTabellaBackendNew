import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

/*
 * The 'W' acknowledgement flag over HTTP (D16, spec 4.4 and 6.3 RC-4: "W needs acknowledgement").
 *
 * A venue session sealed with warnings ('W') publishes or exports only once someone has acknowledged its
 * incidents. The request says so with bAckWarnings: true; the gate then records the acknowledgement for the
 * token user (et_rtedge_warn_ack) before it lets the request through (acknowledgementRequested and
 * TranscriptCompletenessService.assertTranscriptComplete).
 *
 * realtime-server's global ValidationPipe runs with whitelist + forbidNonWhitelisted (main.ts), so a key a
 * DTO does not declare is a 400 before any controller runs. Every request DTO whose route reaches the gate
 * therefore declares the flag with this decorator:
 *   TranscriptPublishReq   POST transcript/publish
 *   getAnnotHighlightEEP   POST transcript/annothighlightexport (Transcript.interface.ts)
 *   getAnnotHighlightEEP   POST issue/annothighlightexport (issue.interface.ts)
 *   updateTransStatusMDL   POST session/updatetranscriptstatus
 * completeness-ack-http.spec.ts runs each of those routes through the real middleware, pipe and controller.
 *
 * Optional and boolean. JSON clients send true/false; the strings 'true' / 'false' (a form-encoded body)
 * are read as the booleans they name; any other value is a 400. A request without the flag is unchanged.
 */
export function AckWarningsFlag(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      example: false,
      required: false,
      description: "Acknowledge the incidents of a venue session sealed with warnings ('W') so it can be published or exported",
    }),
    IsOptional(),
    Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value), { toClassOnly: true }),
    IsBoolean(),
  );
}
