import type { FileTableColumns } from '$lib/schema/campaign';

/**
 * Headers for Campaign files table
 */
export const FileTableHeaders: FileTableColumns[] = [
    {title: "File name", widthInPercent: 45},
    {title: "Size", widthInPercent: 20},
    {title: "Last modified", widthInPercent: 25},
    {title: "Download", widthInPercent: 10},
]

export const campaignsPerPage: number = 4;
