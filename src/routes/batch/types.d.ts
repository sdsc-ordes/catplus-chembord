interface Props {
    activefilesWithDownloadUrls: activefilesWithDownloadUrls,
    activeFolder: string,
    foldersWithFiles: foldersWithFiles,
    files: File,
    prefixQueried: string,
    bucket: string,
}

export const FileTableHeaders: String[] = ["File name", "Size", "Last modified", "Download"]
