# Database Import Guide

This guide explains how to use the database import functionality to restore encrypted MySQL backups from MySqlBackup.NET.

## Overview

The import functionality allows you to restore encrypted database backups (.h149 files) that were created using MySqlBackup.NET (VB.NET). The system will:

1. Decrypt the backup file using the provided password
2. Parse the SQL statements
3. Drop the existing target database (if it exists)
4. Create a new database with the specified name
5. Execute all SQL statements to restore the data

## Features

- **MySqlBackup.NET Compatibility**: Handles .h149 files encrypted with MySqlBackup.NET
- **Multiple Decryption Methods**: Tries different approaches to match the original encryption
- **Progress Tracking**: Real-time progress updates during import
- **Error Handling**: Continues execution even if some statements fail
- **Import History**: Tracks all import operations
- **Database Management**: Automatically handles database creation/dropping

## How to Use

### 1. Access the Import Tab

1. Open the SQL Analyst application
2. Click on the "Import" tab in the navigation bar
3. The import interface will be displayed

### 2. Select Backup File

1. Click "Choose File" or drag and drop a .h149 backup file
2. The file must have a .h149 extension
3. Maximum file size: 100MB

### 3. Configure Import Settings

- **Encryption Password**: Enter the password used to encrypt the backup (default: `090666847`)
- **Target Database**: Specify the name for the restored database (default: `preart`)

### 4. Start Import

1. Click the "Import Backup" button
2. Monitor the progress bar and status messages
3. Wait for completion

## Import Process

The import process follows these steps:

1. **File Upload**: The encrypted backup file is uploaded to the server
2. **Decryption**: The file is decrypted using MySqlBackup.NET compatible methods:
   - **Method 1**: Standard MySqlBackup.NET AES-256-CBC with PBKDF2 key derivation
   - **Method 2**: Alternative salt/key derivation approach
   - **Method 3**: Plain text detection (if file is not encrypted)
   - **Method 4**: CryptoJS fallback methods
3. **SQL Parsing**: The decrypted content is parsed into individual SQL statements
4. **Database Preparation**: The target database is dropped (if exists) and recreated
5. **Statement Execution**: Each SQL statement is executed sequentially
6. **Completion**: Results are reported with success/error counts

## Decryption Methods

The system tries multiple decryption approaches to handle different MySqlBackup.NET configurations:

### Method 1: Standard MySqlBackup.NET
- **Algorithm**: AES-256-CBC
- **Key Derivation**: PBKDF2 with 1000 iterations
- **Salt**: Default salt (`0123456789abcdef`)
- **IV**: First 16 bytes of encrypted data
- **Padding**: PKCS7

### Method 2: Alternative Key Derivation
- **Algorithm**: AES-256-CBC
- **Key Derivation**: PBKDF2 with password as salt
- **IV**: Zero-filled (16 bytes of zeros)
- **Padding**: PKCS7

### Method 3: Plain Text Detection
- Checks if the file is already in plain text SQL format
- Useful for unencrypted backups

### Method 4: CryptoJS Fallback
- Uses CryptoJS with raw buffer approach
- Handles different encoding formats

## Error Handling

- **Invalid Password**: If all decryption methods fail, an error message will be displayed
- **SQL Errors**: Individual statement failures are logged but don't stop the import
- **File Issues**: Invalid file types or corrupted files are rejected
- **Database Errors**: Connection issues or permission problems are reported

## Import History

The system maintains a history of recent imports showing:
- File name and timestamp
- Target database name
- Success/failure status
- Decryption method used
- Number of statements executed
- Number of errors encountered

## Security Considerations

- **Password Protection**: The encryption password is required to decrypt backups
- **File Validation**: Only .h149 files are accepted
- **Temporary Files**: Uploaded files are automatically cleaned up after processing
- **Database Isolation**: Each import creates a fresh database instance

## Troubleshooting

### Common Issues

1. **"All decryption methods failed"**
   - Verify the encryption password is correct
   - Ensure the file is a valid MySqlBackup.NET backup
   - Check if the file is corrupted

2. **"File type not supported"**
   - Make sure the file has a .h149 extension
   - Check that the file is a valid backup

3. **"Database connection failed"**
   - Verify database server is running
   - Check connection settings in the Settings tab

4. **"Permission denied"**
   - Ensure the database user has CREATE/DROP privileges
   - Check file system permissions for uploads

### Testing Decryption

To test decryption before importing:

1. Place your .h149 file in the project directory
2. Run the test script:
   ```bash
   node test-mysqlbackup-decrypt.js yourfile.h149
   ```
3. Check the output to see which decryption method works
4. Review the decrypted SQL file if successful

### Performance Tips

- Large backups may take several minutes to process
- Monitor the progress bar for real-time status
- The system processes statements in batches for better performance

## API Endpoints

### POST /api/import-backup
Upload and import a backup file

**Parameters:**
- `backupFile`: The .h149 backup file (multipart/form-data)
- `encryptionPassword`: Password for decryption
- `targetDatabase`: Name for the restored database

**Response:**
```json
{
  "success": true,
  "message": "Database backup imported successfully",
  "details": {
    "targetDatabase": "preart",
    "decryptionMethod": "MySqlBackup.NET AES-256-CBC",
    "totalStatements": 150,
    "executedStatements": 148,
    "errorCount": 2,
    "errors": [...]
  }
}
```

### GET /api/import-status
Get import functionality status

**Response:**
```json
{
  "success": true,
  "message": "Import functionality is available",
  "supportedFormats": [".h149"],
  "maxFileSize": "100MB"
}
```

## Technical Details

### Encryption Method
- **Library**: node-forge (for MySqlBackup.NET compatibility)
- **Algorithm**: AES-256-CBC with PKCS7 padding
- **Key Derivation**: PBKDF2 with configurable salt and iterations
- **Compatible with**: MySqlBackup.NET 2.0.12

### File Processing
- File upload handled by multer
- Temporary files stored in `uploads/` directory
- Automatic cleanup after processing

### SQL Execution
- Statements executed sequentially
- Error handling per statement
- Transaction support for data integrity

## Migration from VB.NET

If you're migrating from the VB.NET application:

1. **Backup Format**: The .h149 format is fully compatible
2. **Encryption**: Uses the same AES encryption method as MySqlBackup.NET
3. **Password**: Default password `090666847` is preserved
4. **Database**: Target database name can be customized

The import functionality provides a web-based alternative to the VB.NET restore process while maintaining full compatibility with existing backup files.

## Testing

To test the decryption functionality:

1. **Copy your .h149 file** to the project directory
2. **Run the test script**:
   ```bash
   node test-mysqlbackup-decrypt.js yourfile.h149
   ```
3. **Check the output** for successful decryption
4. **Review the generated SQL file** to verify content

This will help identify the correct decryption method for your specific backup files. 