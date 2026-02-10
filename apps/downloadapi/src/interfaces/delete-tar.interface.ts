export interface DeleteTarPayload {
    tarPath?: string;
    isJobDelete?: boolean; // Indicates if this is a job deletion or a specific tar deletion
    nDPid?: string; // Optional, used when deleting a folder
}