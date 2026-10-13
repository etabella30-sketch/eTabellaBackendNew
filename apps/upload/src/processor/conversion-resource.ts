import { createHash } from 'crypto';
import { Job } from 'bull';

/** Each new converted document has a recoverable path unique to its durable source job. */
export function conversionOutputPath(job: Job, queue: 'convert' | 'convert-email', directory: string, name: string): string {
  if (job.data.data.converttype === 'C') return `${directory}/${name}.pdf`;
  if (job.id === undefined || job.id === null) throw new Error('Conversion job identity is unavailable');
  const operation = createHash('sha256').update(JSON.stringify([
    queue, String(job.id), job.data.cPath, job.data.nBundledetailid ?? null,
    job.data.data.nCaseid, job.data.data.nUPid ?? null,
  ])).digest('hex').slice(0, 24);
  return `${directory}/${name}_conversion_${operation}.pdf`;
}
