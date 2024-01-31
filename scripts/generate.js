/**
 * This script appends commits to a changeset.
 * It's used to automatically expand upon the changeset without the need for manual work.
 * 
 * `bun package:change` will execute this file along with generating a changeset.
 */

const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

const handleError = (error) => {
  if (error) throw error
}

exec('git rev-parse --abbrev-ref HEAD', (error, stdout, stderr) => {
  handleError(error)
  handleError(stderr)

  exec(
    `git log main..${stdout.trim()} --pretty=format:%s`,
    (logError, logStdout, logStderr) => {
      handleError(logStderr)
      handleError(logError)

      fs.readdir('.changesets', (dirErr, files) => {
        handleError(dirErr)

        const mdFile = files.find((file) => file.endsWith('.md'))
        if (mdFile) {
          const filePath = path.join('.changesets', mdFile)
          fs.readFile(filePath, 'utf8', (readErr, data) => {
            handleError(readErr)

            const commitLines = logStdout
              .split(/(?=feat:|fix:|chore:)/g)
              .filter(Boolean)
              .join('\n')
            const updatedContent = `${data}\n\n${commitLines}`

            fs.writeFile(filePath, updatedContent, 'utf8', (writeErr) => {
              handleError(writeErr)
              console.info(`Commit messages have been appended to ${filePath}`)
            })
          })
        } else {
          handleError(
            new Error(`No changeset file found in .changesets directory`)
          )
        }
      })
    }
  )
})
