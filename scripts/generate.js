const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')



function appendCommitsToFile(filePath, commitMessages) {
  fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
          console.error(`Error reading file: ${err}`);
          return;
      }

      // Assuming commit messages are separated by a space and should be split into lines
      const commitLines = commitMessages.trim().split(' ').join('\n');

      // Append commit messages to the content, each on a new line
      const updatedContent = `${data}\n\n${commitLines}`;

      // Write the updated content back to the file
      fs.writeFile(filePath, updatedContent, 'utf8', (writeErr) => {
          if (writeErr) {
              console.error(`Error writing to file: ${writeErr}`);
          } else {
              console.log(`Commit messages have been appended to ${filePath}`);
          }
      });
  });
}




// Function to find the Markdown file in .changesets directory
function findMarkdownFileAndAppendCommits(commitMessages) {
  fs.readdir('.changeset', (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${err}`)
      return
    }

    const mdFile = files.find((file) => file.endsWith('.md'))
    if (mdFile) {
      appendCommitsToFile(path.join('.changeset', mdFile), commitMessages)
    } else {
      console.error('No Markdown file found in .changesets directory')
    }
  })
}

// Get the current branch name and fetch commits
exec('git rev-parse --abbrev-ref HEAD', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`)
    return
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`)
    return
  }

  const currentBranch = stdout.trim()
  exec(
    `git log main..${currentBranch} --pretty=format:%s`,
    (logError, logStdout, logStderr) => {
      if (logError) {
        console.error(`Error: ${logError.message}`)
        return
      }
      if (logStderr) {
        console.error(`Stderr: ${logStderr}`)
        return
      }

      findMarkdownFileAndAppendCommits(logStdout)
    }
  )
})
