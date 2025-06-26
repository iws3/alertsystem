"use client"
// components/FileUpload.tsx
import React, { useCallback } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import Papa, { ParseResult } from 'papaparse';
import { UploadCloud, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileProcessed: (data: Record<string, any>[], fileName: string) => void;
  acceptedTypes?: string; // e.g., '.csv'
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed, acceptedTypes = '.csv' }) => {
  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const csvText = event.target?.result as string;
          if (!csvText) {
            alert("Could not read file content.");
            return;
          }
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true, // Automatically converts numbers
            complete: (results: ParseResult<Record<string, any>>) => {
              if (results.errors.length > 0) {
                console.error("CSV Parsing Errors:", results.errors);
                alert("Error parsing CSV file: " + results.errors.map(e => e.message).join('\n'));
                return;
              }
              onFileProcessed(results.data, file.name);
            },
            error: (error: Error) => { // PapaParse ParseError might be more specific
              console.error("CSV Parsing Error:", error);
              alert("Error parsing CSV file: " + error.message);
            }
          });
        } catch (e: any) {
            console.error("File Reading Error:", e);
            alert("Error reading file: " + e.message);
        }
      };
      reader.readAsText(file);
    }
  }, [onFileProcessed]);

  const acceptConfig: { [key: string]: string[] } = {};
  if (acceptedTypes === '.csv') {
    acceptConfig['text/csv'] = [acceptedTypes];
  } else {
    // Handle other types or provide a more generic way
    acceptConfig[acceptedTypes] = [acceptedTypes];
  }


  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: acceptConfig,
    maxFiles: 1,
  });

  const acceptedFile = acceptedFiles[0];

  return (
    <div
      {...getRootProps()}
      className={`p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center">
        <UploadCloud size={40} className="text-gray-400 mb-3" />
        {isDragActive ? (
          <p className="text-blue-600 font-semibold">Drop the files here ...</p>
        ) : (
          <p className="text-gray-500">
            Drag 'n' drop a {acceptedTypes} file here, or click to select file
          </p>
        )}
        {acceptedFile && (
          <div className="mt-3 bg-green-50 p-2 rounded-md flex items-center text-sm text-green-700">
            <FileText size={16} className="mr-2" />
            Selected: {acceptedFile.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;