"use strict";
//  ======  File Logging   ======
// writeLog( fileHandle, "Text" );
// fileHandle = { path: './logs/airquality', file: 'logs.txt' };
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeLog = writeLog;
const fs_1 = require("fs");
/**
 * Writes a log entry to a file.
 *
 * @param fileObj The file object containing the path and filename.
 * @param logEntry The log entry to write.
 */
function writeLog(fileObj, logEntry) {
    // Get the current date and time
    const now = new Date();
    const dateTime = now.toLocaleString('fr-CH'); // best format for log-entrys
    // Format the log entry
    const data = `${dateTime}\t${logEntry}\n`;
    return appendDataToFile(fileObj, data);
}
/**
 *
 * @param fileObj The file object containing the path and filename.
 * @description Appends data to a file, creating the directory if it does not exist.
 * @returns A promise that resolves when the data has been appended.
 * @throws Will throw an error if the file cannot be accessed or written to.
 * @param data The data to append to the file.
 */
async function appendDataToFile(fileObj, data) {
    //console.log(`(f) checkDirectory ${JSON.stringify(fileObj)}`);
    if (!fileObj.path.endsWith('/')) {
        fileObj.path += '/';
        //console.log(`"/" wurde an ${fileObj.path} angefügt.`);
    }
    //
    try {
        // Überprüfen und Verzeichnis erstellen, falls es nicht existiert
        await fs_1.promises.mkdir(fileObj.path, { recursive: true });
        // Daten an die Datei anhängen
        const filename = fileObj.path + dynFilename(fileObj); //fileObj.file;
        //console.log(`Filename: ${filename}`);
        await fs_1.promises.appendFile(filename, data);
        console.log(`Daten wurden erfolgreich an die Datei ${filename} angehängt.`);
    }
    catch (error) {
        if (error.code === 'EACCES') {
            console.log('Zugriffsfehler: Sie haben keine Berechtigung zum Anhängen von Daten an die Datei.');
        }
        else if (error.code === 'ENOENT') {
            console.log(`Datei oder Verzeichnis nicht gefunden: ${error.path}`);
        }
        else if (error.code === 'ENOTDIR') {
            console.log(`Pfad ist kein Verzeichnis: ${error.path}`);
        }
        else {
            console.log('Ein unbekannter Fehler ist aufgetreten:');
        }
    }
    //console.log('Fertig');
    //__________________________
    // Dynamic filename for logfiles
    function dynFilename(fileObj) {
        const f = fileObj.file.split('.');
        const dynFile = [f[0], '_', logDate4File(), '.', f[1]].join('');
        return dynFile;
    }
    //
    //__________________________
    // Format date for logfiles
    function logDate4File() {
        const d = new Date();
        const year = d.getFullYear() - 2000;
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    }
}
//# sourceMappingURL=filelogger.js.map