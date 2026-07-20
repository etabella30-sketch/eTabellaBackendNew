import { Module } from '@nestjs/common';
import { CaseviewParserService } from './caseview-parser.service';
import { BridgeFramingService } from './bridge-framing.service';
import { BridgeParserService } from './bridge-parser.service';

/**
 * libs/feed-parse — singleton-free Eclipse feed parsers (Phase 2 of
 * docs/eclipse-wss-ingest-plan.md). Services here are STATELESS: every call
 * takes a SessionContext; nothing session-scoped may live on `this`.
 */
@Module({
  providers: [CaseviewParserService, BridgeFramingService, BridgeParserService],
  exports: [CaseviewParserService, BridgeFramingService, BridgeParserService],
})
export class FeedParseModule {}
