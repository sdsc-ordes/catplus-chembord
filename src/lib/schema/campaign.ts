/**
 * Interface for table columns of campaign file table
 */
interface FileTableColumns {
	title: string; // Column title
	widthInPercent: number // Column width in percent
}

export const FileTableHeaders: FileTableColumns[] = [
    {title: "File name", widthInPercent: 45},
    {title: "Size", widthInPercent: 20},
    {title: "Last modified", widthInPercent: 25},
    {title: "Download", widthInPercent: 10},
]
