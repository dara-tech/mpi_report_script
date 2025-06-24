import React from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';

const CodeEditor = ({ code, setCode, readOnly = false }) => {
  const highlight = (code) => Prism.highlight(code, Prism.languages.sql, 'sql');

  return (
    <div className="code-editor-wrapper bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-lg">
      <Editor
        value={code}
        onValueChange={setCode}
        highlight={highlight}
        padding={16}
        readOnly={readOnly}
        className="editor font-mono text-sm leading-relaxed"
        style={{
          fontFamily: '"Fira Code", "Fira Mono", monospace',
          fontSize: 14,
        }}
      />
    </div>
  );
};

export default CodeEditor;
